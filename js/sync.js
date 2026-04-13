/**
 * MÓDULO DE SINCRONIZAÇÃO
 * Lida com o tráfego de dados entre o IndexedDB e o Google Apps Script
 */

async function sincronizarTudo(feedbackVisual = false) {
    if (!navigator.onLine) {
        if (feedbackVisual) alert("Você está offline. O sync será feito automaticamente depois.");
        console.log("Offline: Sincronização adiada.");
        return false;
    }

    if (feedbackVisual) mostrarStatusSync("Sincronizando...", "var(--primary)");

    try {
        // Sincroniza todas as tabelas sequencialmente
        await syncTabela('ficha1', 'saveFicha1');
        await syncTabela('ficha3', 'saveFicha3');
        await syncTabela('ficha4', 'saveFicha4');

        if (feedbackVisual) mostrarStatusSync("Atualizado ✓", "var(--success)");
        
        // Atualiza a interface da lista (se a função existir no contexto)
        if (typeof carregarRegistros === "function") carregarRegistros();
        
        return true;
    } catch (erro) {
        console.error("Erro geral de sincronização:", erro);
        if (feedbackVisual) mostrarStatusSync("Erro no Sync ❌", "red");
        return false;
    }
}

async function syncTabela(storeName, actionType) {
    const todosRegistros = await listarRegistros(storeName);
    const pendentes = todosRegistros.filter(reg => !reg.synced);

    if (pendentes.length === 0) {
        console.log(`[${storeName}] Nada para sincronizar.`);
        return;
    }

    console.log(`[${storeName}] Enviando ${pendentes.length} registros...`);

    const payload = {
        action: actionType,
        data: pendentes
    };

    // Chamada à API
    const resposta = await fetch(appConfig.api.url, {
        method: 'POST',
        // Não definimos headers para evitar o bloqueio de CORS (Preflight) do Google
        body: JSON.stringify(payload) 
    });

    const resultado = await resposta.json();

    if (resultado.status === "success") {
        // Marca os registros enviados como sincronizados localmente
        for (let reg of pendentes) {
            reg.synced = true;
            await atualizarRegistro(storeName, reg);
        }
        console.log(`[${storeName}] Sincronizado com sucesso!`);
    } else {
        throw new Error(resultado.message || "Falha na resposta do servidor.");
    }
}

// Função utilitária para alterar o botão visualmente
function mostrarStatusSync(texto, cor) {
    const btn = document.getElementById('btn-sync');
    if (!btn) return;
    
    const txtOriginal = btn.dataset.original || btn.innerText;
    btn.dataset.original = txtOriginal; // Salva o texto original
    
    btn.innerText = texto;
    btn.style.color = cor;
    btn.style.borderColor = cor;
    
    setTimeout(() => {
        btn.innerText = btn.dataset.original;
        btn.style.color = '';
        btn.style.borderColor = '';
    }, 2500);
}

// --- GATILHOS AUTOMÁTICOS ---

// Sincroniza automaticamente quando a conexão com a internet for restaurada
window.addEventListener('online', () => {
    console.log("Internet restaurada! Iniciando sincronização em background...");
    sincronizarTudo(false); // background (sem alert)
});