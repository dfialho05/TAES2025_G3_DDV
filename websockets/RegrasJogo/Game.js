// RegrasJogo/Game.js
import { Bot } from "./Bot.js";

// =================================================================
// 0. CONSTANTES E CONFIGURAÇÕES
// =================================================================
const NAIPES = ["c", "o", "p", "e"]; // Copas, Ouros, Paus, Espadas
const RANKS = ["2", "3", "4", "5", "6", "Q", "J", "K", "7", "A"];
const VALORES = {
  A: 11,
  7: 10,
  K: 4,
  J: 3,
  Q: 2,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
};
const WINS_NEEDED = 4; // Número de vitórias necessárias para ganhar o jogo

export class BiscaGame {
  // [CONSTRUTOR]
  // Inicializa um novo jogo.
  // 1. Cria e baralha o deck.
  // 2. Define o trunfo.
  // 3. Distribui as mãos iniciais.
  // 4. Inicializa o estado (pontos, turno, log).
  constructor(gameType = 3, mode = "singleplayer") {
    this.mode = mode;
    this.gameType = gameType;

    
    this.deck = this.createDeck();
    this.trunfo = this.deck.pop();
    this.trunfoNaipe = this.trunfo.naipe;

    const handSize = gameType === 9 ? 9 : 3;
    this.player1Hand = this.deck.splice(0, handSize);
    this.player2Hand = this.deck.splice(0, handSize);

    this.matchWins = { player1: 0, player2: 0 };  

    this.tableCards = [];
    this.score = {
       player1: 0, player2: 0 
      };
    this.turn = "player1";
    this.gameOver = false;
    this.logs = `Jogo iniciado (${handSize} cartas)!`;

    this.botAI = new Bot("normal");

    this.startNewMatch(true);
  }

  startNewMatch(isFirst = false) {
    this.deck = this.createDeck();
    this.trunfo = this.deck.pop();
    this.trunfoNaipe = this.trunfo.naipe;

    const handSize = this.gameType === 9 ? 9 : 3;
    this.player1Hand = this.deck.splice(0, handSize);
    this.player2Hand = this.deck.splice(0, handSize);

    // Zera os pontos da partida (as cartas na mesa), mas NÃO o placar geral
    this.tableCards = [];
    this.score = { player1: 0, player2: 0 };

    if (isFirst) {
      this.turn = "player1";
      this.logs = `Jogo iniciado! O primeiro a chegar a ${WINS_NEEDED} vitórias ganha.`;
    } else {
      // Mostra o placar atual no log
      this.logs = `Nova Partida! Placar Geral: ${this.matchWins.player1} - ${this.matchWins.player2}`;
    }
  }

  // =================================================================
  // 1. LÓGICA DE JOGADA
  // =================================================================

  // [FUNÇÃO: playCard]
  // Executa a jogada de um humano ou bot.
  // 1. Valida se é o turno correto.
  // 2. Valida se a carta existe na mão.
  // 3. Valida regras de naipe obrigatório (apenas na fase final).
  // 4. Move a carta da mão para a mesa.
  // 5. Passa o turno.
  playCard(player, index) {
    if (this.gameOver || this.turn !== player) return false;

    const currentHand =
      player === "player1" ? this.player1Hand : this.player2Hand;

    if (index < 0 || index >= currentHand.length) return false;
    const card = currentHand[index];

    // Regra de Assistir ao Naipe (Fase Final: Baralho vazio)
    if (this.tableCards.length > 0 && this.isFinalPhase()) {
      const naipeMesa = this.tableCards[0].card.naipe;
      const temNaipe = currentHand.some((c) => c.naipe === naipeMesa);

      if (temNaipe && card.naipe !== naipeMesa) {
        this.logs = `⚠️ Regra: Tens de jogar naipe de ${naipeMesa}!`;
        return false;
      }
    }

    currentHand.splice(index, 1); // Remove da mão
    this.tableCards.push({ card, player }); // Põe na mesa

    this.turn = player === "player1" ? "player2" : "player1";
    this.logs = `Player ${player === "player1" ? "1" : "2"} jogou ${
      card.rank
    }-${card.naipe}`;

    return true;
  }

  // [FUNÇÃO: playBotCard]
  // Apenas usada no Singleplayer.
  // Pede ao BotAI para escolher a melhor carta e executa playCard.
  playBotCard() {
    if (this.player2Hand.length === 0) return;

    const trunfoData = this.trunfo || { naipe: this.trunfoNaipe, value: 0 };
    const mustFollow = this.isFinalPhase();

    const index = this.botAI.makeMove(
      this.player2Hand,
      this.tableCards,
      trunfoData,
      mustFollow
    );

    this.playCard("player2", index);
  }

  // =================================================================
  // 2. RESOLUÇÃO DE RONDAS
  // =================================================================

