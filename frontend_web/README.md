# Bisca Platform - Frontend

Uma aplicação Vue.js moderna para a plataforma de jogo de cartas Bisca online.

## 🚀 Funcionalidades

- **Autenticação**: Sistema de login/registo com stores Pinia
- **Jogos**: Interface para jogar Bisca contra bots ou outros jogadores
- **Classificações**: Sistema de leaderboards e estatísticas
- **Sistema de Moedas**: Compra e gestão de moedas virtuais
- **Tema Escuro/Claro**: Suporte completo para ambos os temas
- **Design Responsivo**: Otimizado para desktop e mobile

## 🛠 Tecnologias

- **Vue 3** com Composition API
- **Vite** como bundler
- **Pinia** para gestão de estado
- **Vue Router** para navegação
- **Tailwind CSS** para estilização
- **Responsive Design** com mobile-first approach

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd TAES2025_G3_DDV/frontend_web
```

2. **Instale as dependências**
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

4. **Aceda à aplicação**
Abra o browser em `http://localhost:3000`

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🎨 Sistema de Cores e Contraste

O projeto foi otimizado para garantir excelente contraste e acessibilidade:

### Classes de Utilidade Personalizadas

- **Texto com Contraste**:
  - `.text-contrast` - Texto principal (preto/branco)
  - `.text-contrast-secondary` - Texto secundário
  - `.text-contrast-muted` - Texto desbotado

- **Fundos com Contraste**:
  - `.bg-contrast` - Fundo principal
  - `.bg-contrast-secondary` - Fundo secundário
  - `.border-contrast` - Bordas com contraste

- **Botões**:
  - `.btn-primary` - Botão primário
  - `.btn-secondary` - Botão secundário
  - `.btn-destructive` - Botão de ação destrutiva
  - `.btn-outline` - Botão com outline

- **Componentes**:
  - `.card` - Cartões com estilo consistente
  - `.input` - Inputs com estilo melhorado
  - `.badge-*` - Badges coloridos
  - `.nav-link` - Links de navegação

## 🌙 Tema Escuro/Claro

O tema é gerido automaticamente pela store `theme`:

```javascript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// Alternar tema
themeStore.toggleTheme()

// Definir tema específico
themeStore.setTheme('dark') // ou 'light'
```

## 🏪 Stores (Pinia)

### AuthStore (`stores/auth.js`)
- Gestão de autenticação
- Dados do utilizador
- Estatísticas e moedas

### ThemeStore (`stores/theme.js`)
- Gestão do tema escuro/claro
- Persistência de preferências

### GamesStore (`stores/games.js`)
- Histórico de jogos
- Leaderboards
- Salas disponíveis

### TransactionsStore (`stores/transactions.js`)
- Histórico de transações
- Compra de moedas
- Estatísticas financeiras

## 🎮 Contas Demo

Para testar a aplicação, use as seguintes credenciais:

**Utilizador Normal:**
- Email: `user@bisca.com`
- Password: `qualquer`

**Administrador:**
- Email: `admin@bisca.com`
- Password: `qualquer`

## 📱 Páginas Disponíveis

- **/** - Página inicial
- **/login** - Autenticação
- **/register** - Registo
- **/profile** - Perfil do utilizador
- **/play** - Jogar (requer autenticação)
- **/history** - Histórico de jogos
- **/leaderboards** - Classificações
- **/coins** - Gestão de moedas
- **/admin** - Painel administrativo (apenas admin)

## 🎨 Customização de Cores

O projeto usa um sistema de variáveis CSS para cores consistentes:

```css
:root {
  --primary-600: #2563eb;
  --background: 0 0% 100%;
  --foreground: 222 84% 5%;
  /* ... mais variáveis */
}

.dark {
  --background: 222 84% 5%;
  --foreground: 210 40% 98%;
  /* ... variáveis do tema escuro */
}
```

## 📐 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Navbar.vue
│   └── Footer.vue
├── layouts/            # Layouts de página
│   ├── DefaultLayout.vue
│   └── AdminLayout.vue
├── stores/             # Stores Pinia
│   ├── auth.js
│   ├── theme.js
│   ├── games.js
│   └── transactions.js
├── views/              # Páginas da aplicação
├── router/             # Configuração de rotas
└── style.css          # Estilos globais
```

## 🔍 Melhorias de Acessibilidade

- Contraste de cores otimizado para WCAG AA
- Focus states visíveis
- Navegação por teclado
- Texto alternativo em imagens
- Estrutura semântica HTML

## 🚀 Deploy

Para fazer deploy da aplicação:

```bash
# Build para produção
npm run build

# Os ficheiros estarão na pasta dist/
```

## 📝 Notas de Desenvolvimento

- O projeto usa **Vue 3 Composition API**
- **Tailwind CSS** para estilização consistente
- **TypeScript** não está configurado (pode ser adicionado)
- **Hot Module Replacement** ativo durante desenvolvimento
- **Vite** para build rápida e eficiente

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para a sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit as suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

**Desenvolvido com ❤️ usando Vue.js e Tailwind CSS**