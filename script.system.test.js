// ============================================
// TESTES DE SISTEMA
// Gerenciador de Tarefas
// ============================================

// Define polyfills BEFORE requiring JSDOM
const { TextEncoder, TextDecoder } = require("util");

if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder;
}

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { SQLiteLocalStorage, usarLocalStorageSQLite } = require("./test-utils");

// ============================================
// LEITURA DE ARQUIVOS
// ============================================

const indexHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const appScript = fs.readFileSync(path.join(__dirname, "script.js"), "utf8");

// ============================================
// VARIÁVEIS E ELEMENTOS E2E
// ============================================

let e2eWindow;
let e2eElements;

// ============================================
// FUNÇÕES AUXILIARES E2E
// ============================================

function preencherFormularioTarefa({
  titulo,
  descricao = "",
  data = "",
  categoria = "",
  prioridade = false,
}) {
  e2eElements.tituloTarefa.value = titulo;
  e2eElements.descricaoTarefa.value = descricao;
  e2eElements.dataTarefa.value = data;
  e2eElements.categoriaTarefa.value = categoria;
  e2eElements.prioridadeTarefa.checked = prioridade;
}

function submeterFormularioTarefa() {
  e2eElements.formTarefa.dispatchEvent(
    new e2eWindow.Event("submit", { bubbles: true, cancelable: true }),
  );
}

function inicializarAppE2E() {
  const dom = new JSDOM(indexHtml, {
    pretendToBeVisual: true,
    runScripts: "outside-only",
    url: "http://localhost/",
  });

  global.window = dom.window;
  global.document = dom.window.document;

  return dom;
}

// ============================================
// TESTES DE SISTEMA
// ============================================

