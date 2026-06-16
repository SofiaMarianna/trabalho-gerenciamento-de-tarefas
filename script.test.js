// ============================================
// TESTES AUTOMATIZADOS COM JEST
// Gerenciador de Tarefas
// ============================================

const fs = require('fs');
const path = require('path');

// Mock do localStorage para os testes de unidade
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true
});

const { TextEncoder, TextDecoder } = require('util');

if (typeof globalThis.TextEncoder === 'undefined') {
    globalThis.TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
    globalThis.TextDecoder = TextDecoder;
}

const { JSDOM } = require('jsdom');

// Adapter SQLite usado somente nos testes de integração e sistema
const initSqlJs = require('sql.js/dist/sql-wasm.js');

class SQLiteLocalStorage {
    constructor(Database) {
        this.db = new Database();
        this.db.run(`
            CREATE TABLE IF NOT EXISTS storage (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `);
    }

    getItem(key) {
        const statement = this.db.prepare('SELECT value FROM storage WHERE key = ?');
        statement.bind([key]);

        if (!statement.step()) {
            statement.free();
            return null;
        }

        const row = statement.getAsObject();
        statement.free();
        return row.value;
    }

    setItem(key, value) {
        this.db.run('INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?)', [key, value.toString()]);
    }

    removeItem(key) {
        this.db.run('DELETE FROM storage WHERE key = ?', [key]);
    }

    clear() {
        this.db.run('DELETE FROM storage');
    }

    key(index) {
        const statement = this.db.prepare('SELECT key FROM storage ORDER BY key LIMIT 1 OFFSET ?', [index]);
        statement.bind([index]);

        if (!statement.step()) {
            statement.free();
            return null;
        }

        const row = statement.getAsObject();
        statement.free();
        return row.key;
    }

    get length() {
        const result = this.db.exec('SELECT COUNT(*) AS total FROM storage');
        return result.length > 0 ? result[0].values[0][0] : 0;
    }
}

let sqliteLocalStoragePromise;

async function usarLocalStorageSQLite() {
    if (!sqliteLocalStoragePromise) {
        sqliteLocalStoragePromise = initSqlJs().then((SQL) => new SQLiteLocalStorage(SQL.Database));
    }

    const storage = await sqliteLocalStoragePromise;
    storage.clear();

    Object.defineProperty(globalThis, 'localStorage', {
        value: storage,
        configurable: true,
        writable: true
    });

    return storage;
}

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const appScript = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

let e2eWindow;
let e2eElements;

function preencherFormularioTarefa({ titulo, descricao = '', data = '', categoria = '', prioridade = false }) {
    e2eElements.tituloTarefa.value = titulo;
    e2eElements.descricaoTarefa.value = descricao;
    e2eElements.dataTarefa.value = data;
    e2eElements.categoriaTarefa.value = categoria;
    e2eElements.prioridadeTarefa.checked = prioridade;
}

function submeterFormularioTarefa() {
    e2eElements.formTarefa.dispatchEvent(new e2eWindow.Event('submit', { bubbles: true, cancelable: true }));
}

function inicializarAppE2E() {
    const dom = new JSDOM(indexHtml, {
        pretendToBeVisual: true,
        runScripts: 'outside-only',
        url: 'http://localhost/'
    });

    global.window = dom.window;
    global.document = dom.window.document;

    return dom;
}

// Importar as variáveis do script.js
let tarefas = [];
let filtroAtivo = 'todas';
let termoBusca = '';

const STORAGE_KEY = 'tarefas';

// Funções auxiliares (copiadas de script.js para teste)
function carregarTarefas() {
    const dados = localStorage.getItem(STORAGE_KEY);
    tarefas = dados ? JSON.parse(dados) : [];
}

function salvarTarefas() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
}

function finalizarTarefa(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa) {
        tarefa.status = 'finalizada';
        salvarTarefas();
    }
}

function cancelarTarefa(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa) {
        tarefa.status = 'cancelada';
        salvarTarefas();
    }
}

function togglePrioridade(id) {
    const tarefa = tarefas.find(t => t.id === id);
    if (tarefa) {
        tarefa.prioridade = !tarefa.prioridade;
        salvarTarefas();
    }
}

function deletarTarefa(id) {
    tarefas = tarefas.filter(t => t.id !== id);
    salvarTarefas();
}

