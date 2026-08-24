# VS Code Theme Inspector

## Plano Mestre de Arquitetura, Implementação e Open Source

---

# 0. Amendment — Modelo de interação de dois modos (pós-bootstrap)

**Esta seção corrige a interpretação inicial do produto. O restante deste
documento (seções 1+) é o plano original e deve ser lido à luz desta
correção — em especial as seções 14 e 15, que discutem "Selecionar
elemento" de um jeito que este amendment torna concreto.**

A experiência principal do Theme Inspector é um **inspetor visual por
hover**, não a interface de categorias/busca (essa continua existindo,
como segunda forma de uso). O produto final oferece dois modos:

1. **Hover Inspector (modo principal)** — `Theme Inspector: Turn On` ativa
   a inspeção por hover sobre **conteúdo de texto em editores**
   (JSON/CSS/SCSS/LESS: `settings.json`, arquivos de tema, stylesheets):
   passar o mouse sobre um Theme Color ID ou uma variável `--vscode-*`
   destaca o trecho e mostra o ID, categoria e descrição; um link no hover
   abre o Theme Color Explorer já buscando aquele ID para resolução ao
   vivo/copy. `Theme Inspector: Turn Off` desativa completamente, sem
   deixar highlight.
2. **Theme Color Explorer (modo complementar, já implementado)** — a
   interface de busca/categorias existente
   (`InspectorViewProvider`/`packages/theme-colors`), acessível via
   `Theme Color Explorer` na Activity Bar ou pelo comando
   `Theme Inspector: Open Theme Color Explorer`, disponível
   independentemente do estado ON/OFF do Hover Inspector.

**Descoberta técnica crítica e decisão**: não existe API pública da
extensão que dê acesso ao DOM do Workbench (confirmado em
[ADR 0004](adr/0004-inspector-strategy.md)). A única forma tecnicamente
viável de hover sobre a UI real (Activity Bar, Side Bar, Status Bar,
Panel) é o **Chrome DevTools Protocol (CDP)** via `--remote-debugging-port`
— validado empiricamente nesta sessão (não apenas pesquisado), mas
**recusado pelo usuário** por abrir uma porta local que aceita execução
arbitrária de JavaScript no Workbench, além de exigir reiniciar o VS Code
por completo e não funcionar no VS Code para Web/Codespaces. A decisão
final foi usar **apenas `vscode.languages.registerHoverProvider`**,
100% suportado e sem esses riscos, ao custo explícito de não cobrir a UI
fora do editor de texto. Ver
[ADR 0005](adr/0005-hover-inspector-strategy.md) para a investigação
completa (mantida como referência, incluindo a pesquisa de CDP) e a
decisão final.

Comandos do Command Palette (nomes sujeitos a ajuste fino, intenção fixa):

- `Theme Inspector: Turn On`
- `Theme Inspector: Turn Off`
- `Theme Inspector: Open Theme Color Explorer`
- (opcional) `Theme Inspector: Toggle Inspector`

Estado: `OFF → Turn On → ON (Hover Inspector ativo) → Turn Off → OFF`,
controlado pelo sistema de comandos da extensão e refletido na status bar.

---

# 1. Visão do projeto

Construir um projeto open source para inspeção, análise e customização de temas do Visual Studio Code.

O projeto deve começar como uma extensão chamada provisoriamente:

**Theme Inspector**

mas sua arquitetura deve permitir evolução futura para:

**Theme Lab**

A extensão oficial NÃO deve conter toda a lógica do projeto.

O objetivo é construir uma arquitetura reutilizável na qual outras extensões, ferramentas e aplicações possam utilizar o núcleo do projeto.

A arquitetura deve seguir:

```text
┌─────────────────────────────────────────────┐
│                 Consumers                   │
│                                             │
│  Official Extension                         │
│  Third-party Extensions                     │
│  Theme Editors                              │
│  Developer Tools                            │
│  Future Applications                        │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              Public API                     │
│                                             │
│  Theme Inspector API                        │
│  Theme Color API                            │
│  Resolver API                               │
│  Parser API                                 │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                 Core                        │
│                                             │
│  Theme Color Registry                       │
│  CSS Variable Parser                        │
│  Color Resolver                             │
│  Candidate Resolver                         │
│  JSON Generator                             │
│  Color Utilities                            │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             Platform Adapters               │
│                                             │
│  VS Code Adapter                            │
│  Workbench Integration                      │
│  Future Adapters                             │
└─────────────────────────────────────────────┘
```

