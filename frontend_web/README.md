# Bisca Platform - Frontend (frontend_web)

Este repositório contém o frontend da "Bisca Platform" — uma aplicação construída com Vue 3, Vite e TailwindCSS. O objetivo deste README é documentar a arquitetura, funcionalidades, convenções e instruções para desenvolvimento, de forma a permitir que esta camada seja utilizada e estendida em prompts futuros ou por outros desenvolvedores.

---
## Sumário
- Visão geral
- Funcionalidades principais
- Arquitetura e tecnologias
- Estrutura do projeto
- Componentes principais
- Stores (Pinia)
- Rotas e navegação
- Assets e imagens de cartas
- Desenvolvimento local
- Build e deploy
- Integração com backend / websockets
- Como estender / adicionar novas funcionalidades
- Dicas de debugging e testes
- Contribuição

---

## Visão geral
O frontend implementa a interface de utilizador para:
- Registo e autenticação (mockada para desenvolvimento).
- Perfil de utilizador e gestão de moedas (coins).
- Jogo de cartas (UI para single-player e visualizações de jogo).
- Visualização de histórico, classificações e estatísticas.
- Painel administrativo (layout e views base).
- Componentes reutilizáveis para cartas, baralho e layout global.

Essencialmente, a aplicação foca na experiência visual do jogo, com stores mock para desenvolvimento isolado. A ligação a um backend real e a lógica do jogo em tempo real (websockets) é isolada e pode ser integrada posteriormente.

---

## Funcionalidades principais
- Navegação por páginas públicas e protegidas por autenticação.
- Mock de autenticação com papéis (`user` e `admin`) para testar fluxos.
- Sistema de temas (light/dark) com persistência no `localStorage`.
- Componentes de UI para cartas (`Card.vue`), baralho (`Deck.vue`) e layouts.
- Páginas:
  - `Home`, `Login`, `Register`, `Profile`, `Coins`, `Play`
  - `Game` (visualização de mesa e mãos), `GameSimple`, `Spectator`
  - `History`, `Leaderboards`, `Statistics`
  - `Admin` → `Dashboard`, `Users`, `Transactions`, `Games`, `Statistics`
- Imagens das cartas armazenadas em `src/assets/cards1` e expostas via store `cards`.

---

## Arquitetura e tecnologias
- Framework: Vue 3 (Composition API)
- Bundler / Dev server: Vite
- State management: Pinia
- Router: Vue Router 4
- CSS: TailwindCSS + PostCSS
- Estrutura modular: componentes, views, stores, router, assets

Relação entre camadas:
- Views → compõem páginas e usam componentes (Card, Deck, Navbar, Footer).
- Components → unidades reutilizáveis (UI).
- Stores (Pinia) → estado centralizado (autenticação mock, cards, theme, jogos mock).
- Router → controla proteções por rota (`requiresAuth`, `requiresAdmin`).

---

## Estrutura do projeto (principais ficheiros / pastas)
- `index.html` — ponto de entrada.
- `package.json` — scripts e dependências.
- `src/main.js` — bootstrapping do Vue, Pinia e Router.
- `src/App.vue` — wrapper da aplicação (aplica estilos globais).
- `src/style.css` — utilitários globais / Tailwind.
- `src/router/index.js` — configuração das rotas e guards.
- `src/stores/` — stores Pinia:
  - `stores/mocks/auth.js` — mock de autenticação.
  - `stores/mocks/games.js` — dados mock de jogos e leaderboard.
  - `stores/cards.js` — carregamento e utilitários relacionados às imagens de cartas.
  - `stores/theme.js` — gestão de tema dark/light.
- `src/components/` — componentes reutilizáveis:
  - `Card.vue`, `Deck.vue`, `Navbar.vue`, `Footer.vue`
  - `components/layouts/DefaultLayout.vue`, `AdminLayout.vue`
