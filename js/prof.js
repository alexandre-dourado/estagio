const opcoes = ["O", "MB", "B", "R", "F"];

// DADOS DA FICHA 3 (Simples)
const ficha3Dados = [
    "Observação das aulas",
    "Caracterização de turma",
    "Relação com os alunos",
    "Responsabilidade",
    "Utilização de recursos didáticos na Monitoria",
    "Compromisso com a aprendizagem dos alunos",
    "Incentivo durante a Monitoria e a participação dos alunos",
    "Domínio de conteúdo para execução da Monitoria",
    "Uso de linguagem adequada",
    "Relação com os alunos (2)", // Identificador alterado para visualização/salvamento
    "Responsabilidade (2)",      // Identificador alterado para visualização/salvamento
    "Apresentação pessoal (postura, discrição, trajes)",
    "Equilíbrio emocional",
    "Comportamento ético"
];

// DADOS DA FICHA 4 (Categorizados)
const ficha4Dados = [
    {
        categoria: "1 – Quanto aos planejamentos",
        itens: [
            "Colocação dos itens necessários", "Clareza", "Criatividade", 
            "Apresentação e redação dos objetivos", "Recursos didáticos", 
            "Procedimentos didáticos", "Avaliação"
        ]
    },
    {
        categoria: "2 – Quanto ao conteúdo específico",
        itens: [
            "Exatidão dos conceitos, termos, exemplos", "Adequação à classe", "Atualização", 
            "Aplicabilidade", "Manutenção da seqüência lógica", "Domínio do conteúdo", 
            "Segurança nas técnicas desenvolvidas"
        ]
    },
    {
        categoria: "3 – Quanto ao comportamento",
        itens: [
            "Precisão com as quais executa as tarefas integrantes do planejamento de estágio",
            "Atendimento às solicitações nos prazos estabelecidos",
            "Iniciativa na resolução dos problemas surgidos",
            "Empenho em superar as próprias limitações",
            "Maneja com segurança as atividades, revelando conhecimento",
            "Assiduidade nas aulas de Prática de Ensino",
            "Interesse pelos trabalhos de estágio",
            "Presença participante nos plantões pedagógicos",
            "Controle emocional"
        ]
    },
    {
        categoria: "4 - Quanto á regência de aula",
        itens: [
            "Alcance dos objetivos",
            "Incentivação das aulas: adequação ao assunto e nível da classe",
            "Utilização de recursos didáticos",
            "Distribuição do tempo",
            "Adequação dos procedimentos didáticos aos objetivos propostos e nível dos alunos",
            "Adequação dos conteúdos em: Função do nível de experiência dos alunos / Correta progressão",
            "Capacidade de expressar bem o pensamento",
            "Manejo de classe: Proporciona participação ativa / Resolve situações com habilidade",
            "Manutenção do interesse da classe",
            "Manutenção da disciplina: Utiliza comportamentos adequados / Emprega procedimentos adequados",
            "Adequação dos recursos de avaliação: Utiliza instrumentos adequados / Observa a individualidade"
        ]
    }
];

document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    
    // Gera as interfaces
    gerarListaSimples('criterios-ficha3', ficha3Dados, 'f3');
    gerarListaCategorizada('criterios-ficha4', ficha4Dados, 'f4');

    // Lógica das abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.target).classList.add('active');
        });
    });
});

// Gera HTML para lista plana (Ficha 3)
function gerarListaSimples(containerId, lista, prefixo) {
    const container = document.getElementById(containerId);
    let html = '';
    lista.forEach((criterio, index) => {
        const idCriterio = `${prefixo}_${index}`; // ID único para não sobrescrever chaves
        html += templateLinhaAvaliacao(criterio, idCriterio);
    });
    container.innerHTML = html;
}

// Gera HTML para lista em categorias (Ficha 4)
function gerarListaCategorizada(containerId, listaCategorias, prefixo) {
    const container = document.getElementById(containerId);
    let html = '';
    listaCategorias.forEach((cat, catIndex) => {
        html += `<h3 class="categoria-titulo">${cat.categoria}</h3>`;
        cat.itens.forEach((criterio, itemIndex) => {
            const idCriterio = `${prefixo}_c${catIndex}_i${itemIndex}`;
            // Salvamos o nome original do critério no atributo data-nome
            html += templateLinhaAvaliacao(criterio, idCriterio);
        });
    });
    container.innerHTML = html;
}

// Template reutilizável da linha de botões O, MB, B, R, F
function templateLinhaAvaliacao(textoCriterio, id) {
    let html = `
    <div class="eval-row" data-id="${id}" data-nome="${textoCriterio}">
        <p><strong>${textoCriterio}</strong></p>
        <div class="eval-options">`;
    opcoes.forEach(op => {
        html += `<button type="button" class="eval-btn" onclick="selecionarOpcao(this)">${op}</button>`;
    });
    html += `</div></div>`;
    return html;
}

// Ação de clique nos botões de nota
function selecionarOpcao(btn) {
    const linha = btn.closest('.eval-row');
    linha.querySelectorAll('.eval-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// Lógica para capturar e salvar os formulários
async function salvarAvaliacao(ficha) {
    const tab = document.getElementById(ficha);
    const avaliacoes = {};
    let incompleto = false;

    // Coleta as notas usando o texto original da pergunta como Chave do JSON
    tab.querySelectorAll('.eval-row').forEach(row => {
        const selected = row.querySelector('.eval-btn.selected');
        const nomeCriterio = row.getAttribute('data-nome');
        
        if (selected) {
            avaliacoes[nomeCriterio] = selected.innerText;
        } else {
            incompleto = true;
        }
    });

    if (incompleto) {
        alert("Por favor, selecione uma nota para todos os critérios.");
        return;
    }

    // Coleta observações dependendo da ficha
    let obsText = "";
    if (ficha === 'ficha3') {
        obsText = document.getElementById('obs-ficha3').value;
    } else if (ficha === 'ficha4') {
        const pos = document.getElementById('obs-positivos').value;
        const neg = document.getElementById('obs-negativos').value;
        obsText = JSON.stringify({ positivos: pos, negativos: neg }); // Envia como JSON pro GAS
    }

    const registro = {
        campo: `avaliação_${ficha}`, 
        valor: JSON.stringify(avaliacoes), 
        data: new Date().toISOString().split('T')[0],
        professor: appConfig.estagiario.instituicao, // ou outro dado de config
        observacao: obsText,
        synced: false,
        timestamp: new Date().getTime()
    };

    try {
        await salvarRegistro(ficha, registro);
        alert(`${ficha.toUpperCase()} salva localmente com sucesso!`);
        
        // Limpa formulário
        tab.querySelectorAll('.eval-btn').forEach(b => b.classList.remove('selected'));
        if(ficha === 'ficha3') document.getElementById('obs-ficha3').value = '';
        if(ficha === 'ficha4') {
            document.getElementById('obs-positivos').value = '';
            document.getElementById('obs-negativos').value = '';
        }
        
        // Tenta sincronizar
        if (navigator.onLine && typeof sincronizarTudo === 'function') {
            sincronizarTudo(false);
        }

    } catch (e) {
        console.error(e);
        alert("Erro ao salvar no banco local.");
    }
}