A regra arquitetural fundamental é:

> A extensão oficial deve consumir o core, e não o contrário.

---

# 2. Objetivos

O projeto deve permitir:

1. descobrir visualmente cores da interface do VS Code;
2. identificar Theme Color IDs;
3. identificar CSS variables relacionadas;
4. resolver cores computadas;
5. mostrar possíveis fontes de uma cor;
6. gerar `workbench.colorCustomizations`;
7. futuramente aplicar alterações em tempo real;
8. futuramente editar temas;
9. fornecer uma API reutilizável para terceiros;
10. ser suficientemente bem documentado para que outro desenvolvedor consiga utilizar o core sem estudar a implementação interna.

---

# 3. Princípios arquiteturais

Seguir estes princípios durante todo o desenvolvimento.

## 3.1. Core first

A lógica de domínio deve ficar fora da extensão.

Não fazer:

```text
extension.ts
    ├── parser
    ├── resolver
    ├── registry
    ├── color conversion
    └── UI
```

Preferir:

```text
core
    ├── parser
    ├── resolver
    ├── registry
    └── color utilities

extension
    └── utiliza core
```

---

# 4. Separação de responsabilidades

Separar claramente:

## Core

Responsável por:

- Theme Color IDs;
- CSS variable parsing;
- resolução;
- modelos;
- normalização de cores;
- geração de overrides;
- regras de domínio.

O core não deve depender da API do VS Code quando não for necessário.

---

## VS Code Adapter

Responsável por:

- VS Code Extension API;
- configuração;
- comandos;
- Workbench;
- comunicação;
- lifecycle;
- integração com o ambiente.

---

## Extension

Responsável por:

- UX;
- comandos;
- UI;
- ativação;
- conexão entre core e VS Code.

---

# 5. Estrutura do monorepo

Preferir uma estrutura de monorepo caso isso seja tecnicamente adequado:

```text
vscode-theme-inspector/
│
├── apps/
│   └── vscode-extension/
│
├── packages/
│   ├── core/
│   ├── theme-colors/
│   └── vscode-adapter/
│
├── docs/
│
├── examples/
│
├── scripts/
│
├── tests/
│
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
├── package.json
├── tsconfig.json
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
└── .gitignore
```

Adaptar essa estrutura caso a pesquisa técnica demonstre que um monorepo adicionaria complexidade desnecessária no estágio inicial.

Não utilizar monorepo apenas por moda.

A decisão deve ser justificada.

---

# 6. Pacotes

## 6.1. `core`

Responsável pela lógica independente de VS Code.

Exemplos:

```text
ThemeColor
ThemeColorCandidate
ResolvedColor
InspectionResult
ColorSource
Confidence
```

Deve conter:

- parsing;
- normalização;
- resolução;
- geração;
- utilitários.

---

## 6.2. `theme-colors`

Responsável pelo registry dos Theme Color IDs.

Exemplo:

```ts
getThemeColor("sideBar.background");
```

Deve retornar metadados quando disponíveis:

```ts
{
    id: "sideBar.background",
    category: "Side Bar",
    description: "...",
    cssVariable: "--vscode-sideBar-background"
}
```

---

## 6.3. `vscode-adapter`

Responsável por adaptar mecanismos específicos do VS Code ao core.

O core não deve importar:

```ts
import * as vscode from "vscode";
```

quando não houver necessidade.

---

## 6.4. `apps/vscode-extension`

A extensão oficial.

Responsável por:

- activation;
- commands;
- UI;
- inspector;
- configuração;
- integração com os packages.

---

# 7. API pública

A API pública deve ser tratada como produto.

Não expor classes internas acidentalmente.

Definir claramente:

```text
Public API
Internal API
Experimental API
```

Exemplo conceitual:

```ts
import {
    ThemeInspector,
    ThemeColorResolver,
    ThemeColorRegistry
} from "@project/core";
```

O nome real dos pacotes deve ser definido depois que o nome final e o namespace forem estabelecidos.

---

# 8. Estabilidade da API

Usar a seguinte política:

```text
Public
    ↓
compatibilidade semântica

Experimental
    ↓
pode sofrer mudanças

Internal
    ↓
sem garantia de compatibilidade
```

Documentar breaking changes.

Não expor tipos internos apenas porque são convenientes.

---

# 9. Design da API

A API deve ser:

- pequena;
- previsível;
- tipada;
- composável;
- documentada;
- independente da UI.

Evitar APIs gigantes.

Preferir:

```ts
const result = resolver.resolve(input);
```

a:

```ts
const engine = new MassiveThemeEngine(...)
```

com dezenas de responsabilidades.

---

# 10. Modelo de inspeção

Criar um modelo que represente o resultado da inspeção.

Exemplo conceitual:

```ts
interface InspectionResult {
    element: InspectedElement;
    colors: ThemeColorCandidate[];
    resolvedStyles?: ResolvedStyle[];
}
```

Cada candidato deve possuir:

```ts
interface ThemeColorCandidate {
    id: string;
    cssVariable?: string;
    resolvedColor?: Color;
    source?: ColorSource;
    confidence: Confidence;
}
```

---

# 11. Confidence system

Nunca afirmar que um Theme Color ID controla determinado elemento sem evidência suficiente.

Definir:

```ts
type Confidence =
    | "exact"
    | "likely"
    | "possible"
    | "unknown";
```

Exemplo:

```text
sideBar.background
Confidence: exact
Evidence: --vscode-sideBar-background
```

Ou:

```text
editorGroup.border
Confidence: possible
Evidence: computed style / inherited style
```

---

# 12. Pesquisa técnica obrigatória

Antes de implementar o Inspector visual, investigar profundamente:

- VS Code Extension API;
- Theme Color API;
- Workbench DOM;
- CSS variables;
- Electron;
- Developer Tools;
- Webviews;
- WebviewView;
- comandos disponíveis;
- APIs públicas;
- limitações de segurança;
- limitações de sandbox;
- possibilidades de comunicação entre contextos.

Pergunta fundamental:

> Uma extensão instalada no VS Code consegue acessar diretamente o DOM do Workbench?

Não assumir que sim.

Se não conseguir, determinar a alternativa tecnicamente mais robusta.

---

# 13. Regra contra APIs inexistentes

Não inventar APIs.

Não utilizar:

```ts
vscode.someInternalFunction()
```

sem verificar sua existência e estabilidade.

Não copiar soluções da internet sem verificar a versão atual do VS Code.

Classificar técnicas como:

```text
Official
Experimental
Internal
Unsupported
```

---

# 14. Estratégias possíveis para o Inspector

Investigar e comparar:

### A

API pública.

### B

Webview + comunicação.

### C

DevTools.

### D

Electron integration.

### E

Extensão + mecanismo auxiliar.

### F

Abordagem híbrida.

Para cada alternativa documentar:

```text
Viabilidade
Complexidade
Estabilidade
Performance
Compatibilidade
Risco de quebra
```

Só então escolher.

---

# 15. MVP

> Ver seção 0 (Amendment) e ADR 0005. "Selecionar elemento" abaixo é hover
> sobre um Theme Color ID/variável `--vscode-*` **dentro de um editor de
> texto** (não sobre a UI do Workbench em si — essa cobertura foi avaliada
> via CDP e recusada pelo usuário por risco de segurança). A busca por
> categoria é o Theme Color Explorer, um fluxo MVP separado que já existe e
> não é substituído por este.

O MVP deve fazer:

```text
Start Inspector
        ↓
Selecionar elemento
        ↓
Detectar elemento
        ↓
Extrair evidências
        ↓
Resolver Theme Color
        ↓
Mostrar resultado
        ↓
Copy ID
        ↓
Copy JSON
```

---

# 16. Não modificar configurações no MVP

O MVP não deve alterar automaticamente:

```text
settings.json
```

Nem:

```text
workbench.colorCustomizations
```