function criarTarefa(titulo, descricao = '', data = '', categoria = '', prioridade = false) {
    if (!titulo.trim()) {
        throw new Error('Título é obrigatório');
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
    return novaTarefa;
}

function aplicarFiltrosEBusca() {
    let tarefasFilutradas = tarefas;

    if (filtroAtivo === 'ativas') {
        tarefasFilutradas = tarefasFilutradas.filter(t => t.status === 'ativa');
    } else if (filtroAtivo === 'finalizadas') {
        tarefasFilutradas = tarefasFilutradas.filter(t => t.status === 'finalizada');
    } else if (filtroAtivo === 'canceladas') {
        tarefasFilutradas = tarefasFilutradas.filter(t => t.status === 'cancelada');
    } else if (filtroAtivo === 'prioridade') {
        tarefasFilutradas = tarefasFilutradas.filter(t => t.prioridade);
    }

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

// ============================================
// TESTES DE UNIDADE
// ============================================

describe('Testes de Unidade', () => {
    beforeEach(() => {
        localStorage.clear();
        tarefas = [];
        filtroAtivo = 'todas';
        termoBusca = '';
    });

    // RF-01: Cadastro de Nova Tarefa
    describe('RF-01: Cadastro de Nova Tarefa', () => {
        test('Deve criar uma tarefa com título válido', () => {
            const tarefa = criarTarefa('Estudar JavaScript');
            
            expect(tarefas.length).toBe(1);
            expect(tarefas[0].titulo).toBe('Estudar JavaScript');
            expect(tarefas[0].status).toBe('ativa');
        });

        test('Deve rejeitar tarefa sem título', () => {
            expect(() => {
                criarTarefa('');
            }).toThrow('Título é obrigatório');
        });

        test('Deve criar tarefa com todos os atributos', () => {
            const tarefa = criarTarefa(
                'Projeto React',
                'Implementar novo componente',
                '2026-06-15',
                'Trabalho',
                true
            );

            expect(tarefa.titulo).toBe('Projeto React');
            expect(tarefa.descricao).toBe('Implementar novo componente');
            expect(tarefa.data).toBe('2026-06-15');
            expect(tarefa.categoria).toBe('Trabalho');
            expect(tarefa.prioridade).toBe(true);
        });

        test('Deve persistir tarefa no localStorage', () => {
            criarTarefa('Tarefa Persistida');
            
            const dados = JSON.parse(localStorage.getItem('tarefas'));
            expect(dados).toHaveLength(1);
            expect(dados[0].titulo).toBe('Tarefa Persistida');
        });
    });

    // RF-02: Assinalar como Prioridade
    describe('RF-02: Assinalar Tarefa como Prioridade', () => {
        test('Deve marcar tarefa como prioritária', () => {
            const tarefa = criarTarefa('Tarefa Normal');
            expect(tarefa.prioridade).toBe(false);

            togglePrioridade(tarefa.id);
            
            expect(tarefas[0].prioridade).toBe(true);
        });

        test('Deve remover prioridade de tarefa prioritária', () => {
            const tarefa = criarTarefa('Tarefa', '', '', '', true);
            expect(tarefa.prioridade).toBe(true);

            togglePrioridade(tarefa.id);
            
            expect(tarefas[0].prioridade).toBe(false);
        });

        test('Deve persistir prioridade no localStorage', () => {
            const tarefa = criarTarefa('Tarefa Prioritária');
            togglePrioridade(tarefa.id);
            
            const dados = JSON.parse(localStorage.getItem('tarefas'));
            expect(dados[0].prioridade).toBe(true);
        });
    });

    // RF-03: Cancelar Tarefa
    describe('RF-03: Cancelar Tarefa Existente', () => {
        test('Deve cancelar tarefa ativa', () => {
            const tarefa = criarTarefa('Tarefa para Cancelar');
            expect(tarefa.status).toBe('ativa');

            cancelarTarefa(tarefa.id);
            
            expect(tarefas[0].status).toBe('cancelada');
        });

        test('Deve persistir cancelamento no localStorage', () => {
            const tarefa = criarTarefa('Tarefa para Cancelar');
            cancelarTarefa(tarefa.id);
            
            const dados = JSON.parse(localStorage.getItem('tarefas'));
            expect(dados[0].status).toBe('cancelada');
        });
    });

    // RF-04: Finalizar Tarefa
    describe('RF-04: Finalizar Tarefa', () => {
        test('Deve finalizar tarefa ativa', () => {
            const tarefa = criarTarefa('Tarefa para Finalizar');
            expect(tarefa.status).toBe('ativa');

            finalizarTarefa(tarefa.id);
            
            expect(tarefas[0].status).toBe('finalizada');
        });

        test('Deve persistir finalização no localStorage', () => {
            const tarefa = criarTarefa('Tarefa para Finalizar');
            finalizarTarefa(tarefa.id);
            
            const dados = JSON.parse(localStorage.getItem('tarefas'));
            expect(dados[0].status).toBe('finalizada');
        });
    });

    // RF-05: Listar Tarefas Existentes
    describe('RF-05: Listar Tarefas Existentes', () => {
        test('Deve listar todas as tarefas criadas', () => {
            criarTarefa('Tarefa 1');
            criarTarefa('Tarefa 2');
            criarTarefa('Tarefa 3');
            
            expect(tarefas.length).toBe(3);
        });

        test('Deve retornar lista vazia quando sem tarefas', () => {
            expect(tarefas.length).toBe(0);
        });
    });

    // RF-06: Listar Tarefas Finalizadas
    describe('RF-06: Listar Tarefas Finalizadas', () => {
        test('Deve listar apenas tarefas finalizadas', () => {
            criarTarefa('Tarefa 1');
            const tarefa2 = criarTarefa('Tarefa 2');
            criarTarefa('Tarefa 3');
            
            finalizarTarefa(tarefa2.id);
            
            filtroAtivo = 'finalizadas';
            const finalizadas = aplicarFiltrosEBusca();
            
            expect(finalizadas.length).toBe(1);
            expect(finalizadas[0].status).toBe('finalizada');
        });

        test('Deve retornar lista vazia sem tarefas finalizadas', () => {
            criarTarefa('Tarefa 1');
            criarTarefa('Tarefa 2');
            
            filtroAtivo = 'finalizadas';
            const finalizadas = aplicarFiltrosEBusca();
            
            expect(finalizadas.length).toBe(0);
        });
    });

    // RF-07: Pesquisar por Atributos
    describe('RF-07: Pesquisar por Atributos das Tarefas', () => {
        test('Deve pesquisar por título', () => {
            criarTarefa('Estudar JavaScript', 'Aprender conceitos');
            criarTarefa('Ir ao mercado', 'Compras pessoais');
            criarTarefa('Projeto React', 'Desenvolvimento');
            
            termoBusca = 'projeto';
            const resultados = aplicarFiltrosEBusca();
            
            expect(resultados.length).toBe(1);
            expect(resultados[0].titulo).toBe('Projeto React');
        });

        test('Deve pesquisar por descrição', () => {
            criarTarefa('Tarefa 1', 'Aprender JavaScript');
            criarTarefa('Tarefa 2', 'Compras na loja');
            criarTarefa('Tarefa 3', 'Aprender Python');
            
            termoBusca = 'aprender';
            const resultados = aplicarFiltrosEBusca();
            
            expect(resultados.length).toBe(2);
        });

        test('Deve pesquisar por categoria', () => {
            criarTarefa('Tarefa 1', '', '', 'Trabalho');
            criarTarefa('Tarefa 2', '', '', 'Pessoal');
            criarTarefa('Tarefa 3', '', '', 'Trabalho');
            
            termoBusca = 'trabalho';
            const resultados = aplicarFiltrosEBusca();
            
            expect(resultados.length).toBe(2);
        });

        test('Deve retornar resultado vazio se nenhuma correspondência', () => {
            criarTarefa('Tarefa 1', 'Descrição 1');
            criarTarefa('Tarefa 2', 'Descrição 2');
            
            termoBusca = 'inexistente';
            const resultados = aplicarFiltrosEBusca();
            
            expect(resultados.length).toBe(0);
        });
    });
});

// ============================================
// TESTES DE INTEGRAÇÃO
// ============================================

describe('Testes de Integração', () => {
    beforeEach(async () => {
        await usarLocalStorageSQLite();
        tarefas = [];
        filtroAtivo = 'todas';
        termoBusca = '';
    });

    test('INT-01: Criar tarefa e marcar como prioritária', () => {
        const tarefa = criarTarefa('Reunião Importante');
        expect(tarefa.prioridade).toBe(false);
        
        togglePrioridade(tarefa.id);
        
        const dados = JSON.parse(localStorage.getItem('tarefas'));
        expect(dados[0].prioridade).toBe(true);
        expect(dados[0].status).toBe('ativa');
    });

    test('INT-02: Criar, editar e salvar tarefa', () => {
        const tarefa = criarTarefa('Tarefa Original', 'Descrição original');
        
        tarefas[0].titulo = 'Tarefa Modificada';
        tarefas[0].descricao = 'Descrição modificada';
        salvarTarefas();
        
        const dados = JSON.parse(localStorage.getItem('tarefas'));
        expect(dados[0].titulo).toBe('Tarefa Modificada');
        expect(dados[0].descricao).toBe('Descrição modificada');
    });

    test('INT-03: Combinar pesquisa e filtros', () => {
        const tarefaA = criarTarefa('Projeto A', 'Descrição de projeto');
        const tarefaB = criarTarefa('Projeto B', 'Descrição de projeto');
        criarTarefa('Compras', 'Descrição de compras');
        
        finalizarTarefa(tarefaB.id);
        
        filtroAtivo = 'finalizadas';
        termoBusca = 'projeto';
        
        const resultados = aplicarFiltrosEBusca();
        
        expect(resultados.length).toBe(1);
        expect(resultados[0].status).toBe('finalizada');
    });

    test('INT-04: Cancelar tarefa e deletá-la', () => {
        const tarefa = criarTarefa('Tarefa para Deletar');
        
        cancelarTarefa(tarefa.id);
        expect(tarefas[0].status).toBe('cancelada');
        
        deletarTarefa(tarefa.id);
        expect(tarefas.length).toBe(0);
        
        const dados = JSON.parse(localStorage.getItem('tarefas'));
        expect(dados.length).toBe(0);
    });

    test('INT-05: Ciclo completo de tarefa', () => {
        const tarefa = criarTarefa('Projeto Completo', 'Teste ciclo', '2026-06-15', 'Trabalho');
        
        togglePrioridade(tarefa.id);
        expect(tarefas[0].prioridade).toBe(true);
        
        finalizarTarefa(tarefa.id);
        expect(tarefas[0].status).toBe('finalizada');
        
        const dados = JSON.parse(localStorage.getItem('tarefas'));
        expect(dados[0].prioridade).toBe(true);
        expect(dados[0].status).toBe('finalizada');
        expect(dados[0].categoria).toBe('Trabalho');
    });
});

// ============================================
// TESTES DE SISTEMA
// ============================================

describe('Testes de Sistema', () => {
    beforeEach(async () => {
        const storage = await usarLocalStorageSQLite();
        const dom = inicializarAppE2E();
        e2eWindow = dom.window;

        Object.defineProperty(e2eWindow, 'localStorage', {
            value: storage,
            configurable: true,
            writable: true
        });

        e2eWindow.alert = jest.fn();
        e2eWindow.confirm = jest.fn(() => true);

        e2eElements = {
            tituloTarefa: e2eWindow.document.getElementById('tituloTarefa'),
            descricaoTarefa: e2eWindow.document.getElementById('descricaoTarefa'),
            dataTarefa: e2eWindow.document.getElementById('dataTarefa'),
            categoriaTarefa: e2eWindow.document.getElementById('categoriaTarefa'),
            prioridadeTarefa: e2eWindow.document.getElementById('prioridadeTarefa'),
            formTarefa: e2eWindow.document.getElementById('formTarefa'),
            searchInput: e2eWindow.document.getElementById('searchInput'),
            listagemTarefas: e2eWindow.document.getElementById('listagemTarefas'),
            modalEditar: e2eWindow.document.getElementById('modalEditar'),
            formEditar: e2eWindow.document.getElementById('formEditar'),
            editarTitulo: e2eWindow.document.getElementById('editarTitulo'),
            editarDescricao: e2eWindow.document.getElementById('editarDescricao'),
            editarData: e2eWindow.document.getElementById('editarData'),
            editarCategoria: e2eWindow.document.getElementById('editarCategoria'),
            editarPrioridade: e2eWindow.document.getElementById('editarPrioridade')
        };

        global.alert = e2eWindow.alert;
        global.confirm = e2eWindow.confirm;

        e2eWindow.eval(appScript);
        e2eWindow.document.dispatchEvent(new e2eWindow.Event('DOMContentLoaded', { bubbles: true }));
    });

    test('SYS-01: Criar tarefa pela interface e persistir após recarregar', () => {
        preencherFormularioTarefa({
            titulo: 'Tarefa E2E',
            descricao: 'Fluxo completo',
            data: '2026-06-15',
            categoria: 'Trabalho',
            prioridade: true
        });

        submeterFormularioTarefa();

        expect(e2eWindow.document.querySelectorAll('.task-card')).toHaveLength(1);
        expect(e2eWindow.document.querySelector('.task-title').textContent).toBe('Tarefa E2E');
        expect(JSON.parse(localStorage.getItem('tarefas'))).toHaveLength(1);

        const recarregando = inicializarAppE2E();
        e2eWindow = recarregando.window;

        Object.defineProperty(e2eWindow, 'localStorage', {
            value: localStorage,
            configurable: true,
            writable: true
        });
        e2eWindow.alert = jest.fn();
        e2eWindow.confirm = jest.fn(() => true);
        e2eElements = {
            tituloTarefa: e2eWindow.document.getElementById('tituloTarefa'),
            descricaoTarefa: e2eWindow.document.getElementById('descricaoTarefa'),
            dataTarefa: e2eWindow.document.getElementById('dataTarefa'),
            categoriaTarefa: e2eWindow.document.getElementById('categoriaTarefa'),
            prioridadeTarefa: e2eWindow.document.getElementById('prioridadeTarefa'),
            formTarefa: e2eWindow.document.getElementById('formTarefa'),
            searchInput: e2eWindow.document.getElementById('searchInput'),
            listagemTarefas: e2eWindow.document.getElementById('listagemTarefas'),
            modalEditar: e2eWindow.document.getElementById('modalEditar'),
            formEditar: e2eWindow.document.getElementById('formEditar'),
            editarTitulo: e2eWindow.document.getElementById('editarTitulo'),
            editarDescricao: e2eWindow.document.getElementById('editarDescricao'),
            editarData: e2eWindow.document.getElementById('editarData'),
            editarCategoria: e2eWindow.document.getElementById('editarCategoria'),
            editarPrioridade: e2eWindow.document.getElementById('editarPrioridade')
        };
        global.window = e2eWindow;
        global.document = e2eWindow.document;
        global.alert = e2eWindow.alert;
        global.confirm = e2eWindow.confirm;

        e2eWindow.eval(appScript);
        e2eWindow.document.dispatchEvent(new e2eWindow.Event('DOMContentLoaded', { bubbles: true }));

        expect(e2eWindow.document.querySelectorAll('.task-card')).toHaveLength(1);
        expect(e2eWindow.document.querySelector('.task-title').textContent).toBe('Tarefa E2E');
    });

    test('SYS-02: Validar título obrigatório na interface', () => {
        preencherFormularioTarefa({
            titulo: '',
            descricao: 'Sem título'
        });

        submeterFormularioTarefa();

        expect(e2eWindow.alert).toHaveBeenCalledWith('Por favor, digite um título para a tarefa!');
        expect(e2eWindow.document.querySelectorAll('.task-card')).toHaveLength(0);
    });

    test('SYS-03: Editar, finalizar e pesquisar tarefa pelo fluxo da UI', () => {
        preencherFormularioTarefa({
            titulo: 'Projeto Completo',
            descricao: 'Descrição original',
            data: '2026-06-15',
            categoria: 'Trabalho'
        });
        submeterFormularioTarefa();

        const tarefaId = JSON.parse(localStorage.getItem('tarefas'))[0].id;

        e2eWindow.abrirModal(tarefaId);

        e2eWindow.document.getElementById('editarTitulo').value = 'Projeto Atualizado';
        e2eWindow.document.getElementById('editarDescricao').value = 'Descrição atualizada';
        e2eWindow.document.getElementById('editarPrioridade').checked = true;
        e2eWindow.document.getElementById('formEditar').dispatchEvent(new e2eWindow.Event('submit', { bubbles: true, cancelable: true }));

        expect(e2eWindow.document.querySelector('.task-title').textContent).toBe('Projeto Atualizado');

        e2eWindow.finalizarTarefa(tarefaId);

        expect(e2eWindow.document.querySelector('.status-badge.finalizada').textContent).toBe('Finalizada');

        e2eWindow.document.getElementById('searchInput').value = 'atualizado';
        e2eWindow.document.getElementById('searchInput').dispatchEvent(new e2eWindow.KeyboardEvent('keyup', { bubbles: true }));

        expect(e2eWindow.document.querySelectorAll('.task-card')).toHaveLength(1);
        expect(e2eWindow.document.querySelector('.task-title').textContent).toBe('Projeto Atualizado');
    });

    test('SYS-04: Cancelar e excluir tarefa pela interface', () => {
        preencherFormularioTarefa({
            titulo: 'Tarefa para remover',
            descricao: 'Fluxo de cancelamento e exclusão'
        });
        submeterFormularioTarefa();

        const tarefaId = JSON.parse(localStorage.getItem('tarefas'))[0].id;

        e2eWindow.cancelarTarefa(tarefaId);
        expect(e2eWindow.document.querySelector('.status-badge.cancelada').textContent).toBe('Cancelada');
        e2eWindow.deletarTarefa(tarefaId);

        expect(e2eWindow.document.querySelectorAll('.task-card')).toHaveLength(0);
        expect(JSON.parse(localStorage.getItem('tarefas'))).toHaveLength(0);
    });
});
