// Armazenamento de tarefas no localStorage
const STORAGE_KEY = 'tarefas';

// Estado da aplicação
let tarefas = [];
let filtroAtivo = 'todas';
let termoBusca = '';

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    carregarTarefas();
    renderizarTarefas();
    setupEventListeners();
});

// Configurar listeners de eventos
function setupEventListeners() {
    const form = document.getElementById('formTarefa');
    const searchInput = document.getElementById('searchInput');
    const formEditar = document.getElementById('formEditar');

    if (form) {
        form.addEventListener('submit', adicionarTarefa);
    }

    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            termoBusca = searchInput.value.toLowerCase();
            renderizarTarefas();
        });
    }

    if (formEditar) {
        formEditar.addEventListener('submit', salvarEdicao);
    }

    // Fechar modal ao clicar fora
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('modalEditar');
        if (event.target === modal) {
            fecharModal();
        }
    });
}

// RF-01: Adicionar nova tarefa
function adicionarTarefa(event) {
    event.preventDefault();

    const titulo = document.getElementById('tituloTarefa').value.trim();
    const descricao = document.getElementById('descricaoTarefa').value.trim();
    const data = document.getElementById('dataTarefa').value;
    const categoria = document.getElementById('categoriaTarefa').value;
    const prioridade = document.getElementById('prioridadeTarefa').checked;

    if (!titulo) {
        alert('Por favor, digite um título para a tarefa!');
        return;
    }

    const novaTarefa = {
        id: Date.now(),
        titulo,
        descricao,
        data,
        categoria,
        prioridade,
        status: 'ativa',
        dataCriacao: new Date().toLocaleDateString('pt-BR')
    };

    tarefas.push(novaTarefa);
    salvarTarefas();
    
    // Limpar campos individualmente em vez de usar reset()
    document.getElementById('tituloTarefa').value = '';
    document.getElementById('descricaoTarefa').value = '';
    document.getElementById('dataTarefa').value = '';
    document.getElementById('categoriaTarefa').value = '';
    document.getElementById('prioridadeTarefa').checked = false;
    
    renderizarTarefas();
    alert('Tarefa adicionada com sucesso!');
}

// RF-04: Finalizar tarefa
function finalizarTarefa(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa) {
        tarefa.status = 'finalizada';
        salvarTarefas();
        renderizarTarefas();
    }
}

// RF-03: Cancelar tarefa
function cancelarTarefa(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa) {
        tarefa.status = 'cancelada';
        salvarTarefas();
        renderizarTarefas();
    }
}

// RF-02: Marcar/desmarcar como prioridade
function togglePrioridade(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa) {
        tarefa.prioridade = !tarefa.prioridade;
        salvarTarefas();
        renderizarTarefas();
    }
}

// Deletar tarefa
function deletarTarefa(id) {
    if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
        tarefas = tarefas.filter(t => t.id !== id);
        salvarTarefas();
        renderizarTarefas();
    }
}

// Abrir modal de edição
function abrirModal(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (!tarefa) return;

    document.getElementById('editarId').value = tarefa.id;
    document.getElementById('editarTitulo').value = tarefa.titulo;
    document.getElementById('editarDescricao').value = tarefa.descricao;
    document.getElementById('editarData').value = tarefa.data;
    document.getElementById('editarCategoria').value = tarefa.categoria;
    document.getElementById('editarPrioridade').checked = tarefa.prioridade;

    document.getElementById('modalEditar').style.display = 'block';
}

// Fechar modal
function fecharModal() {
    document.getElementById('modalEditar').style.display = 'none';
}

// Salvar edição
function salvarEdicao(event) {
    event.preventDefault();

    const id = parseInt(document.getElementById('editarId').value);
    const tarefa = tarefas.find(t => t.id === id);

    const titulo = document.getElementById('editarTitulo').value.trim();

    if (!titulo) {
        alert('Por favor, digite um título para a tarefa!');
        return;
    }

    if (tarefa) {
        tarefa.titulo = titulo;
        tarefa.descricao = document.getElementById('editarDescricao').value.trim();
        tarefa.data = document.getElementById('editarData').value;
        tarefa.categoria = document.getElementById('editarCategoria').value;
        tarefa.prioridade = document.getElementById('editarPrioridade').checked;

        salvarTarefas();
        renderizarTarefas();
        fecharModal();
        alert('Tarefa atualizada com sucesso!');
    }
}

// RF-07: Pesquisar tarefas por atributos
function pesquisarTarefas() {
    termoBusca = document.getElementById('searchInput').value.toLowerCase();
    renderizarTarefas();
}

// RF-05 e RF-06: Filtrar tarefas
function filtrarTarefas(filtro) {
    filtroAtivo = filtro;

    // Atualizar botões de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const btnAtivo = document.querySelector(`[data-filter="${filtro}"]`);
    if (btnAtivo) {
        btnAtivo.classList.add('active');
    }

    renderizarTarefas();
}

