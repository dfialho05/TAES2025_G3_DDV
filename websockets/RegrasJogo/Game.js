import { Bot } from "./Bot.js";

const NAIPES = ["c", "o", "p", "e"];
const RANKS = ["2", "3", "4", "5", "6", "Q", "J", "K", "7", "A"];
const VALORES = { A: 11, 7: 10, K: 4, J: 3, Q: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

export class BiscaGame {
  constructor(gameType = 3, mode = "singleplayer", winsNeeded = 1, callbacks = {}) {
    this.mode = mode;
    this.gameType = gameType;
    this.winsNeeded = winsNeeded;
    this.callbacks = callbacks; 

    this.dbMatchId = null;
    this.dbCurrentGameId = null;

    this.deck = this.createDeck();
    this.player1Hand = [];
    this.player2Hand = [];
    
    this.matchWins = { player1: 0, player2: 0 };  
    this.matchTotalPoints = { player1: 0, player2: 0 }; 

    this.tableCards = [];
    this.score = { player1: 0, player2: 0 };
    this.lastRoundPoints = { player1: 0, player2: 0 }; 

    this.turn = "player1";
    this.gameOver = false;
    this.roundOver = false; 
    this.logs = `A aguardar início...`;
    this.botAI = new Bot("normal");

    if (Object.keys(callbacks).length === 0) {
        this.startNewMatch(true);
    }
  }

  confirmNextRound() {
      this.roundOver = false;
  }

  async startNewMatch(isFirst = false) {
    this.deck = this.createDeck();
    this.trunfo = this.deck.pop();
    this.trunfoNaipe = this.trunfo.naipe;
    const handSize = this.gameType === 9 ? 9 : 3;
    this.player1Hand = this.deck.splice(0, handSize);
    this.player2Hand = this.deck.splice(0, handSize);
    this.tableCards = [];
    
    this.score = { player1: 0, player2: 0 };
    this.roundOver = false; 

    if (isFirst) {
        this.turn = "player1";
        this.logs = `Jogo iniciado! Ganha quem vencer ${this.winsNeeded} partida(s).`;
    } else {
        this.logs = `Nova Ronda! Placar: ${this.matchWins.player1}-${this.matchWins.player2}`;
    }

    if (this.callbacks.onGameStart) {
        this.dbCurrentGameId = await this.callbacks.onGameStart();
    }
  }

  playCard(player, index) {
    if (this.gameOver || this.roundOver || this.turn !== player) return false;
    
    const currentHand = player === "player1" ? this.player1Hand : this.player2Hand;
    if (index < 0 || index >= currentHand.length) return false;
    const card = currentHand[index];

    if (this.tableCards.length > 0 && this.isFinalPhase()) {
      const naipeMesa = this.tableCards[0].card.naipe;
      const temNaipe = currentHand.some((c) => c.naipe === naipeMesa);
      if (temNaipe && card.naipe !== naipeMesa) {
        this.logs = `⚠️ Regra: Naipe obrigatório ${naipeMesa}!`;
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

  // =========================================================
  //  MÉTODO DE TIMEOUT / DESISTÊNCIA
  // =========================================================
  async resolveTimeout(loserSide) {
    if (this.gameOver) return;

    const winnerSide = loserSide === 'player1' ? 'player2' : 'player1';
    
    let winnerName = "Player 1";
    if (winnerSide === "player2") {
        winnerName = this.player2 ? this.player2.name : "Bot";
    } else if (this.player1) {
        winnerName = this.player1.name;
    }

    console.log(`⏰ [Game Logic] Tempo/Desistência de ${loserSide}. Vitória para ${winnerSide}.`);

    // 1. Recolher TODAS as cartas
    let allCards = [
        ...this.deck,
        ...this.player1Hand,
        ...this.player2Hand,
        ...this.tableCards.map(move => move.card)
    ];

    if (this.trunfo) {
        allCards.push(this.trunfo);
    }

    // 2. Calcular pontos
    let pointsToAdd = 0;
    allCards.forEach(card => {
        pointsToAdd += (card.value || 0);
    });

    // 3. Atribuir pontos ao vencedor
    this.score[winnerSide] += pointsToAdd;
    
    // Atualizar explicitamente lastRoundPoints para o Frontend mostrar o placar correto (ex: 120-0)
    this.lastRoundPoints = { 
        player1: Number(this.score.player1), 
        player2: Number(this.score.player2) 
    };

    this.logs = `⏰ Jogo Terminado! ${winnerName} venceu por desistência ou tempo.`;

    // 4. Limpar estado visual
    this.deck = [];
    this.player1Hand = [];
    this.player2Hand = [];
    this.tableCards = [];
    this.trunfo = null;

    // 5. Forçar Fim de Jogo e Vitória na Match
    this.matchWins[winnerSide] = this.winsNeeded; 
    
    this.gameOver = true;
    this.roundOver = true; 
    
    this.matchTotalPoints.player1 += this.score.player1;
    this.matchTotalPoints.player2 += this.score.player2;

    // 6. Callbacks da BD
    if (this.callbacks.onGameEnd && this.dbCurrentGameId) {
        await this.callbacks.onGameEnd(this.dbCurrentGameId, winnerSide, this.score.player1, this.score.player2);
    }
    if (this.callbacks.onMatchEnd) {
        await this.callbacks.onMatchEnd(
            winnerSide, 
            this.matchWins.player1, 
            this.matchWins.player2, 
            this.matchTotalPoints.player1, 
            this.matchTotalPoints.player2
        );
    }

    return true;
  }

  async cleanupRound(winner) {
    this.tableCards = [];

    if (this.player1Hand.length === 0 && this.player2Hand.length === 0) {
      
      const s1 = this.score.player1; 
      const s2 = this.score.player2; 
      
      this.matchTotalPoints.player1 += s1;
      this.matchTotalPoints.player2 += s2;

      this.lastRoundPoints = { player1: s1, player2: s2 };
      this.score = { player1: 0, player2: 0 };

      let roundWinner = null;
      let marksToAdd = 0;
      let winType = ""; 

      if (s1 > s2) roundWinner = "player1";
      else if (s2 > s1) roundWinner = "player2";

      if (this.callbacks.onGameEnd && this.dbCurrentGameId) {
          await this.callbacks.onGameEnd(this.dbCurrentGameId, roundWinner, s1, s2);
      }

      if (roundWinner) {
        const winningScore = roundWinner === "player1" ? s1 : s2;
        if (winningScore === 120) { marksToAdd = this.winsNeeded; winType = "BANDEIRA"; } 
        else if (winningScore >= 91) { marksToAdd = 2; winType = "CAPOTE"; } 
        else { marksToAdd = 1; winType = "RISCA"; }

        this.matchWins[roundWinner] += marksToAdd;
        const winnerName = this[roundWinner] ? this[roundWinner].name : (roundWinner === "player1" ? "Player 1" : "Bot");

        if (this.matchWins[roundWinner] >= this.winsNeeded) {
          this.gameOver = true;
          this.turn = null;
          this.logs = `🏆 FIM DA PARTIDA: ${winnerName} venceu!`;
          
          if (this.callbacks.onMatchEnd) {
              await this.callbacks.onMatchEnd(
                  roundWinner, 
                  this.matchWins.player1, 
                  this.matchWins.player2, 
                  this.matchTotalPoints.player1, 
                  this.matchTotalPoints.player2
              );
          }
          return; 
        }
        this.logs = `${winnerName} ganhou a ronda: ${winType}. Placar: ${this.matchWins.player1} - ${this.matchWins.player2}`;
      } else {
        this.logs = "Empate (60-60)!";
      }
      
      await this.startNewMatch();
      this.roundOver = true; 
      this.turn = winner; 
      
    } else {
      this.turn = winner;
    }
  }

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
      
      // DADOS PARA O FRONTEND SINCRONIZAR
      winsNeeded: this.winsNeeded, 
      gameType: this.gameType,
      // --------------------------------

      player1Id: this.player1 ? String(this.player1.id) : null,
      player2Id: this.player2 ? String(this.player2.id) : null,

      player1Hand: this.player1Hand, 
      player2Hand: this.player2Hand, 
      score: this.score, 
      lastRoundPoints: this.lastRoundPoints, 
      turn: this.turn, 
      tableCards: this.tableCards, 
      trunfo: this.trunfo, 
      trunfoNaipe: this.trunfoNaipe, 
      cardsLeft: this.deck.length, 
      gameOver: this.gameOver, 
      roundOver: this.roundOver, 
      logs: this.logs, 
      p1Name: this.player1 ? this.player1.name : "Player 1", 
      p2Name: p2Name, 
      matchWins: this.matchWins, 
      matchTotalPoints: this.matchTotalPoints, 
      botCardCount: this.player2Hand.length,
    };
  }
}