Deve apenas gerar:

```json
"sideBar.background": "#202020"
```

ou:

```json
"workbench.colorCustomizations": {
    "sideBar.background": "#202020"
}
```

---

# 17. Geração de JSON

A API deve permitir:

```ts
generateOverride({
    id: "sideBar.background",
    color: "#202020"
});
```

Resultado:

```json
"sideBar.background": "#202020"
```

Deve preservar corretamente:

- hexadecimal;
- RGB;
- RGBA;
- alpha;
- valores válidos.

---

# 18. Configuração existente

Futuramente, ao aplicar mudanças:

Nunca substituir:

```json
"workbench.colorCustomizations"
```

inteiramente.

Preservar:

```text
existing settings
existing theme scopes
existing colors
```

Adicionar ou alterar apenas o ID solicitado.

---

# 19. Suporte a temas específicos

Planejar suporte para:

```json
"workbench.colorCustomizations": {
    "[Min Dark]": {}
}
```

e:

```json
"workbench.colorCustomizations": {
    "[Min Dark]": {},
    "[Default Dark Modern]": {}
}
```

O MVP pode trabalhar inicialmente no escopo global.

---

# 20. Theme Color Registry

Não limitar ao Min Dark.

Utilizar a referência oficial do VS Code como fonte primária.

O registry deve conter todos os IDs relevantes disponíveis na versão suportada.

Criar mecanismos para atualização futura.

Evitar que o registry fique completamente dependente de manutenção manual se for possível automatizá-lo.

---

# 21. Versionamento do registry

O registry pode depender da versão do VS Code.

Documentar:

```text
VS Code version
Theme Color registry version
Extension version
```

Se necessário, suportar diferentes versões do registry.

---

# 22. Parser de CSS Variables

Detectar:

```text
--vscode-editor-background
--vscode-sideBar-background
--vscode-activityBar-background
```

e mapear para:

```text
editor.background
sideBar.background
activityBar.background
```

Não implementar uma conversão ingênua baseada simplesmente em hífens.

Criar parser testável e independente.

---

# 23. Color Engine

Criar um pequeno módulo responsável por:

- RGB;
- RGBA;
- HEX;
- HEX com alpha;
- normalização;
- comparação;
- transparência;
- conversão.

Exemplo:

```ts
parseColor(...)
normalizeColor(...)
toHex(...)
toRgba(...)
```

Não espalhar lógica de cor pela extensão.

---

# 24. Inspector Engine

O Inspector Engine deve ser independente da UI.

Exemplo:

```ts
const result = await inspector.inspect(target);
```

A UI recebe:

```ts
InspectionResult
```

e decide como mostrar.

Isso permite que terceiros utilizem o engine sem utilizar a UI oficial.

---

# 25. UI

A UI oficial deve mostrar:

```text
Element
Theme Colors
CSS Variables
Resolved Colors
Confidence
Evidence
```

Exemplo:

```text
Explorer

Theme Colors

sideBar.background
#181818
Exact

CSS Variable
--vscode-sideBar-background

[Copy ID]
[Copy JSON]
```

---

# 26. Pesquisa

Adicionar busca por:

```text
sideBar
editor
activityBar
background
foreground
border
```

O usuário deve conseguir procurar IDs rapidamente.

---

# 27. Categorias

Organizar Theme Colors por categorias:

```text
Editor
Side Bar
Activity Bar
Status Bar
Tabs
Terminal
Panel
Input
Menu
List
Tree
Debug
Search
Notification
Workbench
...
```

---

# 28. Visualização

Mostrar uma amostra da cor:

```text
██████  #181818
```

ou equivalente.

A UI deve continuar funcional em temas claros e escuros.

---

# 29. Futuro: Live Preview

Após o MVP:

```text
Inspector
    ↓
Theme Color
    ↓
Color Picker
    ↓
Preview
```

A alteração deve ser reversível.

---

# 30. Futuro: Theme Editor

Possível evolução:

```text
Theme Lab
│
├── Inspector
├── Color Editor
├── Token Editor
├── Semantic Token Editor
├── Theme Diff
└── Export
```

Não implementar tudo agora.

