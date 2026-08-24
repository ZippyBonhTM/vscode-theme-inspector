# VS Code Theme Inspector — Bootstrap Plan

## Objetivo

Preparar o repositório `vscode-theme-inspector` para desenvolvimento profissional e open source.

Este documento descreve exclusivamente a fase inicial de preparação do projeto.

IMPORTANTE:

Nesta fase NÃO implementar o Theme Inspector.

O objetivo é preparar a infraestrutura, estabelecer as convenções e validar as decisões técnicas necessárias para que a implementação posterior seja segura e organizada.

O plano completo de implementação está em:

docs/implementation-plan.md

---

# 1. Princípio fundamental

O projeto será:

- público;
- open source;
- reutilizável por terceiros;
- escrito principalmente em TypeScript;
- desenvolvido com foco em qualidade, manutenção e extensibilidade.

A extensão oficial do VS Code será apenas uma aplicação do núcleo do projeto.

A arquitetura futura deverá permitir que terceiros utilizem o core sem depender da UI da extensão oficial.

---

# 2. Primeira regra: não implementar funcionalidades

Durante este bootstrap, NÃO implementar:

- visual inspector;
- Theme Color resolver completo;
- CSS variable resolver;
- color picker;
- live preview;
- edição de settings;
- UI final;
- Workbench DOM integration;
- DevTools integration.

Esses itens pertencem ao plano principal.

Se uma decisão técnica exigir uma pequena prova de conceito, ela deve ser explicitamente identificada como POC e não deve ser confundida com a implementação definitiva.

---

# 3. Inspecionar o ambiente

Antes de alterar o projeto, verificar:

- versão do Node.js;
- versão do npm/pnpm/yarn disponível;
- versão do Git;
- sistema operacional;
- versão do VS Code;
- disponibilidade do TypeScript;
- ferramentas de lint;
- ferramentas de testes;
- configuração Git atual;
- remote do repositório.

Executar comandos equivalentes a:

git --version
node --version
npm --version
code --version
git remote -v
git status

Não assumir versões.

Registrar as versões relevantes na documentação de desenvolvimento.

---

# 4. Verificar o Git

Confirmar:

- repositório Git inicializado;
- branch principal;
- remote correto;
- usuário Git configurado;
- e-mail Git configurado;
- working tree limpo.

Executar:

git status
git branch
git remote -v
git config user.name
git config user.email

NÃO alterar configurações globais do Git sem autorização explícita.

Se algo estiver incorreto, informar antes de modificar.

---

# 5. Verificar GitHub

Utilizar a integração GitHub disponível no ambiente.

Confirmar:

- acesso ao repositório;
- nome do repositório;
- owner;
- branch principal;
- permissões disponíveis.

Não criar Issues, Pull Requests ou Releases automaticamente nesta fase.

Não modificar configurações do repositório sem necessidade.

---

# 6. Criar estrutura inicial

Criar uma estrutura inicial mínima e limpa.

Proposta:

vscode-theme-inspector/
│
├── .github/
│   └── workflows/
│
├── docs/
│   ├── implementation-plan.md
│   └── bootstrap-plan.md
│
├── packages/
│
├── apps/
│
├── examples/
│
├── scripts/
│
├── CLAUDE.md
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
└── package.json

A estrutura pode ser ajustada se a análise técnica demonstrar que determinada pasta é desnecessária.

Não criar abstrações vazias apenas para preencher diretórios.

---

# 7. CLAUDE.md

Criar um `CLAUDE.md` na raiz.

Esse arquivo deve conter as instruções permanentes para agentes trabalhando no projeto.

Ele deve estabelecer:

## Projeto

O que o projeto é.

## Arquitetura

Core → adapters → extension.

## Prioridades

Correção > arquitetura > manutenção > API pública > testes > documentação > funcionalidades.

## Git

Utilizar Conventional Commits.

Revisar diff antes dos commits.

Não criar commits genéricos.

Não misturar mudanças independentes.

## Segurança

Nunca commitar:

- tokens;
- API keys;
- senhas;
- certificados;
- arquivos `.env`;
- credenciais;
- dados privados.

## Desenvolvimento

Executar testes antes de commits relevantes.

Não inventar APIs.

Pesquisar documentação oficial quando houver dúvida.

