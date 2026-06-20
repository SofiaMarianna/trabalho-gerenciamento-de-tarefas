# Gerenciador de Tarefas

Um aplicativo web de gerenciamento de tarefas desenvolvido em JavaScript vanilla com suporte completo a persistência de dados, filtros avançados e testes automatizados.

## Requisitos Funcionais Implementados

| RF        | Descrição                           | Status          |
| --------- | ----------------------------------- | --------------- |
| **RF-01** | Cadastro de Nova Tarefa             | ✅ Implementado |
| **RF-02** | Assinalar Tarefa como Prioridade    | ✅ Implementado |
| **RF-03** | Cancelar Tarefa Existente           | ✅ Implementado |
| **RF-04** | Finalizar Tarefa                    | ✅ Implementado |
| **RF-05** | Listar Tarefas Existentes           | ✅ Implementado |
| **RF-06** | Listar Tarefas Finalizadas          | ✅ Implementado |
| **RF-07** | Pesquisar por Atributos das Tarefas | ✅ Implementado |

## Estrutura dos Testes

O projeto contém 29 testes automatizados organizados em três arquivos de teste por categoria:

| Arquivo                      | Categoria            | Quantidade | Descrição                                         |
| ---------------------------- | -------------------- | ---------- | ------------------------------------------------- |
| `script.unit.test.js`        | Testes de Unidade    | 19         | Testes de funções isoladas cobrindo RF-01 a RF-07 |
| `script.integration.test.js` | Testes de Integração | 5          | Testes com persistência SQLite (INT-01 a INT-05)  |
| `script.system.test.js`      | Testes de Sistema    | 5          | Testes E2E com simulação de DOM (SYS-01 a SYS-05) |
| **Total**                    | -                    | **29**     | -                                                 |

## Como Executar os Testes

### Execução Completa (todos os 29 testes)

```bash
npm test
```

### Executar apenas Testes de Unidade (19 testes)

```bash
npm run test:unit
```

### Executar apenas Testes de Integração (5 testes)

```bash
npm run test:integration
```

### Executar apenas Testes de Sistema (5 testes)

```bash
npm run test:system
```

### Executar em Modo Watch (reexecuta ao salvar arquivos)

```bash
npm run test:watch
```

### Gerar Relatório de Cobertura

```bash
npm run test:coverage
```

## Tecnologias e Frameworks Utilizados

### Testes

- **Jest** (v29.7.0) - Framework de teste principal
- **jsdom** - Simulação de DOM para testes de sistema (E2E)
- **sql.js** - Implementação SQLite em JavaScript para testes de integração

### Aplicação

- **JavaScript Vanilla** - Sem frameworks frontend
- **localStorage** - Persistência de dados local
- **CSS3** - Estilização

## Estrutura do Projeto

```
├── index.html                 # Interface da aplicação
├── script.js                  # Lógica principal da aplicação
├── style.css                  # Estilos da interface
├── script.unit.test.js        # 19 testes de unidade (RF-01 a RF-07)
├── script.integration.test.js # 5 testes de integração (INT-01 a INT-05)
├── script.system.test.js      # 5 testes de sistema (SYS-01 a SYS-05)
├── test-utils.js              # Utilities compartilhadas para integração e sistema
├── jest.config.js             # Configuração do Jest
├── package.json               # Dependências e scripts
└── README.md                  # Este arquivo
```

## Arquivo de Utilities Compartilhadas

O arquivo `test-utils.js` contém setup compartilhado entre testes de integração e sistema:

- **SQLiteLocalStorage** - Classe que implementa a interface de localStorage usando SQLite para testes que requerem persistência real
- **usarLocalStorageSQLite()** - Função assíncrona que inicializa o banco de dados SQLite e substitui globalThis.localStorage

## Notas Técnicas

- **Testes de Unidade**: Utilizam mock simples de localStorage para testes rápidos e isolados
- **Testes de Integração**: Usam SQLite (via sql.js) para testar persistência real de dados
- **Testes de Sistema**: Usam jsdom para simular um navegador completo com DOM e executar fluxos E2E

## Conformidade e Validação

✅ Todos os 29 testes passam com sucesso  
✅ Nenhum teste pendente ou pulado  
✅ Todos os sete requisitos funcionais implementados e testados

## Desenvolvimento

Este projeto foi desenvolvido como trabalho prático (TP02) de disciplina de Engenharia de Software, com foco em qualidade de teste, organização de código e boas práticas de desenvolvimento.