A arquitetura apenas deve evitar bloquear essa evolução.

---

# 31. Futuro: Exportação

Planejar exportação para:

```text
settings.json
theme.json
VS Code theme extension
```

Possivelmente:

```text
npm package
VSIX
theme package
```

---

# 32. Reutilização por terceiros

Essa é uma prioridade do projeto.

Um terceiro deve conseguir:

1. instalar o package;
2. importar a API;
3. criar um resolver;
4. realizar inspeções;
5. utilizar os modelos;
6. integrar os resultados à própria UI.

Sem precisar copiar código da extensão oficial.

---

# 33. Exemplos

Criar exemplos reais.

Exemplo:

```text
examples/
└── basic-inspector/
```

Demonstrar:

```ts
import {
    ThemeColorRegistry
} from "...";

const color = registry.get("sideBar.background");
```

Outro exemplo deve mostrar:

```text
resolver
    ↓
InspectionResult
    ↓
custom UI
```

---

# 34. Documentação da API

Gerar documentação clara.

Para cada API pública:

```text
Nome
Descrição
Parâmetros
Retorno
Exemplo
Erros
Estabilidade
```

Exemplo:

```text
ThemeColorRegistry.get()

Returns metadata for a Theme Color ID.
```

---

# 35. README

O README deve ter:

## Introdução

O que o projeto resolve.

## Screenshot/GIF

Quando houver uma versão funcional.

## Features

Lista objetiva.

## Instalação

Extensão.

## Uso

Passo a passo.

## Uso como biblioteca

Exemplo de código.

## Arquitetura

Link para documentação.

## Contribuição

Link para CONTRIBUTING.

## Licença

MIT.

---

# 36. Open Source

O projeto será:

**Público e open source.**

Licença recomendada:

**MIT**

Confirmar essa decisão antes de publicar.

A licença deve permitir:

- uso pessoal;
- uso comercial;
- modificação;
- redistribuição;
- incorporação em outros projetos.

---

# 37. CONTRIBUTING

Criar um guia de contribuição explicando:

- setup;
- Node version;
- package manager;
- build;
- testes;
- lint;
- arquitetura;
- convenções;
- commits;
- pull requests.

---

# 38. CODE_OF_CONDUCT

Adicionar um Code of Conduct padrão adequado a projetos open source.

---

# 39. SECURITY

Criar `SECURITY.md`.

Explicar como reportar vulnerabilidades.

Não exigir publicação pública de vulnerabilidades antes de correção.

---

# 40. Git — regra fundamental

O Git deve ser tratado como parte da arquitetura do projeto.

O histórico precisa ser:

- limpo;
- consistente;
- explicativo;
- auditável;
- reversível.

Nunca usar commits genéricos como:

```text
update
fix
changes
stuff
final
final2
```

---

# 41. Conventional Commits

Usar:

```text
feat:
fix:
refactor:
test:
docs:
perf:
build:
ci:
chore:
style:
revert:
```

Exemplos:

```text
feat: add theme color registry
feat: add inspection result model
feat: add css variable parser
feat: add workbench inspector
fix: preserve alpha channel during color conversion
refactor: isolate theme resolution from vscode adapter
test: add coverage for theme color parser
docs: document public resolver API
build: configure workspace packages
ci: validate extension build
```

---

# 42. Regra 1 commit = 1 mudança lógica

Evitar:

```text
feat: add inspector
```

contendo simultaneamente:

- 30 arquivos;
- nova arquitetura;
- UI;
- parser;
- registry;
- documentação;
- testes;
- refatorações.

Separar quando possível.

---

# 43. Antes de cada commit

Sempre executar:

```bash
git status
git diff
git diff --cached
```

Verificar:

- arquivos modificados;
- arquivos novos;
- arquivos acidentalmente incluídos;
- secrets;
- código de debug;
- arquivos gerados indevidamente.

Depois executar os testes relevantes.

Só então criar o commit.

---

# 44. Não esconder problemas em commits

Nunca utilizar:

```bash
git add .
git commit -m "fix"
```

sem revisar o conteúdo.

O agente deve entender o que está sendo commitado.

---

# 45. Branch strategy