## Código

TypeScript strict.

Evitar `any`.

Evitar dependências desnecessárias.

## Processo

Ler:

docs/bootstrap-plan.md

antes de executar o bootstrap.

Depois ler:

docs/implementation-plan.md

antes de iniciar a implementação.

---

# 8. README inicial

Criar um README mínimo.

Ele deve explicar:

# VS Code Theme Inspector

Uma ferramenta open source para inspeção visual das cores e tokens do Workbench do VS Code.

O README inicial deve deixar claro que o projeto está em desenvolvimento.

Não prometer funcionalidades que ainda não existem.

Exemplo de status:

> Early development — APIs and architecture are subject to change.

Adicionar posteriormente:

- screenshots;
- GIF;
- instalação;
- uso;
- API;
- arquitetura;
- contribuição.

---

# 9. LICENSE

Utilizar MIT License.

O copyright deve utilizar o nome definido pelo proprietário do projeto.

Não inventar informações pessoais.

---

# 10. CONTRIBUTING.md

Criar documentação inicial para contribuidores.

Incluir:

- como clonar;
- como instalar dependências;
- como executar;
- como testar;
- como criar branch;
- convenções de commits;
- Pull Requests;
- testes obrigatórios;
- documentação.

O documento será refinado conforme a arquitetura evoluir.

---

# 11. CODE_OF_CONDUCT.md

Adicionar um Code of Conduct adequado para projeto open source.

Não criar regras excessivamente complexas.

---

# 12. SECURITY.md

Criar política inicial de segurança.

Explicar:

- como reportar vulnerabilidades;
- não publicar detalhes de vulnerabilidades não corrigidas em Issues;
- como serão tratadas vulnerabilidades de segurança.

---

# 13. CHANGELOG.md

Criar changelog inicial:

## Unreleased

Ainda não existem releases públicas.

Não inventar versões ou funcionalidades.

---

# 14. .gitignore

Criar `.gitignore` adequado para:

- Node.js;
- TypeScript;
- VS Code;
- builds;
- coverage;
- logs;
- arquivos temporários;
- arquivos de ambiente;
- dependências.

Nunca ignorar arquivos necessários ao projeto.

---

# 15. Package manager

Determinar o package manager após verificar o ambiente.

Escolher UMA estratégia:

npm
ou
pnpm
ou
yarn

Não utilizar múltiplos package managers.

Se for utilizado pnpm, por exemplo, versionar:

pnpm-lock.yaml

Se for npm:

package-lock.json

O lockfile deve ser versionado.

---

# 16. Monorepo

Avaliar se o projeto realmente deve utilizar monorepo.

A arquitetura desejada possui potencial para:

apps/
packages/

mas isso não significa que devemos adicionar complexidade desnecessária.

Comparar:

### Opção A

Monorepo desde o início.

### Opção B

Core e extensão no mesmo package inicialmente, com separação arquitetural.

### Opção C

Core separado desde o início.

Escolher com base em:

- simplicidade;
- reutilização;
- build;
- testes;
- publicação;
- DX;
- manutenção.

Registrar a decisão em:

docs/architecture-decision.md

---

# 17. TypeScript

Definir configuração TypeScript apropriada.

Preferir:

strict: true

Avaliar:

- target;
- module;
- moduleResolution;
- declarations;
- source maps;
- noUncheckedIndexedAccess;
- exactOptionalPropertyTypes;
- noUnusedLocals;
- noUnusedParameters.

Não habilitar opções apenas para parecer mais rigoroso.

Cada configuração deve ser compatível com o projeto.

---

# 18. Lint

Escolher uma ferramenta de lint.

Avaliar opções atuais.

O lint deve:

- detectar problemas reais;
- possuir configuração versionada;
- funcionar no CI;
- não gerar centenas de regras arbitrárias.

Não adicionar Prettier, ESLint ou Biome simultaneamente sem necessidade.

---

# 19. Formatting

Escolher uma única estratégia de formatação.

Todos os arquivos TypeScript devem seguir a mesma convenção.

A formatação deve ser automatizável.

---

# 20. Test framework

Escolher um framework de testes adequado ao ecossistema TypeScript escolhido.

Avaliar:

- Vitest;
- Jest;
- Node test runner;
- outras alternativas atuais.

