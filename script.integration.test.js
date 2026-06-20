// ============================================
// TESTES DE INTEGRAÇÃO
// Gerenciador de Tarefas
// ============================================

const { TextEncoder, TextDecoder } = require("util");
const { SQLiteLocalStorage, usarLocalStorageSQLite } = require("./test-utils");

if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder;
}

// ============================================
// VARIÁVEIS DE ESTADO
// ============================================

let tarefas = [];
let filtroAtivo = "todas";
let termoBusca = "";

const STORAGE_KEY = "tarefas";

// ============================================
// FUNÇÕES AUXILIARES (copiadas de script.js para teste)
// ============================================

function carregarTarefas() {
  const dados = localStorage.getItem(STORAGE_KEY);
  tarefas = dados ? JSON.parse(dados) : [];
}

function salvarTarefas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tarefas));
}

function finalizarTarefa(id) {
  const tarefa = tarefas.find((t) => t.id === id);
  if (tarefa) {
    tarefa.status = "finalizada";
    salvarTarefas();
  }
}

function cancelarTarefa(id) {
  const tarefa = tarefas.find((t) => t.id === id);
  if (tarefa) {
    tarefa.status = "cancelada";
    salvarTarefas();
  }
}

function togglePrioridade(id) {
  const tarefa = tarefas.find((t) => t.id === id);
  if (tarefa) {
    tarefa.prioridade = !tarefa.prioridade;
    salvarTarefas();
  }
}

function deletarTarefa(id) {
  tarefas = tarefas.filter((t) => t.id !== id);
  salvarTarefas();
}

function criarTarefa(
  titulo,
  descricao = "",
  data = "",
  categoria = "",
  prioridade = false,
) {
  if (!titulo.trim()) {
    throw new Error("Título é obrigatório");
  }

  const novaTarefa = {
    id: Date.now(),
    titulo,
    descricao,
    data,
    categoria,
    prioridade,
    status: "ativa",
    dataCriacao: new Date().toLocaleDateString("pt-BR"),
  };

  tarefas.push(novaTarefa);
  salvarTarefas();
  return novaTarefa;
}

function aplicarFiltrosEBusca() {
  let tarefasFilutradas = tarefas;

  if (filtroAtivo === "ativas") {
    tarefasFilutradas = tarefasFilutradas.filter((t) => t.status === "ativa");
  } else if (filtroAtivo === "finalizadas") {
    tarefasFilutradas = tarefasFilutradas.filter(
      (t) => t.status === "finalizada",
    );
  } else if (filtroAtivo === "canceladas") {
    tarefasFilutradas = tarefasFilutradas.filter(
      (t) => t.status === "cancelada",
    );
  } else if (filtroAtivo === "prioridade") {
    tarefasFilutradas = tarefasFilutradas.filter((t) => t.prioridade);
  }

  if (termoBusca) {
    tarefasFilutradas = tarefasFilutradas.filter((t) => {
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

// ============================================
// TESTES DE INTEGRAÇÃO
// ============================================

describe("Testes de Integração", () => {
  beforeEach(async () => {
    await usarLocalStorageSQLite();
    tarefas = [];
    filtroAtivo = "todas";
    termoBusca = "";
  });

  test("INT-01: Criar tarefa e marcar como prioritária", () => {
    const tarefa = criarTarefa("Reunião Importante");
    expect(tarefa.prioridade).toBe(false);

    togglePrioridade(tarefa.id);

    const dados = JSON.parse(localStorage.getItem("tarefas"));
    expect(dados[0].prioridade).toBe(true);
    expect(dados[0].status).toBe("ativa");
  });

  test("INT-02: Criar, editar e salvar tarefa", () => {
    const tarefa = criarTarefa("Tarefa Original", "Descrição original");

    tarefas[0].titulo = "Tarefa Modificada";
    tarefas[0].descricao = "Descrição modificada";
    salvarTarefas();

    const dados = JSON.parse(localStorage.getItem("tarefas"));
    expect(dados[0].titulo).toBe("Tarefa Modificada");
    expect(dados[0].descricao).toBe("Descrição modificada");
  });

  test("INT-03: Combinar pesquisa e filtros", () => {
    const tarefaA = criarTarefa("Projeto A", "Descrição de projeto");
    const tarefaB = criarTarefa("Projeto B", "Descrição de projeto");
    criarTarefa("Compras", "Descrição de compras");

    finalizarTarefa(tarefaB.id);

    filtroAtivo = "finalizadas";
    termoBusca = "projeto";

    const resultados = aplicarFiltrosEBusca();

    expect(resultados.length).toBe(1);
    expect(resultados[0].status).toBe("finalizada");
  });

  test("INT-04: Cancelar tarefa e deletá-la", () => {
    const tarefa = criarTarefa("Tarefa para Deletar");

    cancelarTarefa(tarefa.id);
    expect(tarefas[0].status).toBe("cancelada");

    deletarTarefa(tarefa.id);
    expect(tarefas.length).toBe(0);

    const dados = JSON.parse(localStorage.getItem("tarefas"));
    expect(dados.length).toBe(0);
  });

  test("INT-05: Ciclo completo de tarefa", () => {
    const tarefa = criarTarefa(
      "Projeto Completo",
      "Teste ciclo",
      "2026-06-15",
      "Trabalho",
    );

    togglePrioridade(tarefa.id);
    expect(tarefas[0].prioridade).toBe(true);

    finalizarTarefa(tarefa.id);
    expect(tarefas[0].status).toBe("finalizada");

    const dados = JSON.parse(localStorage.getItem("tarefas"));
    expect(dados[0].prioridade).toBe(true);
    expect(dados[0].status).toBe("finalizada");
    expect(dados[0].categoria).toBe("Trabalho");
  });
});