- `src/views/` — páginas da aplicação (Home, Login, Game, Profile, Admin/*, ...).
- `src/assets/cards1/` — imagens das cartas (importadas dinamicamente).

---

## Componentes principais (visão geral)
- `Card.vue`
  - Props: `suit`, `value`, `hidden`, `playable`, `selected`, `disabled`.
  - Integra com `useCardsStore()` para obter imagem, nome e back image.
  - Emite eventos ao ser clicada (`click`, `card-played`).
  - Usada tanto na UI do jogador como na mesa, e no `Deck` para mostrar trunfo.

- `Deck.vue`
  - Props: `stackSize`, `trumpCard`, `showTrump`, `interactive`.
  - Exibe o monte (pilha), contador de cartas e trunfo.
  - Emite `deck-clicked` e `card-drawn` quando interativo.

- Layouts (`DefaultLayout.vue`, `AdminLayout.vue`)
  - Contêm o `Navbar` e `Footer`, e a área `router-view()` para as views.
  - `AdminLayout` fornece um sidebar e controlos de tema.

- `Navbar.vue`
  - Mostra links de navegação condicionalmente consoante o estado de autenticação.
  - Botão para alternar tema.
  - Indicador de coins e avatar do utilizador (mock).

---

## Stores (Pinia) — responsabilidades
- `auth` (mocks/auth.js)
  - `user` (reactive)
  - Métodos: `login`, `register`, `logout`, `updateProfile`, `addCoins`
  - `isAuthenticated` e `isAdmin` como computed.
  - Atualmente mock: `login` e `register` populam `user` localmente. Deve ser substituído pela integração real com backend.

- `cards` (cards.js)
  - Tenta carregar imagens com `import.meta.glob` (eager) a partir de `src/assets/cards1/` (bundled). Caso as imagens tenham sido movidas para `public/cards1/` (ficheiros estáticos), o store implementa um fallback que constrói URLs públicos (ex.: `/cards1/c1.png`) para continuar a funcionar.
  - Fornece `getCardImage(suit, value)`, `getCardBackImage()` e utilitários de apresentação (`getSuitName`, `getSuitSymbol`, etc.). `getCardImage` primeiro tenta usar assets empacotados e, se não existir, devolve URL do `public/cards1/`.
  - Contém as listas de `validSuits` e `validValues`.

- `theme` (theme.js)
  - Guarda `isDark` com `localStorage` key `bisca_theme`.
  - `toggleTheme()` e `setTheme(theme)`.
  - Escuta mudanças do `prefers-color-scheme`.

- `games` (mocks/games.js)
  - Dados mock de histórico e leaderboard para a UI.

Observação: as stores mock existem para desenvolvimento stand-alone. Para produção, substituir pelos calls ao backend (REST / WebSocket) e adaptar a forma como o `user` e `games` são preenchidos.

---

## Router e guards
- Ficheiro: `src/router/index.js`
- Rotas usam `meta`:
  - `requiresAuth: true` → redireciona para `/login` se não autenticado.
  - `requiresAdmin: true` → verifica `authStore.isAdmin`.
- Rotas definidas para layout `DefaultLayout` (páginas públicas e privadas) e `AdminLayout` (área admin).

---

## Assets e imagens de cartas
- Locais suportados:
  - Bundled assets: `src/assets/cards1/` (importadas via `import.meta.glob("../assets/cards1/*.png", { eager: true })`).
  - Static public: `public/cards1/` (ficheiros estáticos servidos por Vite/servidor) — disponíveis em runtime em URLs como `/cards1/c1.png`.
- O `cards` store foi atualizado para suportar ambos: tenta usar os assets empacotados e, se não encontrar, devolve um URL público de fallback para `/cards1/<key>.png`. Isto garante que, ao mover as imagens para `public/`, a UI continua a mostrar as cartas.
- Convenção de nomes de ficheiro: `<suit><value>.png` (ex.: `c1.png`, `e13.png`) e `semFace.png` para o verso.
- O `Card.vue` consulta `cardsStore.getCardImage(suit, value)` e `getCardBackImage()`; com o fallback a garantir que as cartas continuam visíveis mesmo se estiverem em `public/`.

---

## Desenvolvimento local (como correr)
Requisitos: Node.js (versão compatível com dependências no `package.json`).

1. Instalar dependências:
   - `npm install`

2. Executar em modo desenvolvimento:
   - `npm run dev`
   - Abre o Vite dev server (normalmente em `http://localhost:5173`).

3. Build para produção:
   - `npm run build`
   - `npm run preview` (opcional, para pré-visualizar build localmente)

Scripts relevantes (ver `package.json`):
- `dev`: inicia Vite.
- `build`: cria build para produção.
- `preview`: preview do build.

---

## Build e deploy
- O `npm run build` gera a pasta `dist/` com os assets estáticos.
- Para deploy, servir `dist/` num servidor estático (Netlify, Vercel, nginx, etc.) ou integrar num backend que sirva ficheiros estáticos.
- Se existir integração com backend (API + WebSocket), é comum configurar variáveis de ambiente para URLs do backend (ex.: `VITE_API_URL`, `VITE_WS_URL`) e usá-las nos serviços que consumem a API.

---

## Integração com backend / websockets
Atualmente o frontend usa stores mock. Para integrar:
- Substituir `stores/mocks/auth.js` por um serviço que faça chamadas HTTP ao endpoint de autenticação.
- Armazenar token (se aplicável) em `localStorage` / cookies com estratégias de segurança.
- Para jogos em tempo real, usar um serviço de WebSocket:
  - Criar um módulo `services/socket.js` que faça a ligação e exponha eventos via composição API ou Pinia.
  - Atualizar as views `Game.vue`, `Spectator.vue` para consomem dados do socket (estado das mãos, mesa, ações dos jogadores).
- Atualizar `router` guards para validar token com o backend (verificar expiração, refresh token, etc).

Segurança:
- Não guardar tokens inseguros em texto simples quando houver risco (considere HttpOnly cookies).
- Validar inputs no backend; frontend é apenas camada de apresentação.

---

## Como estender / adicionar funcionalidades
- Para adicionar uma nova view:
  1. Criar componente em `src/views/`.
  2. Adicionar rota em `src/router/index.js` (decidir layout e guard).
- Para criar um novo componente UI:
  - Colocar em `src/components/` com prop typing e emits bem definidos.
  - Utilizar stores para estado global quando necessário.
- Para adicionar lógica do jogo:
  - Separar regras do jogo em módulos (p.ex. `src/game/engine.js`) que possam ser utilizados tanto no frontend (para simulações) como no backend (para autoridade).
  - Preferir uma arquitetura onde o servidor é a autoridade do jogo e o frontend é um cliente visual.

---

## Dicas de debugging e testes
- Ferramentas:
  - Console do browser + Vue Devtools (para inspecionar stores, componentes e rota).
  - Logs claros nas actions dos stores para rastrear fluxo de estado.
- Mensagens úteis:
  - Ao integrar backend, logar respostas HTTP e erros no serviço que faz fetch.
- Testes:
  - Componentes podem ser testados com `@vue/test-utils` + Jest / Vitest.
  - Testes de integração para stores e UI.

---

## Observações importantes / Convenções
- Convenção de nomes das suits: `c` (Copas), `e` (Espadas), `o` (Ouros), `p` (Paus).
- Valores válidos das cartas: `[1,2,3,4,5,6,7,11,12,13]`.
- As views `Login` e `Register` usam credenciais demo descritas na UI; são mocks para facilitar o desenvolvimento.
- Estilização centralizada via Tailwind e classes utilitárias; manter componentes responsivos.

---

## Contribuição
- Regras básicas:
  - Abrir branches por feature/bugfix: `feature/<descrição>` ou `fix/<descrição>`.
  - Escrever mensagens de commit claras.
  - Testar localmente antes de submeter PR.
- Documentar: sempre que for adicionada uma nova rota, store ou componente importante, atualizar este README com a sua finalidade e contractos (props / emits).

---

## Licença
- Verifique a raiz do projeto para informação sobre licença. Este frontend segue as mesmas regras do repositório principal.

---

Se quiser, posso:
- Gerar um checklist para integração com o backend (endpoints necessários e payloads).
- Gerar exemplos de serviço API (HTTP + WebSocket) compatível com as stores existentes.
- Criar testes unitários iniciales para `Card.vue` e `cards` store.
