// server.js (ou o teu ficheiro de entrada de websockets)
import { Server } from "socket.io";


// Configura o Socket.IO (ajusta a porta se necessário, aqui uso 3000)
const io = new Server(3000, {
  cors: {
    origin: "*", // Permite conexões do teu Vue
    methods: ["GET", "POST"]
  }
});

// --- LÓGICA DE JOGO (FUNÇÕES AUXILIARES) ---
const NAIPES = ['♥', '♦', '♣', '♠'];
const RANKS = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
const VALORES = { 'A': 11, '7': 10, 'K': 4, 'J': 3, 'Q': 2, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };

const createDeck = () => {
  let deck = [];
  for (let naipe of NAIPES) {
    for (let rank of RANKS) {
      deck.push({
        rank,
        naipe,
        value: VALORES[rank],
        id: `${rank}-${naipe}`,
        // Frontend decide a cor, mas podemos mandar daqui
        color: (naipe === '♥' || naipe === '♦') ? 'red' : 'black'
      });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

// Estado global dos jogos (chave = socket.id)
const games = {};

io.on("connection", (socket) => {
  console.log(`Jogador conectado: ${socket.id}`);

  // 1. INICIAR JOGO
  socket.on("join_game", () => {
    const deck = createDeck();
    const trunfo = deck.pop(); // Última carta é o trunfo

    // Distribui 9 cartas (Bisca de 9)
    const playerHand = deck.splice(0, 9);
    const botHand = deck.splice(0, 9);

    games[socket.id] = {
      deck, // Resto do baralho (se houver pesca)
      playerHand,
      botHand,
      trunfo,
      tableCards: [], // Cartas na mesa
      score: { user: 0, bot: 0 },
      turn: 'user', // User começa
      logs: "Jogo iniciado! Trunfo: " + trunfo.rank + trunfo.naipe,
      gameOver: false
    };

    emitGameState(socket);
  });

  // 2. JOGADA DO USUÁRIO
  socket.on("play_card", (cardIndex) => {
    const game = games[socket.id];
    
    // Validações de segurança
    if (!game || game.gameOver || game.turn !== 'user') return;
    if (cardIndex < 0 || cardIndex >= game.playerHand.length) return;

    // Executa jogada
    const playedCard = game.playerHand.splice(cardIndex, 1)[0];
    game.tableCards.push({ card: playedCard, player: 'user' });
    game.turn = 'bot';
    game.logs = "Bot a pensar...";
    
    emitGameState(socket);

    // 3. BOT RESPONDE (com delay simulado)
    setTimeout(() => {
      if (!games[socket.id]) return; // Se o jogador saiu entretanto
      
      botPlay(socket, game);
    }, 1000);
  });

  socket.on("disconnect", () => {
    console.log(`Jogador saiu: ${socket.id}`);
    delete games[socket.id];
  });
});

// --- LÓGICA DO BOT E RESOLUÇÃO ---
function botPlay(socket, game) {
  if (game.botHand.length === 0) return;

  // IA Simples: Joga carta aleatória
  // (Aqui podes melhorar a IA futuramente)
  const randomIndex = Math.floor(Math.random() * game.botHand.length);
  const botCard = game.botHand.splice(randomIndex, 1)[0];

  game.tableCards.push({ card: botCard, player: 'bot' });

  // Resolver quem ganhou a vaza
  resolveRound(socket, game);
}

function resolveRound(socket, game) {
  const userMove = game.tableCards.find(c => c.player === 'user');
  const botMove = game.tableCards.find(c => c.player === 'bot');

  if (!userMove || !botMove) return;

  const c1 = userMove.card;
  const c2 = botMove.card;
  const trunfoNaipe = game.trunfo.naipe;
  let winner = '';

  // Regras da Bisca para determinar vencedor
  if (c1.naipe === c2.naipe) {
    // Mesmo naipe: ganha valor maior, ou rank maior
    if (c1.value > c2.value) winner = 'user';
    else if (c2.value > c1.value) winner = 'bot';
    else winner = RANKS.indexOf(c1.rank) > RANKS.indexOf(c2.rank) ? 'user' : 'bot';
  } else {
    // Naipes diferentes: ganha quem trunfou, ou quem jogou primeiro (user)
    if (c2.naipe === trunfoNaipe) winner = 'bot';
    else winner = 'user';
  }

  // Somar pontos
  const points = c1.value + c2.value;
  game.score[winner] += points;
  game.logs = winner === 'user' ? `Ganhaste a vaza! (+${points} pts)` : `Bot ganhou a vaza.`;

  emitGameState(socket);

  // Limpar mesa e preparar próxima rodada
  setTimeout(() => {
    if (!games[socket.id]) return;
    
    game.tableCards = [];
    
    // Verificar fim de jogo
    if (game.playerHand.length === 0) {
      game.gameOver = true;
      const finalMsg = game.score.user > game.score.bot ? "GANHASTE O JOGO!" : "PERDESTE!";
      game.logs = `Fim. ${finalMsg}`;
      game.turn = null;
    } else {
      game.turn = 'user'; // Simplificação: User joga sempre primeiro na próxima (podes mudar para winner)
      game.logs += " Sua vez.";
    }
    emitGameState(socket);
  }, 1500);
}

// Envia apenas o necessário para o Frontend
function emitGameState(socket) {
  const game = games[socket.id];
  if (!game) return;

  socket.emit("game_state", {
    playerHand: game.playerHand,
    botCardCount: game.botHand.length,
    botHand: game.botHand, // SEGURANÇA: Não envia as cartas do bot, só o número
    trunfo: game.trunfo,
    tableCards: game.tableCards,
    score: game.score,
    turn: game.turn,
    logs: game.logs,
    gameOver: game.gameOver
  });
}

console.log("Servidor de Bisca a correr na porta 3000...");