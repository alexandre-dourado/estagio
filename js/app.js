// Variáveis Globais de Controle
let estagioAtual = 7;
let fotoBase64 = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa o aplicativo completo (banco, selects e dashboard)
    await initApp();

    // Define a data de hoje no formulário
    document.getElementById('data').valueAsDate = new Date();

    // Evento de Salvar Nova Atividade no Diário
    document.getElementById('form-diario').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const registro = {
            estagio_id: estagioAtual, // Identifica se é do 7º ou 8º
            atividade_tipo: document.getElementById('tipo_atividade').value,
            atividade: document.getElementById('atividade').value,
            data: document.getElementById('data').value,
            carga_horaria: parseFloat(document.getElementById('horas').value),
            foto: fotoBase64, // A imagem convertida em texto (Base64)
            synced: false,
            timestamp: new Date().getTime()
        };

        try {
            await salvarRegistro('ficha1', registro);
            
            // Limpa o formulário após salvar
            document.getElementById('atividade').value = ''; 
            document.getElementById('horas').value = '';
            document.getElementById('foto-preview').innerHTML = '';
            fotoBase64 = null; // Reseta a variável da foto
            
            // Atualiza a tela (Barras de progresso e Lista)
            carregarDashboard();
            carregarRegistros();
            
            // Tenta sincronizar em background
            if (navigator.onLine && typeof sincronizarTudo === 'function') {
                sincronizarTudo(false);
            }

            // Feedback visual rápido no botão
            const btn = document.querySelector('button[type="submit"]');
            const txtOriginal = btn.innerText;
            btn.innerText = "Salvo no Diário! ✓";
            btn.classList.add('btn-success');
            setTimeout(() => { btn.innerText = txtOriginal; btn.classList.remove('btn-success'); }, 1500);
            
        } catch (error) {
            console.error("Erro ao salvar", error);
            alert("Erro ao salvar localmente.");
        }
    });

    // Conecta botão de sincronização manual
    const btnSync = document.getElementById('btn-sync');
    if (btnSync) {
        btnSync.addEventListener('click', () => {
            if(typeof sincronizarTudo === 'function') {
                sincronizarTudo(true); // true exibe feedback visual
            } else {
                alert("Módulo de sincronização não encontrado.");
            }
        });
    }
});

// --- FUNÇÕES DE INICIALIZAÇÃO E UI ---

async function initApp() {
    await initDB();
    
    // Atualiza o título com o nome da config
    const tituloEl = document.getElementById('header-title');
    if(tituloEl) tituloEl.innerText = `Diário - ${appConfig.usuario.nome}`;
    
    renderizarSelects();
    await switchEstagio(7); // Isso já puxa o Dashboard e os Registros do 7º estágio
}

function renderizarSelects() {
    const select = document.getElementById('tipo_atividade');
    select.innerHTML = appConfig.tiposAtividade.map(t => `<option value="${t}">${t}</option>`).join('');
}

async function switchEstagio(id) {
    estagioAtual = id;
    const config = appConfig.estagios[id];
    
    // Atualiza a Interface (Botões, Títulos e Cores)
    document.querySelectorAll('.sel-btn').forEach(b => b.classList.toggle('active', b.innerText.includes(id)));
    document.getElementById('estagio-titulo').innerText = config.titulo;
    document.getElementById('estagio-info').innerText = `${config.escola} | Prof. ${config.professor}`;
    document.documentElement.style.setProperty('--primary', config.cor);
    
    // Recarrega os dados para o estágio selecionado
    await carregarDashboard();
    await carregarRegistros();
}

async function carregarDashboard() {
    const todos = await listarRegistros('ficha1');
    const logsEstagio = todos.filter(r => r.estagio_id == estagioAtual);
    const totalHoras = logsEstagio.reduce((acc, curr) => acc + parseFloat(curr.carga_horaria), 0);
    const meta = appConfig.estagios[estagioAtual].metaHoras;
    
    // Atualiza Barra Principal
    const perc = Math.min((totalHoras / meta) * 100, 100);
    const barTotal = document.getElementById('bar-total');
    if(barTotal) barTotal.style.width = `${perc}%`;
    
    const horasAtuaisEl = document.getElementById('horas-atuaus');
    if(horasAtuaisEl) horasAtuaisEl.innerText = totalHoras;
    
    const horasMetaEl = document.getElementById('horas-meta');
    if(horasMetaEl) horasMetaEl.innerText = meta;

    // Estatísticas Detalhadas por Categoria
    const stats = {};
    appConfig.tiposAtividade.forEach(t => stats[t] = 0);
    logsEstagio.forEach(l => {
        if(stats[l.atividade_tipo] !== undefined) {
            stats[l.atividade_tipo] += parseFloat(l.carga_horaria);
        }
    });

    const grid = document.getElementById('stats-detalhado');
    if(grid) {
        grid.innerHTML = Object.entries(stats).map(([tipo, h]) => `
            <div class="stat-item">
                <small>${tipo}</small>
                <strong>${h}h</strong>
            </div>
        `).join('');
    }
}

async function carregarRegistros() {
    const todos = await listarRegistros('ficha1');
    
    // Filtra para mostrar APENAS a lista do estágio atual
    const registros = todos.filter(r => r.estagio_id == estagioAtual);
    
    const ul = document.getElementById('lista-atividades');
    if(!ul) return;
    
    ul.innerHTML = '';
    
    // Lista do mais recente para o mais antigo
    registros.sort((a, b) => b.timestamp - a.timestamp).forEach(reg => {
        const statusIcon = reg.synced ? "☁️" : "⏳"; 
        const fotoIcon = reg.foto ? " 📸" : ""; // Indica se tem foto salva
        
        const li = document.createElement('li');
        li.innerHTML = `
            <div><strong>${reg.atividade_tipo}</strong>: ${reg.atividade}</div>
            <div class="meta">
                <span>📅 ${reg.data.split('-').reverse().join('/')}${fotoIcon}</span>
                <span>⏱️ ${reg.carga_horaria}h <span title="Status da Nuvem">${statusIcon}</span></span>
            </div>
        `;
        ul.appendChild(li);
    });
}

// Handler da Foto (Pré-visualização e Conversão)
function previewFoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            fotoBase64 = e.target.result;
            const previewEl = document.getElementById('foto-preview');
            if(previewEl) {
                previewEl.innerHTML = `<img src="${fotoBase64}" style="width:100%; max-height: 200px; object-fit: cover; border-radius:8px; margin-top:10px;">`;
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Registro do Service Worker para funcionamento Offline
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log("Service Worker Registrado com sucesso!"))
        .catch(err => console.error("Erro no Service Worker:", err));
}