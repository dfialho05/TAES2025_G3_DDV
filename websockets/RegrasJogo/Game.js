// RegrasJogo/Game.js
import { Bot } from "./Bot.js";

// =================================================================
// 0. CONSTANTES E CONFIGURAÇÕES
// =================================================================
const NAIPES = ["c", "o", "p", "e"];
const RANKS = ["2", "3", "4", "5", "6", "Q", "J", "K", "7", "A"];
const VALORES = { A: 11, 7: 10, K: 4, J: 3, Q: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

export class BiscaGame {

  // [CONSTRUTOR]
  // Adicionei 'winsNeeded' (1 ou 4)
  constructor(gameType = 3, mode = "singleplayer", winsNeeded = 1) {
    this.mode = mode;
    this.gameType = gameType;
    this.winsNeeded = winsNeeded; // <--- GUARDAMOS O OBJETIVO AQUI

    this.deck = this.createDeck();
    this.trunfo = this.deck.pop();
    this.trunfoNaipe = this.trunfo.naipe;

    const handSize = gameType === 9 ? 9 : 3;
    this.player1Hand = this.deck.splice(0, handSize);
    this.player2Hand = this.deck.splice(0, handSize);

    this.matchWins = { player1: 0, player2: 0 };  

    this.tableCards = [];
    this.score = { player1: 0, player2: 0 };
    this.turn = "player1";
    this.gameOver = false;
    
    // Log inicial dinâmico
    this.logs = `Jogo iniciado! Ganha quem vencer ${this.winsNeeded} partida(s).`;

    this.botAI = new Bot("normal");

    this.startNewMatch(true);
  }

  startNewMatch(isFirst = false) {
    this.deck = this.createDeck();
    this.trunfo = this.deck.pop();
    this.trunfoNaipe = this.trunfo.naipe;

    // Usa this.gameType que foi guardado no construtor
    const handSize = this.gameType === 9 ? 9 : 3;
    
    this.player1Hand = this.deck.splice(0, handSize);
    this.player2Hand = this.deck.splice(0, handSize);

    this.tableCards = [];
    this.score = { player1: 0, player2: 0 };

    if (isFirst) {
      this.turn = "player1";
      // Log já definido no construtor
    } else {
      this.logs = `Nova Partida! Placar Geral: ${this.matchWins.player1} - ${this.matchWins.player2} (Meta: ${this.winsNeeded})`;
    }
  }

  // ... (playCard, playBotCard, resolveRound MANTÊM-SE IGUAIS) ...
  playCard(player, index) {
    if (this.gameOver || this.turn !== player) return false;
    const currentHand = player === "player1" ? this.player1Hand : this.player2Hand;
    if (index < 0 || index >= currentHand.length) return false;
    const card = currentHand[index];

    if (this.tableCards.length > 0 && this.isFinalPhase()) {
      const naipeMesa = this.tableCards[0].card.naipe;
      const temNaipe = currentHand.some((c) => c.naipe === naipeMesa);
      if (temNaipe && card.naipe !== naipeMesa) {
        this.logs = `⚠️ Regra: Tens de jogar naipe de ${naipeMesa}!`;
        return false;
      }
    }
    currentHand.splice(index, 1);
    this.tableCards.push({ card, player });
    this.turn = player === "player1" ? "player2" : "player1";
    this.logs = `Player ${player === "player1" ? "1" : "2"} jogou ${card.rank}-${card.naipe}`;
    return true;
  }

  playBotCard() {
    if (this.player2Hand.length === 0) return;
    const trunfoData = this.trunfo || { naipe: this.trunfoNaipe, value: 0 };
    const mustFollow = this.isFinalPhase();
    const index = this.botAI.makeMove(this.player2Hand, this.tableCards, trunfoData, mustFollow);
    this.playCard("player2", index);
  }

  resolveRound() {
    if (this.tableCards.length < 2) return null;
    const [move1, move2] = this.tableCards;
    const c1 = move1.card;
    const c2 = move2.card;
    let winner = "";
    if (c2.naipe === c1.naipe) {
      if (c2.value > c1.value) winner = move2.player;
      else if (c1.value > c2.value) winner = move1.player;
      else winner = RANKS.indexOf(c2.rank) > RANKS.indexOf(c1.rank) ? move2.player : move1.player;
    } else {
      winner = c2.naipe === this.trunfoNaipe ? move2.player : move1.player;
    }
    const points = c1.value + c2.value;
    this.score[winner] += points;
    this.logs = `Vencedor da vaza: ${winner} (+${points} pts)`;
    this.drawCards(winner);
    return winner;
  }

  cleanupRound(winner) {
    this.tableCards = [];

    // Fim da Partida (Match)
    if (this.player1Hand.length === 0 && this.player2Hand.length === 0) {
      const s1 = this.score.player1;
      const s2 = this.score.player2;
      let matchWinner = null;
      let marksToAdd = 0;
      let winType = ""; // Para o log (Risca, Capote, Bandeira)

      // 1. Determinar quem ganhou
      if (s1 > s2) matchWinner = "player1";
      else if (s2 > s1) matchWinner = "player2";

      if (matchWinner) {
        const winningScore = matchWinner === "player1" ? s1 : s2;

        // 2. Calcular Marcas (Marks)
        if (winningScore === 120) {
            // Bandeira: Ganha imediatamente o jogo (dá o valor máximo necessário)
            marksToAdd = this.winsNeeded; 
            winType = "BANDEIRA (120 pts)!";
        } 
        else if (winningScore >= 91) {
            marksToAdd = 2; // Capote
            winType = "CAPOTE (+2)";
        } 
        else {
            marksToAdd = 1; // Risca normal
            winType = "RISCA (+1)";
        }

        // 3. Atualizar Placar Geral
        this.matchWins[matchWinner] += marksToAdd;

        const winnerName = this[matchWinner] ? this[matchWinner].name : (matchWinner === "player1" ? "Player 1" : "Bot");

        // 4. Verificar se Ganhou o Jogo (Sessão)
        if (this.matchWins[matchWinner] >= this.winsNeeded) {
          this.gameOver = true;
          this.turn = null;
          this.logs = `🏆 FIM DE JOGO! ${winnerName} fez ${winType} e venceu o campeonato!`;
          return; 
        }

        this.logs = `${winnerName} ganhou: ${winType}. Placar Geral: ${this.matchWins.player1} - ${this.matchWins.player2}`;
      } else {
        this.logs = "Empate (60-60)! Ninguém pontua.";
      }

      this.startNewMatch();
      this.turn = winner;
    } else {
      this.turn = winner;
    }
  }

  // ... (createDeck, isFinalPhase, drawCards, getState MANTÊM-SE IGUAIS) ...
  createDeck() {
    let deck = [];
    for (let naipe of NAIPES) {
      for (let rank of RANKS) {
        deck.push({ rank, naipe, value: VALORES[rank], id: `${rank}-${naipe}`, color: naipe === "c" || naipe === "o" ? "red" : "black" });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }
  isFinalPhase() { return this.deck.length === 0 && this.trunfo === null; }
  drawCards(winner) {
    if (this.deck.length === 0 && !this.trunfo) return;
    const pull = () => { if (this.deck.length > 0) return this.deck.pop(); if (this.trunfo) { const t = this.trunfo; this.trunfo = null; return t; } return null; };
    const card1 = pull(); const card2 = pull();
    if (winner === "player1") { if (card1) this.player1Hand.push(card1); if (card2) this.player2Hand.push(card2); } 
    else { if (card1) this.player2Hand.push(card1); if (card2) this.player1Hand.push(card2); }
  }
  getState() {
    let p2Name = "Bot";
    if (this.mode === "multiplayer" && !this.player2) { p2Name = null; } 
    else if (this.player2) { p2Name = this.player2.name; }

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
      playerHand: this.player1Hand,
      botCardCount: this.player2Hand.length,
    };
  }
}