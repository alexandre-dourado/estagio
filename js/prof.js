const criteriosFicha3 = ["Assiduidade", "Pontualidade", "Iniciativa", "Responsabilidade"];
const criteriosFicha4 = ["Domínio Técnico", "Relacionamento Interpessoal", "Qualidade do Trabalho", "Organização"];
const opcoes = ["O", "MB", "B", "R", "F"]; // Ótimo, Muito Bom, Bom, Regular, Fraco

document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    gerarCriterios('criterios-ficha3', criteriosFicha3);
    gerarCriterios('criterios-ficha4', criteriosFicha4);

    // Lógica das Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });
});

function gerarCriterios(containerId, lista) {
    const container = document.getElementById(containerId);
    lista.forEach(criterio => {
        const idCriterio = criterio.toLowerCase().replace(/\s/g, '');
        let html = `<div class="eval-row" data-criterio="${idCriterio}">
            <p>${criterio}</p>
            <div class="eval-options">`;
        opcoes.forEach(op => {
            html += `<button type="button" class="eval-btn" onclick="selecionarOpcao(this, '${idCriterio}')">${op}</button>`;
        });
        html += `</div></div>`;
        container.innerHTML += html;
    });
}

function selecionarOpcao(btn, criterioId) {
    // Remove selected da mesma linha
    const linha = btn.closest('.eval-row');
    linha.querySelectorAll('.eval-btn').forEach(b => b.classList.remove('selected'));
    // Adiciona selected no clicado
    btn.classList.add('selected');
}

async function salvarAvaliacao(ficha) {
    const tab = document.getElementById(ficha);
    const avaliacoes = {};
    let incompleto = false;

    // 1. Coleta as opções marcadas
    tab.querySelectorAll('.eval-row').forEach(row => {
        const selected = row.querySelector('.eval-btn.selected');
        if (selected) {
            avaliacoes[row.dataset.criterio] = selected.innerText;
        } else {
            incompleto = true;
        }
    });

    if (incompleto) {
        alert("Por favor, preencha todos os critérios.");
        return;
    }

    const obs = document.getElementById(`obs-${ficha}`).value;
    
    // 2. Prepara o objeto (compatível com Apps Script)
    const registro = {
        campo: "avaliação_geral", 
        valor: JSON.stringify(avaliacoes), // guarda as notas
        data: new Date().toISOString().split('T')[0],
        professor: "Não Identificado", // No futuro, pode puxar do login/config
        observacao: obs,
        synced: false,
        timestamp: new Date().getTime()
    };

    try {
        await salvarRegistro(ficha, registro);
        alert(`${ficha.toUpperCase()} salva localmente!`);
        
        // Limpa formulário da tela
        tab.querySelectorAll('.eval-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById(`obs-${ficha}`).value = '';
        
        // Tenta sincronizar se tiver internet
        if (navigator.onLine && typeof sincronizarTudo === 'function') {
            sincronizarTudo(false);
        }

    } catch (e) {
        console.error(e);
        alert("Erro ao salvar no banco local.");
    }
}