describe("Testes de Sistema", () => {
  beforeEach(async () => {
    const storage = await usarLocalStorageSQLite();
    const dom = inicializarAppE2E();
    e2eWindow = dom.window;

    Object.defineProperty(e2eWindow, "localStorage", {
      value: storage,
      configurable: true,
      writable: true,
    });

    e2eWindow.alert = jest.fn();
    e2eWindow.confirm = jest.fn(() => true);

    e2eElements = {
      tituloTarefa: e2eWindow.document.getElementById("tituloTarefa"),
      descricaoTarefa: e2eWindow.document.getElementById("descricaoTarefa"),
      dataTarefa: e2eWindow.document.getElementById("dataTarefa"),
      categoriaTarefa: e2eWindow.document.getElementById("categoriaTarefa"),
      prioridadeTarefa: e2eWindow.document.getElementById("prioridadeTarefa"),
      formTarefa: e2eWindow.document.getElementById("formTarefa"),
      searchInput: e2eWindow.document.getElementById("searchInput"),
      listagemTarefas: e2eWindow.document.getElementById("listagemTarefas"),
      modalEditar: e2eWindow.document.getElementById("modalEditar"),
      formEditar: e2eWindow.document.getElementById("formEditar"),
      editarTitulo: e2eWindow.document.getElementById("editarTitulo"),
      editarDescricao: e2eWindow.document.getElementById("editarDescricao"),
      editarData: e2eWindow.document.getElementById("editarData"),
      editarCategoria: e2eWindow.document.getElementById("editarCategoria"),
      editarPrioridade: e2eWindow.document.getElementById("editarPrioridade"),
    };

    global.alert = e2eWindow.alert;
    global.confirm = e2eWindow.confirm;

    e2eWindow.eval(appScript);
    e2eWindow.document.dispatchEvent(
      new e2eWindow.Event("DOMContentLoaded", { bubbles: true }),
    );
  });

  test("SYS-01: Criar tarefa pela interface e persistir após recarregar", () => {
    preencherFormularioTarefa({
      titulo: "Tarefa E2E",
      descricao: "Fluxo completo",
      data: "2026-06-15",
      categoria: "Trabalho",
      prioridade: true,
    });

    submeterFormularioTarefa();

    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(1);
    expect(e2eWindow.document.querySelector(".task-title").textContent).toBe(
      "Tarefa E2E",
    );
    expect(JSON.parse(localStorage.getItem("tarefas"))).toHaveLength(1);

    const recarregando = inicializarAppE2E();
    e2eWindow = recarregando.window;

    Object.defineProperty(e2eWindow, "localStorage", {
      value: localStorage,
      configurable: true,
      writable: true,
    });
    e2eWindow.alert = jest.fn();
    e2eWindow.confirm = jest.fn(() => true);
    e2eElements = {
      tituloTarefa: e2eWindow.document.getElementById("tituloTarefa"),
      descricaoTarefa: e2eWindow.document.getElementById("descricaoTarefa"),
      dataTarefa: e2eWindow.document.getElementById("dataTarefa"),
      categoriaTarefa: e2eWindow.document.getElementById("categoriaTarefa"),
      prioridadeTarefa: e2eWindow.document.getElementById("prioridadeTarefa"),
      formTarefa: e2eWindow.document.getElementById("formTarefa"),
      searchInput: e2eWindow.document.getElementById("searchInput"),
      listagemTarefas: e2eWindow.document.getElementById("listagemTarefas"),
      modalEditar: e2eWindow.document.getElementById("modalEditar"),
      formEditar: e2eWindow.document.getElementById("formEditar"),
      editarTitulo: e2eWindow.document.getElementById("editarTitulo"),
      editarDescricao: e2eWindow.document.getElementById("editarDescricao"),
      editarData: e2eWindow.document.getElementById("editarData"),
      editarCategoria: e2eWindow.document.getElementById("editarCategoria"),
      editarPrioridade: e2eWindow.document.getElementById("editarPrioridade"),
    };
    global.window = e2eWindow;
    global.document = e2eWindow.document;
    global.alert = e2eWindow.alert;
    global.confirm = e2eWindow.confirm;

    e2eWindow.eval(appScript);
    e2eWindow.document.dispatchEvent(
      new e2eWindow.Event("DOMContentLoaded", { bubbles: true }),
    );

    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(1);
    expect(e2eWindow.document.querySelector(".task-title").textContent).toBe(
      "Tarefa E2E",
    );
  });

  test("SYS-02: Validar título obrigatório na interface", () => {
    preencherFormularioTarefa({
      titulo: "",
      descricao: "Sem título",
    });

    submeterFormularioTarefa();

    expect(e2eWindow.alert).toHaveBeenCalledWith(
      "Por favor, digite um título para a tarefa!",
    );
    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(0);
  });

  test("SYS-03: Editar, finalizar e pesquisar tarefa pelo fluxo da UI", () => {
    preencherFormularioTarefa({
      titulo: "Projeto Completo",
      descricao: "Descrição original",
      data: "2026-06-15",
      categoria: "Trabalho",
    });
    submeterFormularioTarefa();

    const tarefaId = JSON.parse(localStorage.getItem("tarefas"))[0].id;

    e2eWindow.abrirModal(tarefaId);

    e2eWindow.document.getElementById("editarTitulo").value =
      "Projeto Atualizado";
    e2eWindow.document.getElementById("editarDescricao").value =
      "Descrição atualizada";
    e2eWindow.document.getElementById("editarPrioridade").checked = true;
    e2eWindow.document
      .getElementById("formEditar")
      .dispatchEvent(
        new e2eWindow.Event("submit", { bubbles: true, cancelable: true }),
      );

    expect(e2eWindow.document.querySelector(".task-title").textContent).toBe(
      "Projeto Atualizado",
    );

    e2eWindow.finalizarTarefa(tarefaId);

    expect(
      e2eWindow.document.querySelector(".status-badge.finalizada").textContent,
    ).toBe("Finalizada");

    e2eWindow.document.getElementById("searchInput").value = "atualizado";
    e2eWindow.document
      .getElementById("searchInput")
      .dispatchEvent(new e2eWindow.KeyboardEvent("keyup", { bubbles: true }));

    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(1);
    expect(e2eWindow.document.querySelector(".task-title").textContent).toBe(
      "Projeto Atualizado",
    );
  });

  test("SYS-04: Cancelar e excluir tarefa pela interface", () => {
    preencherFormularioTarefa({
      titulo: "Tarefa para remover",
      descricao: "Fluxo de cancelamento e exclusão",
    });
    submeterFormularioTarefa();

    const tarefaId = JSON.parse(localStorage.getItem("tarefas"))[0].id;

    e2eWindow.cancelarTarefa(tarefaId);
    expect(
      e2eWindow.document.querySelector(".status-badge.cancelada").textContent,
    ).toBe("Cancelada");
    e2eWindow.deletarTarefa(tarefaId);

    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem("tarefas"))).toHaveLength(0);
  });

  test("SYS-05: Múltiplas operações com filtros e verificação de estado persistente", () => {
    // Criar primeira tarefa
    preencherFormularioTarefa({
      titulo: "Primeira Tarefa",
      descricao: "Descrição 1",
      categoria: "Trabalho",
    });
    submeterFormularioTarefa();

    // Criar segunda tarefa
    preencherFormularioTarefa({
      titulo: "Segunda Tarefa Urgente",
      descricao: "Descrição 2",
      categoria: "Pessoal",
    });
    submeterFormularioTarefa();

    // Criar terceira tarefa
    preencherFormularioTarefa({
      titulo: "Terceira Tarefa",
      descricao: "Descrição 3",
      categoria: "Estudo",
    });
    submeterFormularioTarefa();

    // Verificar que 3 tarefas foram criadas
    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(3);

    const tarefas = JSON.parse(localStorage.getItem("tarefas"));
    const tarefaId1 = tarefas[0].id;
    const tarefaId2 = tarefas[1].id;
    const tarefaId3 = tarefas[2].id;

    // Priorizar primeira e segunda tarefa
    e2eWindow.togglePrioridade(tarefaId1);
    e2eWindow.togglePrioridade(tarefaId2);

    // Finalizar terceira tarefa
    e2eWindow.finalizarTarefa(tarefaId3);

    // Verificar estado no localStorage
    let dadosAtualizados = JSON.parse(localStorage.getItem("tarefas"));
    expect(dadosAtualizados[0].prioridade).toBe(true);
    expect(dadosAtualizados[1].prioridade).toBe(true);
    expect(dadosAtualizados[2].status).toBe("finalizada");

    // Aplicar filtro "Prioritárias"
    e2eWindow.filtrarTarefas("prioridade");

    // Verificar que apenas 2 tarefas aparecem (as prioritárias)
    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(2);

    // Resetar para "Todas"
    e2eWindow.filtrarTarefas("todas");

    // Verificar que todas as 3 tarefas aparecem novamente
    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(3);

    // Pesquisar por "Urgente"
    e2eWindow.document.getElementById("searchInput").value = "Urgente";
    e2eWindow.document
      .getElementById("searchInput")
      .dispatchEvent(new e2eWindow.KeyboardEvent("keyup", { bubbles: true }));

    // Verificar que apenas 1 tarefa aparece
    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(1);
    expect(e2eWindow.document.querySelector(".task-title").textContent).toBe(
      "Segunda Tarefa Urgente",
    );

    // Limpar busca
    e2eWindow.document.getElementById("searchInput").value = "";
    e2eWindow.document
      .getElementById("searchInput")
      .dispatchEvent(new e2eWindow.KeyboardEvent("keyup", { bubbles: true }));

    // Aplicar filtro "Finalizadas"
    e2eWindow.filtrarTarefas("finalizadas");

    // Verificar que apenas 1 tarefa aparece (a terceira que finalizamos)
    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(1);
    expect(e2eWindow.document.querySelector(".task-title").textContent).toBe(
      "Terceira Tarefa",
    );

    // Resetar filtro
    e2eWindow.filtrarTarefas("todas");

    // Cancelar a primeira tarefa
    e2eWindow.cancelarTarefa(tarefaId1);

    // Aplicar filtro "Canceladas"
    e2eWindow.filtrarTarefas("canceladas");

    // Verificar que 1 tarefa aparece (a primeira que cancelamos)
    expect(e2eWindow.document.querySelectorAll(".task-card")).toHaveLength(1);
    expect(
      e2eWindow.document.querySelector(".status-badge.cancelada"),
    ).not.toBeNull();
    expect(e2eWindow.document.querySelector(".task-title").textContent).toBe(
      "Primeira Tarefa",
    );

    // Verificação final: estado persistido no localStorage
    dadosAtualizados = JSON.parse(localStorage.getItem("tarefas"));
    expect(dadosAtualizados).toHaveLength(3);
    expect(dadosAtualizados[0].status).toBe("cancelada");
    expect(dadosAtualizados[1].status).toBe("ativa");
    expect(dadosAtualizados[2].status).toBe("finalizada");
  });
});
