// ============================================
// TESTES DE UNIDADE
// Gerenciador de Tarefas
// ============================================

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
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
  writable: true,
});

const { TextEncoder, TextDecoder } = require("util");

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
// TESTES DE UNIDADE
// ============================================

describe("Testes de Unidade", () => {
  beforeEach(() => {
    localStorage.clear();
    tarefas = [];
    filtroAtivo = "todas";
    termoBusca = "";
  });

  // RF-01: Cadastro de Nova Tarefa
  describe("RF-01: Cadastro de Nova Tarefa", () => {
    test("Deve criar uma tarefa com título válido", () => {
      const tarefa = criarTarefa("Estudar JavaScript");

      expect(tarefas.length).toBe(1);
      expect(tarefas[0].titulo).toBe("Estudar JavaScript");
      expect(tarefas[0].status).toBe("ativa");
    });

    test("Deve rejeitar tarefa sem título", () => {
      expect(() => {
        criarTarefa("");
      }).toThrow("Título é obrigatório");
    });

    test("Deve criar tarefa com todos os atributos", () => {
      const tarefa = criarTarefa(
        "Projeto React",
        "Implementar novo componente",
        "2026-06-15",
        "Trabalho",
        true,
      );

      expect(tarefa.titulo).toBe("Projeto React");
      expect(tarefa.descricao).toBe("Implementar novo componente");
      expect(tarefa.data).toBe("2026-06-15");
      expect(tarefa.categoria).toBe("Trabalho");
      expect(tarefa.prioridade).toBe(true);
    });

    test("Deve persistir tarefa no localStorage", () => {
      criarTarefa("Tarefa Persistida");

      const dados = JSON.parse(localStorage.getItem("tarefas"));
      expect(dados).toHaveLength(1);
      expect(dados[0].titulo).toBe("Tarefa Persistida");
    });
  });

  // RF-02: Assinalar como Prioridade
  describe("RF-02: Assinalar Tarefa como Prioridade", () => {
    test("Deve marcar tarefa como prioritária", () => {
      const tarefa = criarTarefa("Tarefa Normal");
      expect(tarefa.prioridade).toBe(false);

      togglePrioridade(tarefa.id);

      expect(tarefas[0].prioridade).toBe(true);
    });

    test("Deve remover prioridade de tarefa prioritária", () => {
      const tarefa = criarTarefa("Tarefa", "", "", "", true);
      expect(tarefa.prioridade).toBe(true);

      togglePrioridade(tarefa.id);

      expect(tarefas[0].prioridade).toBe(false);
    });

    test("Deve persistir prioridade no localStorage", () => {
      const tarefa = criarTarefa("Tarefa Prioritária");
      togglePrioridade(tarefa.id);

      const dados = JSON.parse(localStorage.getItem("tarefas"));
      expect(dados[0].prioridade).toBe(true);
    });
  });

  // RF-03: Cancelar Tarefa
  describe("RF-03: Cancelar Tarefa Existente", () => {
    test("Deve cancelar tarefa ativa", () => {
      const tarefa = criarTarefa("Tarefa para Cancelar");
      expect(tarefa.status).toBe("ativa");

      cancelarTarefa(tarefa.id);

      expect(tarefas[0].status).toBe("cancelada");
    });

    test("Deve persistir cancelamento no localStorage", () => {
      const tarefa = criarTarefa("Tarefa para Cancelar");
      cancelarTarefa(tarefa.id);

      const dados = JSON.parse(localStorage.getItem("tarefas"));
      expect(dados[0].status).toBe("cancelada");
    });
  });

  // RF-04: Finalizar Tarefa
  describe("RF-04: Finalizar Tarefa", () => {
    test("Deve finalizar tarefa ativa", () => {
      const tarefa = criarTarefa("Tarefa para Finalizar");
      expect(tarefa.status).toBe("ativa");

      finalizarTarefa(tarefa.id);

      expect(tarefas[0].status).toBe("finalizada");
    });

    test("Deve persistir finalização no localStorage", () => {
      const tarefa = criarTarefa("Tarefa para Finalizar");
      finalizarTarefa(tarefa.id);

      const dados = JSON.parse(localStorage.getItem("tarefas"));
      expect(dados[0].status).toBe("finalizada");
    });
  });

  // RF-05: Listar Tarefas Existentes
  describe("RF-05: Listar Tarefas Existentes", () => {
    test("Deve listar todas as tarefas criadas", () => {
      criarTarefa("Tarefa 1");
      criarTarefa("Tarefa 2");
      criarTarefa("Tarefa 3");

      expect(tarefas.length).toBe(3);
    });

    test("Deve retornar lista vazia quando sem tarefas", () => {
      expect(tarefas.length).toBe(0);
    });
  });

  // RF-06: Listar Tarefas Finalizadas
  describe("RF-06: Listar Tarefas Finalizadas", () => {
    test("Deve listar apenas tarefas finalizadas", () => {
      criarTarefa("Tarefa 1");
      const tarefa2 = criarTarefa("Tarefa 2");
      criarTarefa("Tarefa 3");

      finalizarTarefa(tarefa2.id);

      filtroAtivo = "finalizadas";
      const finalizadas = aplicarFiltrosEBusca();

      expect(finalizadas.length).toBe(1);
      expect(finalizadas[0].status).toBe("finalizada");
    });

    test("Deve retornar lista vazia sem tarefas finalizadas", () => {
      criarTarefa("Tarefa 1");
      criarTarefa("Tarefa 2");

      filtroAtivo = "finalizadas";
      const finalizadas = aplicarFiltrosEBusca();

      expect(finalizadas.length).toBe(0);
    });
  });

  // RF-07: Pesquisar por Atributos
  describe("RF-07: Pesquisar por Atributos das Tarefas", () => {
    test("Deve pesquisar por título", () => {
      criarTarefa("Estudar JavaScript", "Aprender conceitos");
      criarTarefa("Ir ao mercado", "Compras pessoais");
      criarTarefa("Projeto React", "Desenvolvimento");

      termoBusca = "projeto";
      const resultados = aplicarFiltrosEBusca();

      expect(resultados.length).toBe(1);
      expect(resultados[0].titulo).toBe("Projeto React");
    });

    test("Deve pesquisar por descrição", () => {
      criarTarefa("Tarefa 1", "Aprender JavaScript");
      criarTarefa("Tarefa 2", "Compras na loja");
      criarTarefa("Tarefa 3", "Aprender Python");

      termoBusca = "aprender";
      const resultados = aplicarFiltrosEBusca();

      expect(resultados.length).toBe(2);
    });

    test("Deve pesquisar por categoria", () => {
      criarTarefa("Tarefa 1", "", "", "Trabalho");
      criarTarefa("Tarefa 2", "", "", "Pessoal");
      criarTarefa("Tarefa 3", "", "", "Trabalho");

      termoBusca = "trabalho";
      const resultados = aplicarFiltrosEBusca();

      expect(resultados.length).toBe(2);
    });

    test("Deve retornar resultado vazio se nenhuma correspondência", () => {
      criarTarefa("Tarefa 1", "Descrição 1");
      criarTarefa("Tarefa 2", "Descrição 2");

      termoBusca = "inexistente";
      const resultados = aplicarFiltrosEBusca();

      expect(resultados.length).toBe(0);
    });
  });
});