Manter:

```text
main
```

estável.

Features relevantes devem utilizar branches:

```text
feat/theme-color-registry
feat/inspector-core
feat/workbench-integration
feat/live-preview
fix/color-resolution
```

Experimentos:

```text
experiment/workbench-dom
experiment/devtools-integration
```

---

# 46. Experimentos técnicos

Quando houver incerteza sobre uma tecnologia crítica:

Criar uma pequena prova de conceito.

Exemplo:

```text
experiment/workbench-inspection-poc
```

O objetivo é responder uma pergunta específica.

Não misturar POC com arquitetura definitiva.

Se falhar:

```text
documentar resultado
```

e descartar a abordagem.

---

# 47. Main

`main` deve permanecer:

- compilável;
- testável;
- sem código experimental;
- sem credenciais;
- sem hacks temporários não documentados.

---

# 48. Tags

Usar Semantic Versioning:

```text
v0.1.0
v0.2.0
v0.3.0
v1.0.0
```

Durante desenvolvimento inicial:

```text
0.x
```

pode indicar API ainda instável.

---

# 49. API pública e SemVer

Quando a API pública estiver estável:

```text
PATCH
```

para correções compatíveis.

```text
MINOR
```

para funcionalidades compatíveis.

```text
MAJOR
```

para breaking changes.

Documentar breaking changes no CHANGELOG.

---

# 50. CI

Criar GitHub Actions para:

```text
push
pull_request
```

Executando:

```text
install
lint
typecheck
test
build
package
```

quando aplicável.

---

# 51. Quality gates

Não aceitar implementação que:

- não compila;
- quebra testes existentes;
- introduz TypeScript `any` desnecessariamente;
- possui APIs internas sem justificativa;
- contém código morto;
- não documenta uma API pública nova;
- perde configurações existentes;
- introduz secrets;
- possui dependências desnecessárias.

---

# 52. Dependências

Manter dependências pequenas.

Antes de adicionar uma dependência:

1. verificar se a funcionalidade pode ser implementada com APIs nativas;
2. avaliar tamanho;
3. avaliar manutenção;
4. avaliar licença;
5. avaliar segurança;
6. avaliar necessidade real.

Não adicionar uma biblioteca de 500 KB para resolver uma função de 20 linhas.

---

# 53. TypeScript

Usar TypeScript com configuração rigorosa.

Preferir:

```json
{
    "strict": true
}
```

Evitar:

```ts
any
```

quando tipos reais forem possíveis.

---

# 54. Testes

Cobrir especialmente:

- parser;
- resolver;
- registry;
- color engine;
- JSON generator;
- configuração;
- preservação de overrides.

Testes da UI devem ser adicionados conforme a arquitetura permitir.

---

# 55. Testes de integração

Criar testes de integração para componentes que dependam do VS Code quando viável.

Separar:

```text
unit tests
integration tests
manual tests
```

---

# 56. Performance

O Inspector não deve ficar analisando continuamente a interface quando está inativo.

Evitar polling agressivo.

Preferir eventos.

Quando polling for inevitável:

- intervalo razoável;
- cleanup;
- cancelamento;
- zero atividade quando desativado.

---

# 57. Lifecycle

Garantir cleanup de:

- listeners;
- timers;
- disposables;
- webviews;
- recursos temporários.

Utilizar os mecanismos de disposal do VS Code.

---

# 58. Compatibilidade

Definir uma versão mínima realista do VS Code.

Não declarar suporte amplo sem testar.

Documentar:

```text
Minimum VS Code version
Supported platforms
Known limitations
```

---

# 59. Min Dark

Testar explicitamente:

```text
Min Dark
```

mas nunca implementar lógica específica para ele.

Também testar:

```text
Default Dark Modern
Default Light Modern
High Contrast
```

quando possível.

---

# 60. Resultado do MVP

> Ver seção 0 (Amendment) e ADR 0005. "Selecionar Explorer" abaixo deve ser
> lido como "hover sobre um Theme Color ID/variável CSS dentro de um
> arquivo aberto no editor", via `Theme Inspector: Turn On` — não sobre o
> painel Explorer da UI do Workbench (fora do alcance da API pública), e
> não como abrir o Theme Color Explorer da extensão (a funcionalidade de
> categorias, testada separadamente).

