document.addEventListener('DOMContentLoaded', async () => {
    // Configurações iniciais
    document.getElementById('header-title').innerText = `Diário - ${appConfig.estagiario.nome}`;
    document.getElementById('data').valueAsDate = new Date();
    
    await initDB();
    carregarRegistros();

    // Evento de Salvar Nova Atividade
    document.getElementById('form-atividade').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const registro = {
            atividade: document.getElementById('atividade').value,
            data: document.getElementById('data').value,
            turno: document.getElementById('turno').value,
            carga_horaria: document.getElementById('horas').value, // Ajustado pro GAS
            synced: false, // Compatível com o GAS
            timestamp: new Date().getTime()
        };

        try {
            await salvarRegistro('ficha1', registro);
            document.getElementById('atividade').value = ''; 
            carregarRegistros();
            
            // Tenta sincronizar em background ao salvar
            if (navigator.onLine && typeof sincronizarTudo === 'function') {
                sincronizarTudo(false);
            }

            // Feedback visual rápido
            const btn = document.querySelector('button[type="submit"]');
            const txtOriginal = btn.innerText;
            btn.innerText = "Salvo Localmente! ✓";
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
}); // <-- AQUI: Faltava este fechamento de bloco no código anterior

async function carregarRegistros() {
    const registros = await listarRegistros('ficha1');
    const ul = document.getElementById('lista-atividades');
    ul.innerHTML = '';
    
    // Lista do mais recente para o mais antigo
    registros.sort((a, b) => b.timestamp - a.timestamp).forEach(reg => {
        const statusIcon = reg.synced ? "☁️" : "⏳"; // Nuvem = ok, Ampulheta = pendente
        
        const li = document.createElement('li');
        li.innerHTML = `
            <div>${reg.atividade}</div>
            <div class="meta">
                <span>📅 ${reg.data.split('-').reverse().join('/')} - ${reg.turno}</span>
                <span>⏱️ ${reg.carga_horaria}h <span title="Status da Nuvem">${statusIcon}</span></span>
            </div>
        `;
        ul.appendChild(li);
    });
}

// Registro do Service Worker para funcionamento Offline
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log("Service Worker Registrado com sucesso!"))
        .catch(err => console.error("Erro no Service Worker:", err));
}