// Renderizar lista de tarefas
function renderizarTarefas() {
    const container = document.getElementById('listagemTarefas');
    let tarefasFilutradas = aplicarFiltrosEBusca();

    if (tarefasFilutradas.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhuma tarefa encontrada.</p>';
        return;
    }

    container.innerHTML = tarefasFilutradas.map(tarefa => criarCardTarefa(tarefa)).join('');
}

// Aplicar filtros e busca
function aplicarFiltrosEBusca() {
    let tarefasFilutradas = tarefas;

    // Filtro por status
    if (filtroAtivo === 'ativas') {
        tarefasFilutradas = tarefasFilutradas.filter(t => t.status === 'ativa');
    } else if (filtroAtivo === 'finalizadas') {
        tarefasFilutradas = tarefasFilutradas.filter(t => t.status === 'finalizada');
    } else if (filtroAtivo === 'canceladas') {
        tarefasFilutradas = tarefasFilutradas.filter(t => t.status === 'cancelada');
    } else if (filtroAtivo === 'prioridade') {
        tarefasFilutradas = tarefasFilutradas.filter(t => t.prioridade);
    }

    // RF-07: Filtro de busca por atributos
    if (termoBusca) {
        tarefasFilutradas = tarefasFilutradas.filter(t => {
            return (
                t.titulo.toLowerCase().includes(termoBusca) ||
                t.descricao.toLowerCase().includes(termoBusca) ||
                t.categoria.toLowerCase().includes(termoBusca) ||
                t.dataCriacao.includes(termoBusca)
            );
        });
    }

    return tarefasFilutradas;
}

// Criar card HTML de tarefa
function criarCardTarefa(tarefa) {
    const classesCard = [
        'task-card',
        tarefa.status === 'finalizada' ? 'finished' : '',
        tarefa.status === 'cancelada' ? 'canceled' : '',
        tarefa.prioridade ? 'priority' : ''
    ].filter(Boolean).join(' ');

    const statusClass = `status-badge ${tarefa.status}`;
    const statusTexto = {
        'ativa': 'Ativa',
        'finalizada': 'Finalizada',
        'cancelada': 'Cancelada'
    }[tarefa.status];

    return `
        <div class="${classesCard}">
            <div class="task-content">
                <div class="task-header">
                    <h3 class="task-title">${escaparHTML(tarefa.titulo)}</h3>
                    ${tarefa.prioridade ? '<span class="priority-badge">⭐ Prioritária</span>' : ''}
                    <span class="${statusClass}">${statusTexto}</span>
                </div>

                ${tarefa.descricao ? `<p class="task-description">${escaparHTML(tarefa.descricao)}</p>` : ''}

                <div class="task-meta">
                    ${tarefa.categoria ? `<span class="meta-item">📂 ${escaparHTML(tarefa.categoria)}</span>` : ''}
                    ${tarefa.data ? `<span class="meta-item">📅 ${tarefa.data}</span>` : ''}
                    <span class="meta-item">📝 Criada em ${tarefa.dataCriacao}</span>
                </div>
            </div>

            <div class="task-actions">
                ${tarefa.status === 'ativa' ? `
                    <button class="btn-action btn-finish" onclick="finalizarTarefa(${tarefa.id})">
                        ✓ Finalizar
                    </button>
                ` : ''}

                ${tarefa.status !== 'cancelada' && tarefa.status !== 'finalizada' ? `
                    <button class="btn-action btn-cancel" onclick="cancelarTarefa(${tarefa.id})">
                        ✕ Cancelar
                    </button>
                ` : ''}

                ${tarefa.status === 'ativa' ? `
                    <button class="btn-action btn-priority" onclick="togglePrioridade(${tarefa.id})">
                        ${tarefa.prioridade ? '⭐ Remover Prioridade' : '☆ Priorizar'}
                    </button>
                ` : ''}

                ${tarefa.status === 'ativa' ? `
                    <button class="btn-action btn-edit" onclick="abrirModal(${tarefa.id})">
                        ✎ Editar
                    </button>
                ` : ''}

                <button class="btn-action btn-delete" onclick="deletarTarefa(${tarefa.id})">
                    🗑 Deletar
                </button>
            </div>
        </div>
    `;
}

// Utilitário: escapar HTML para evitar XSS
function escaparHTML(texto) {
    const mapa = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return texto.replace(/[&<>"']/g, m => mapa[m]);
}

// Salvar tarefas no localStorage
function salvarTarefas() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
}

// Carregar tarefas do localStorage
function carregarTarefas() {
    const dados = localStorage.getItem(STORAGE_KEY);
    tarefas = dados ? JSON.parse(dados) : [];
}