O MVP é considerado concluído quando:

```text
VS Code
   ↓
Theme Inspector
   ↓
Start Inspector
   ↓
Selecionar Explorer
   ↓
Encontrar evidência CSS
   ↓
Resolver sideBar.background
   ↓
Mostrar #XXXXXX
   ↓
Copy ID
   ↓
Copy JSON
```

funcionar de forma confiável.

---

# 61. Regra de honestidade técnica

Se determinada funcionalidade não puder ser implementada com as APIs disponíveis:

NÃO:

- inventar uma API;
- fingir que funciona;
- criar um hack silencioso;
- declarar suporte inexistente.

SIM:

1. documentar a limitação;
2. testar alternativas;
3. classificar a alternativa;
4. escolher a mais robusta;
5. criar uma camada de abstração para substituí-la no futuro.

---

# 62. Ordem obrigatória de execução

Não implementar tudo simultaneamente.

Executar:

```text
FASE 0
Pesquisa técnica
        ↓
FASE 1
Decisão arquitetural
        ↓
FASE 2
Monorepo / skeleton
        ↓
FASE 3
Core
        ↓
FASE 4
Theme Color Registry
        ↓
FASE 5
Color Engine
        ↓
FASE 6
VS Code Adapter
        ↓
FASE 7
Inspector POC
        ↓
FASE 8
Inspector MVP
        ↓
FASE 9
JSON Generator
        ↓
FASE 10
UI
        ↓
FASE 11
Tests + CI
        ↓
FASE 12
Documentation
        ↓
FASE 13
First public release
```

---

# 63. Primeira tarefa do agente

NÃO começar escrevendo centenas de arquivos.

Primeiro:

### 1.

Pesquisar a viabilidade real do Inspector.

### 2.

Identificar as limitações da Extension API.

### 3.

Comparar as alternativas.

### 4.

Propor arquitetura.

### 5.

Explicar a decisão.

### 6.

Só depois criar o skeleton.

---

# 64. Primeiro relatório esperado

Antes da implementação, apresentar:

```text
Technical Feasibility
Architecture Decision
Repository Structure
Package Boundaries
Public API Proposal
Inspector Strategy
Known Limitations
Testing Strategy
Git Strategy
Implementation Roadmap
```

Depois da aprovação/validação da arquitetura, iniciar a implementação.

---

# 65. Filosofia do projeto

O projeto deve ser desenvolvido pensando:

```text
Não apenas:
"Como faço essa extensão funcionar?"

Mas:
"Como crio uma infraestrutura que permita que outras pessoas
construam ferramentas sobre ela?"
```

A extensão oficial é o primeiro consumidor.

O core é o produto arquitetural principal.

A API pública é uma parte fundamental do projeto.

A documentação é parte do produto.

Os testes são parte do produto.

O histórico Git é parte da documentação.

A estabilidade da API é uma responsabilidade do projeto.

---

# 66. Critério final de qualidade

O projeto deve chegar a um ponto em que um desenvolvedor externo consiga:

```text
clonar
    ↓
instalar dependências
    ↓
executar testes
    ↓
executar extensão
    ↓
ler documentação
    ↓
instalar package
    ↓
importar API
    ↓
criar sua própria integração
```

sem precisar conversar com o autor para descobrir como o sistema funciona.

Esse é um requisito de qualidade do projeto.

---

# 67. Regra final para o agente

Sempre priorizar:

```text
Correção
>
Arquitetura
>
Manutenibilidade
>
API pública
>
Testabilidade
>
Documentação
>
Performance
>
UX
>
Quantidade de funcionalidades
```

Não sacrificar arquitetura para implementar uma feature rapidamente.

Não criar abstrações desnecessárias apenas para parecer arquitetural.

Toda abstração deve existir porque existe uma responsabilidade clara, uma fronteira de domínio ou uma necessidade de reutilização.

O objetivo é construir um projeto pequeno o suficiente para ser compreensível, mas sólido o suficiente para crescer.

Comece pela FASE 0.