  // [FUNÇÃO: resolveRound]
  // Chamada quando há 2 cartas na mesa.
  // 1. Compara as cartas para ver quem ganhou.
  // 2. Adiciona os pontos ao vencedor.
  // 3. Pesca novas cartas (drawCards).
  // 4. Retorna o vencedor ('player1' ou 'player2').
  resolveRound() {
    if (this.tableCards.length < 2) return null;

    const [move1, move2] = this.tableCards;
    const c1 = move1.card;
    const c2 = move2.card;

    let winner = "";

    if (c2.naipe === c1.naipe) {
      // Mesmo naipe: ganha maior valor ou rank
      if (c2.value > c1.value) winner = move2.player;
      else if (c1.value > c2.value) winner = move1.player;
      else
        winner =
          RANKS.indexOf(c2.rank) > RANKS.indexOf(c1.rank)
            ? move2.player
            : move1.player;
    } else {
      // Naipes diferentes: ganha quem cortou (trunfo), senão ganha o primeiro
      winner = c2.naipe === this.trunfoNaipe ? move2.player : move1.player;
    }

    const points = c1.value + c2.value;
    this.score[winner] += points;
    this.logs = `Vencedor da vaza: ${winner} (+${points} pts)`;

    this.drawCards(winner);

    return winner;
  }

  // [FUNÇÃO: cleanupRound]
  // Chamada após a resolução e a pausa dramática.
  // 1. Limpa a mesa.
  // 2. Verifica se o jogo acabou (Mãos vazias).
  // 3. Define quem joga a seguir (o vencedor da vaza).
  cleanupRound(winner) {
    this.tableCards = [];

    // Se as mãos acabaram -> Fim da Partida (Match)
    if (this.player1Hand.length === 0 && this.player2Hand.length === 0) {
      const s1 = this.score.player1;
      const s2 = this.score.player2;
      let matchWinner = null;

      if (s1 > s2) matchWinner = "player1";
      else if (s2 > s1) matchWinner = "player2";

      if (matchWinner) {
        // 1. Incrementa a vitória no placar geral
        this.matchWins[matchWinner]++;

        const winnerName = this[matchWinner]
          ? this[matchWinner].name
          : matchWinner === "player1"
          ? "Player 1"
          : "Bot";

        // 2. Verifica se chegou à meta (4 vitórias)
        if (this.matchWins[matchWinner] >= WINS_NEEDED) {
          this.gameOver = true;
          this.turn = null;
          this.logs = `🏆 FIM DE JOGO! ${winnerName} venceu por ${this.matchWins.player1}-${this.matchWins.player2}!`;
          return; // Fim da Sessão
        }

        this.logs = `${winnerName} venceu a partida! Placar: ${this.matchWins.player1} - ${this.matchWins.player2}`;
      } else {
        this.logs = "Empate (60-60)! Ninguém pontua no geral.";
      }

      // 3. Reinicia para a próxima partida
      this.startNewMatch();
      this.turn = winner;
    } else {
      // A partida continua
      this.turn = winner;
    }
  }

  // =================================================================
  // 3. AUXILIARES
  // =================================================================

  createDeck() {
    let deck = [];
    for (let naipe of NAIPES) {
      for (let rank of RANKS) {
        deck.push({
          rank,
          naipe,
          value: VALORES[rank],
          id: `${rank}-${naipe}`,
          color: naipe === "c" || naipe === "o" ? "red" : "black",
        });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  isFinalPhase() {
    return this.deck.length === 0 && this.trunfo === null;
  }

  // [FUNÇÃO: drawCards]
  // Distribui cartas do topo do baralho.
  // IMPORTANTE: O vencedor da vaza pesca primeiro.
  // Se o baralho acabar, pesca-se o trunfo.
  drawCards(winner) {
    if (this.deck.length === 0 && !this.trunfo) return;

    const pull = () => {
      if (this.deck.length > 0) return this.deck.pop();
      if (this.trunfo) {
        const t = this.trunfo;
        this.trunfo = null;
        return t;
      }
      return null;
    };

    const card1 = pull();
    const card2 = pull();

    if (winner === "player1") {
      if (card1) this.player1Hand.push(card1);
      if (card2) this.player2Hand.push(card2);
    } else {
      if (card1) this.player2Hand.push(card1); // Winner (p2)
      if (card2) this.player1Hand.push(card2); // Loser (p1)
    }
  }

  // [FUNÇÃO: getState]
  // Prepara o objeto "limpo" para enviar ao Frontend.
  // Nota: Em produção, podias ocultar a mão do oponente aqui,
  // mas como enviamos para os dois, enviamos tudo e o Frontend filtra.
  getState() {
    let p2Name = "Bot";
    if (this.mode === "multiplayer" && !this.player2) {
      p2Name = null;
    } else if (this.player2) {
      p2Name = this.player2.name;
    }

    return {
      id: this.id,
      player1Hand: this.player1Hand,
      player2Hand: this.player2Hand,

      score: this.score,
      turn: this.turn,

      tableCards: this.tableCards,
      trunfo: this.trunfo,
      trunfoNaipe: this.trunfoNaipe,
      cardsLeft: this.deck.length,
      gameOver: this.gameOver,
      logs: this.logs,

      p1Name: this.player1 ? this.player1.name : "Player 1",
      p2Name: p2Name,

      matchWins: this.matchWins,

      // Legacy (Compatibilidade)
      playerHand: this.player1Hand,
      botCardCount: this.player2Hand.length,
    };
  }
}
