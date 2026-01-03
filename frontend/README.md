# Frontend - Bisca Game

Aplicação Vue 3 com Pinia, Socket.io e sistema completo de recuperação de estado e resiliência WebSocket.

## Sistema de Recuperação de Estado

Este projeto implementa um sistema robusto de recuperação que permite aos utilizadores continuar os seus jogos sem perder progresso após:

- 🔄 Recarregamento de página (F5)
- 📡 Perda temporária de conexão
- ⏱️ Reconexões automáticas
- 🚨 Tratamento de timeouts do servidor

### Documentação Completa

- **[QUICK_START.md](QUICK_START.md)** - Começar em 5 minutos
- **[RECOVERY_SYSTEM.md](RECOVERY_SYSTEM.md)** - Documentação técnica completa
- **[BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md)** - Requisitos do backend
- **[USAGE_GUIDE.md](USAGE_GUIDE.md)** - Exemplos práticos de uso
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Sumário da implementação
- **[CHECKLIST.md](CHECKLIST.md)** - Checklist de verificação

### Recursos Principais

✅ Persistência automática de estado (localStorage)  
✅ Recuperação automática após reload  
✅ Reconexão resiliente (até 10 tentativas)  
✅ Feedback visual contínuo (ConnectionStatus)  
✅ Tratamento de jogos anulados (Modal informativo)  
✅ Refresh automático de tokens expirados  
✅ Código limpo, profissional, sem emojis  
✅ Composition API exclusivamente  

### Arquivos Principais

```
src/
├── components/game/
│   ├── ConnectionStatus.vue      ← Banner de status
│   └── GameAnnulledModal.vue     ← Modal de anulação
├── composables/
│   └── useGameRecovery.js        ← Lógica de recuperação
├── stores/
│   ├── biscaStore.js             ← Estado do jogo + persistência
│   ├── socketStore.js            ← WebSocket + reconexão
│   └── auth.js                   ← Autenticação + refresh
```

### Início Rápido

```bash
# 1. Instalar dependências
npm install

# 2. Executar em desenvolvimento
npm run dev

# 3. Testar recuperação
# - Iniciar jogo
# - Pressionar F5
# - Verificar que jogo continua
```

### Requisitos Backend

O frontend está completo mas requer que o backend implemente:

- Endpoint `POST /api/token` para refresh de tokens
- Eventos WebSocket: `game_annulled`, `game_timeout`
- Redis com TTL de 5 minutos para estado do jogo
- Lógica de devolução de moedas ao anular

📖 Detalhes completos em [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md)

---

## Configuração Original Vue 3

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Tecnologias

- **Vue 3** - Framework progressivo
- **Pinia** - State management
- **Socket.io-client** - WebSocket real-time
- **Vue Router** - Roteamento
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── composables/     # Lógica compartilhada
│   ├── pages/           # Páginas da aplicação
│   ├── stores/          # Pinia stores
│   ├── router/          # Configuração de rotas
│   └── utils/           # Funções utilitárias
├── public/              # Assets estáticos
└── docs/                # Documentação adicional

```

## Troubleshooting

### Jogo não recupera após F5

**Solução**: Verificar se passou menos de 5 minutos e se o servidor está a correr.

### Banner de conexão não desaparece

**Solução**: Verificar servidor WebSocket em `http://localhost:3000`

### Modal de anulação não fecha

**Solução**: Pressionar ESC ou clicar no botão "Entendido"

## Suporte

- 📖 Documentação completa em `RECOVERY_SYSTEM.md`
- 🐛 Reportar bugs via GitHub Issues
- 💬 Dúvidas: Ver `USAGE_GUIDE.md`

---

**Status**: ✅ Frontend completo (aguarda implementação backend)  
**Versão**: 1.0.0  
**Última Atualização**: 2024
```

