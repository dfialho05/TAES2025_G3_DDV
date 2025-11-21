// Constantes do Jogo
import { Bot } from "./Bot.js";

const NAIPES = ['♥', '♦', '♣', '♠'];
const RANKS = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
const VALORES = { 'A': 11, '7': 10, 'K': 4, 'J': 3, 'Q': 2, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };

export class BiscaGame {
  constructor() {
    this.deck = this.createDeck();
    this.trunfo = this.deck.pop();
    this.botAI = new Bot('normal');
    this.playerHand = this.deck.splice(0, 9);
    this.botHand = this.deck.splice(0, 9);
    this.tableCards = [];
    this.score = { user: 0, bot: 0 };
    this.turn = 'user';
    this.logs = "Jogo iniciado! Trunfo: " + this.trunfo.rank + this.trunfo.naipe;
    this.gameOver = false;
  }

  createDeck() {
    let deck = [];
    for (let naipe of NAIPES) {
      for (let rank of RANKS) {
        deck.push({
          rank,
          naipe,
          value: VALORES[rank],
          id: `${rank}-${naipe}`,
          color: (naipe === '♥' || naipe === '♦') ? 'red' : 'black'
        });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  playUserCard(index) {
    if (this.gameOver || this.turn !== 'user') return false;
    if (index < 0 || index >= this.playerHand.length) return false;

    const card = this.playerHand.splice(index, 1)[0];
    this.tableCards.push({ card, player: 'user' });
    this.turn = 'bot';
    this.logs = "Bot a pensar...";
    return true;
  }

  playBotCard() {
    if (this.botHand.length === 0) return;

    // --- NOVA LÓGICA: PERGUNTA AO BOT O QUE JOGAR ---
    const selectedIndex = this.botAI.makeMove(this.botHand, this.tableCards, this.trunfo);

    const card = this.botHand.splice(selectedIndex, 1)[0];
    this.tableCards.push({ card, player: 'bot' });
  }

  resolveRound() {
    const userMove = this.tableCards.find(c => c.player === 'user');
    const botMove = this.tableCards.find(c => c.player === 'bot');

    if (!userMove || !botMove) return;

    const c1 = userMove.card;
    const c2 = botMove.card;
    const trunfoNaipe = this.trunfo.naipe;
    let winner = '';

    if (c1.naipe === c2.naipe) {
      if (c1.value > c2.value) winner = 'user';
      else if (c2.value > c1.value) winner = 'bot';
      else winner = RANKS.indexOf(c1.rank) > RANKS.indexOf(c2.rank) ? 'user' : 'bot';
    } else {
      if (c2.naipe === trunfoNaipe) winner = 'bot';
      else winner = 'user';
    }

    const points = c1.value + c2.value;
    this.score[winner] += points;
    this.logs = winner === 'user' ? `Ganhaste a vaza! (+${points} pts)` : `Bot ganhou a vaza.`;

    return winner;
  }

  cleanupRound(winner) {
    this.tableCards = [];
    if (this.playerHand.length === 0) {
      this.gameOver = true;
      const result = this.score.user > this.score.bot ? "GANHASTE O JOGO!" : "PERDESTE!";
      this.logs = `Fim. ${result}`;
      this.turn = null;
    } else {
      this.turn = 'user'; // Simplificação: user joga sempre primeiro na próxima
      this.logs += " Sua vez.";
    }
  }

  // Formata os dados para enviar ao frontend
  getState() {
    return {
      playerHand: this.playerHand,
      botHand: this.botHand, // Mantemos o botHand aqui para o debug que pediste
      botCardCount: this.botHand.length,
      trunfo: this.trunfo,
      tableCards: this.tableCards,
      score: this.score,
      turn: this.turn,
      logs: this.logs,
      gameOver: this.gameOver
    };
  }
}