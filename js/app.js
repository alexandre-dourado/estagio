document.addEventListener('DOMContentLoaded', async () => {
    // Configurações iniciais
    document.getElementById('header-title').innerText = `Diário - ${appConfig.estagiario.nome}`;
    document.getElementById('data').valueAsDate = new Date();
    
    await initDB();
    carregarRegistros();

    document.getElementById('form-atividade').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const registro = {
            atividade: document.getElementById('atividade').value,
            data: document.getElementById('data').value,
            turno: document.getElementById('turno').value,
            horas: document.getElementById('horas').value,
            sync: false,
            timestamp: new Date().getTime()
        };

        try {
            await salvarRegistro('ficha1', registro);
            document.getElementById('atividade').value = ''; 
            carregarRegistros();
            // Feedback visual rápido
            const btn = document.querySelector('button[type="submit"]');
            const txtOriginal = btn.innerText;
            btn.innerText = "Salvo! ✓";
            btn.classList.add('btn-success');
            setTimeout(() => { btn.innerText = txtOriginal; btn.classList.remove('btn-success'); }, 1500);
        } catch (error) {
            console.error("Erro ao salvar", error);
            alert("Erro ao salvar localmente.");
        }
    });

    document.getElementById('btn-sync').addEventListener('click', () => {
        alert("Sincronização em nuvem não implementada neste PWA base.");
    });
});

async function carregarRegistros() {
    const registros = await listarRegistros('ficha1');
    const ul = document.getElementById('lista-atividades');
    ul.innerHTML = '';
    
    // Ordenar do mais recente para o mais antigo
    registros.sort((a, b) => b.timestamp - a.timestamp).forEach(reg => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>${reg.atividade}</div>
            <div class="meta">
                <span>📅 ${reg.data.split('-').reverse().join('/')} - ${reg.turno}</span>
                <span>⏱️ ${reg.horas}h</span>
            </div>
        `;
        ul.appendChild(li);
    });
}

// Registro do Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log("Service Worker Registrado"))
        .catch(err => console.error("Erro no Service Worker", err));
}