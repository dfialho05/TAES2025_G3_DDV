// Constantes do Jogo
import { Bot } from "./Bot.js";

const NAIPES = ['♥', '♦', '♣', '♠'];
const RANKS = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
const VALORES = { 'A': 11, '7': 10, 'K': 4, 'J': 3, 'Q': 2, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };

export class BiscaGame {
  constructor() {
    this.deck = this.createDeck();
    this.trunfo = this.deck.pop();
    this.trunfoNaipe = this.trunfo.naipe; 
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

    // --- CORREÇÃO ANTI-CRASH DO BOT ---
    // Se trunfo for null (já pescado), passamos um objeto falso apenas com o naipe
    const trunfoInfo = this.trunfo ? this.trunfo : { naipe: this.trunfoNaipe, value: 0, rank: '' };

    const selectedIndex = this.botAI.makeMove(this.botHand, this.tableCards, trunfoInfo);

    const card = this.botHand.splice(selectedIndex, 1)[0];
    
    this.tableCards.push({ card, player: 'bot' });

    this.turn = 'user';
    this.logs = "Sua vez...";
  }

resolveRound() {
    // Verificar se ambos jogaram (segurança)
    if (this.tableCards.length < 2) return null;

    // Identificar as cartas jogadas
    // A primeira carta jogada (base) define o naipe a assistir
    const firstMove = this.tableCards[0];
    const secondMove = this.tableCards[1];
    
    const c1 = firstMove.card;
    const c2 = secondMove.card;
    
    // --- CORREÇÃO: Usar a string guardada no construtor ---
    const trunfoNaipe = this.trunfoNaipe; 
    let winnerPlayer = '';

    if (c2.naipe === c1.naipe) {
        // Mesmo naipe: ganha o maior valor ou rank
        if (c2.value > c1.value) winnerPlayer = secondMove.player;
        else if (c1.value > c2.value) winnerPlayer = firstMove.player;
        else {
             // Desempate por rank (ex: 6 ganha a 5)
             const r1 = RANKS.indexOf(c1.rank);
             const r2 = RANKS.indexOf(c2.rank);
             winnerPlayer = r2 > r1 ? secondMove.player : firstMove.player;
        }
    } else {
        // Naipes diferentes. O segundo cortou com trunfo?
        if (c2.naipe === trunfoNaipe) {
            winnerPlayer = secondMove.player;
        } else {
            // Se não cortou, ganha quem jogou primeiro
            winnerPlayer = firstMove.player;
        }
    }

    const points = c1.value + c2.value;
    this.score[winnerPlayer] += points;
    this.logs = winnerPlayer === 'user' ? `Ganhaste a vaza! (+${points} pts)` : `Bot ganhou a vaza.`;

    // --- PESCAR CARTAS ---
    this.drawCards(winnerPlayer);

    return winnerPlayer;
  }

  // --- NOVA FUNÇÃO DE PESCAR ---
  drawCards(winner) {
    // Se já não há deck nem trunfo, ninguém pesca
    if (this.deck.length === 0 && !this.trunfo) return;

    // Função auxiliar para tirar a próxima carta disponível
    const pullCard = () => {
        if (this.deck.length > 0) {
            return this.deck.pop(); // Tira do baralho normal
        } else if (this.trunfo) {
            // Se o baralho acabou, a última carta é o trunfo
            const finalCard = this.trunfo;
            this.trunfo = null; // O trunfo sai da mesa e vai para a mão de alguém
            return finalCard;
        }
        return null;
    };
    // 1. O Vencedor pesca primeiro
    const winnerCard = pullCard();
    
    // 2. O Perdedor pesca depois
    const loserCard = pullCard();

    // Adiciona às mãos corretas
    if (winner === 'user') {
        if (winnerCard) this.playerHand.push(winnerCard);
        if (loserCard) this.botHand.push(loserCard);
    } else {
        if (winnerCard) this.botHand.push(winnerCard);
        if (loserCard) this.playerHand.push(loserCard);
    }
  }

 cleanupRound(winner) {
    this.tableCards = [];
    
    // Verifica se ambos estão sem cartas
    if (this.playerHand.length === 0 && this.botHand.length === 0) {
      this.gameOver = true;
      const result = this.score.user > this.score.bot ? "GANHASTE O JOGO!" : "PERDESTE!";
      this.logs = `Fim. ${result}`;
      this.turn = null;
    } else {
      // --- LÓGICA DE QUEM MANDA NA MESA ---
      // O vencedor da vaza anterior joga primeiro na próxima
      this.turn = winner; 
      
      if (winner === 'user') {
        this.logs += " Sua vez de jogar.";
      } else {
        this.logs += " Vez do Bot jogar.";
      }
    }
  }

  // Formata os dados para enviar ao frontend
  getState() {
    return {
      playerHand: this.playerHand,
      botHand: this.botHand, // Mantemos o botHand aqui para o debug que pediste
      botCardCount: this.botHand.length,
      trunfo: this.trunfo,
      trunfoNaipe: this.trunfoNaipe,
      tableCards: this.tableCards,
      score: this.score,
      turn: this.turn,
      logs: this.logs,
      gameOver: this.gameOver,
      cardsLeft: this.deck.length
    };
  }
}