Priorizar simplicidade e velocidade.

Não escrever testes ainda além de um teste mínimo de infraestrutura, caso necessário.

---

# 21. CI

Criar GitHub Actions somente após definir:

- package manager;
- build;
- lint;
- typecheck;
- test.

O CI inicial deve validar:

install
→ lint
→ typecheck
→ test
→ build

Se alguma etapa ainda não existir, não criar um workflow artificial.

---

# 22. VS Code Extension Scaffold

Nesta fase, criar apenas o scaffold necessário para validar a arquitetura.

Não implementar o Inspector.

O scaffold deve permitir:

- compilar;
- iniciar a extensão;
- executar um comando mínimo;
- executar testes;
- empacotar posteriormente.

O comando inicial pode simplesmente confirmar que a extensão foi ativada.

---

# 23. Core

Criar apenas o esqueleto do package Core.

Exemplo:

packages/core/

O Core deve inicialmente possuir:

- entrada pública;
- configuração TypeScript;
- testes;
- documentação básica.

Não adicionar resolver complexo ainda.

---

# 24. Public API

Definir desde o início uma fronteira explícita:

src/index.ts

Tudo que for exportado por essa entrada deve ser considerado potencialmente público.

Evitar exportar módulos internos diretamente.

Exemplo conceitual:

import { ThemeColorRegistry } from "@.../core";

em vez de:

import { ThemeColorRegistry } from "@.../core/src/internal/registry";

---

# 25. Internal modules

Utilizar convenções claras para código interno.

Exemplo:

src/internal/

ou estrutura equivalente.

Código interno não deve ser utilizado pela extensão diretamente se houver uma API pública equivalente.

---

# 26. Documentação arquitetural

Criar:

docs/architecture-decision.md

Documentar:

- por que o core existe;
- por que existe separação do VS Code adapter;
- decisão sobre monorepo;
- package manager;
- TypeScript;
- testes;
- build;
- API pública.

Não escrever uma documentação enorme.

Registrar decisões reais.

---

# 27. ADRs

Quando uma decisão arquitetural importante for tomada, utilizar ADRs.

Exemplo:

docs/adr/

0001-core-separation.md
0002-package-architecture.md
0003-inspector-strategy.md

Não criar ADR para decisões triviais.

---

# 28. Git workflow

Utilizar:

main

como branch estável.

Features:

feat/...

Correções:

fix/...

Experimentos:

experiment/...

Refactors:

refactor/...

---

# 29. Primeiro commit

O primeiro commit deve representar exclusivamente o bootstrap.

Exemplo:

chore: initialize project structure

Ele pode conter:

- documentação inicial;
- licença;
- gitignore;
- configuração básica;
- estrutura inicial;
- CI inicial;
- scaffold mínimo.

Não incluir funcionalidades do Inspector.

---

# 30. Commits subsequentes

Separar mudanças lógicas.

Exemplo:

chore: initialize project structure

build: configure typescript workspace

build: configure package manager

test: configure test infrastructure

ci: add initial validation workflow

docs: document project architecture

feat: add extension scaffold

Cada commit deve ser justificável isoladamente.

---

# 31. Revisão antes de commit

Antes de cada commit:

git status

git diff

git diff --cached

Depois:

executar testes relevantes.

Verificar:

- secrets;
- arquivos temporários;
- builds;
- dependências;
- mudanças não relacionadas.

---

# 32. GitHub

Após o bootstrap local:

- verificar o remote;
- fazer push;
- verificar arquivos no GitHub;
- verificar Actions;
- verificar branch principal.

Não criar release ainda.

Não publicar VSIX ainda.

---

# 33. Primeiro objetivo verificável

Ao terminar o bootstrap:

O projeto deve conseguir:

1. clonar;
2. instalar dependências;
3. executar lint;
4. executar typecheck;
5. executar testes;
6. compilar;
7. iniciar a extensão;
8. passar pelo CI.

Nenhuma funcionalidade real do Inspector é necessária ainda.

---

# 34. Critério de conclusão

O bootstrap está concluído quando:

```text
Repository
    ↓
Clone
    ↓
Install
    ↓
Lint
    ↓
Typecheck
    ↓
Test
    ↓
Build
    ↓
VS Code Extension launches
    ↓
CI passes