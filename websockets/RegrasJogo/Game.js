// RegrasJogo/Game.js
import { Bot } from "./Bot.js";

// Constantes de Jogo
const NAIPES = ["c", "o", "p", "e"];
const RANKS = ["2", "3", "4", "5", "6", "Q", "J", "K", "7", "A"];
const VALORES = { A: 11, 7: 10, K: 4, J: 3, Q: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

export class BiscaGame {
  constructor(gameType = 3) {
    this.deck = this.createDeck();
    this.trunfo = this.deck.pop();
    this.trunfoNaipe = this.trunfo.naipe;

    // Configuração de Jogadores (Nomes Corretos)
    const handSize = gameType === 9 ? 9 : 3;
    this.player1Hand = this.deck.splice(0, handSize);
    this.player2Hand = this.deck.splice(0, handSize);

    // Estado do Jogo
    this.tableCards = [];
    this.score = { player1: 0, player2: 0 }; 
    this.turn = "player1";                  
    this.gameOver = false;
    this.logs = `Jogo iniciado (${handSize} cartas)!`;

   
    this.botAI = new Bot("normal");
  }

  // --- FUNÇÃO PRINCIPAL: JOGAR CARTA ---
  playCard(player, index) {
    // 1. Validações Básicas (Turno e Fim de Jogo)
    if (this.gameOver || this.turn !== player) return false;

    // 2. Identificar a mão correta
    const currentHand = player === "player1" ? this.player1Hand : this.player2Hand;
    
    // 3. Validar se a carta existe
    if (index < 0 || index >= currentHand.length) return false;
    const card = currentHand[index];

    // 4. REGRA: Assistir ao Naipe (apenas na fase final)
    if (this.tableCards.length > 0 && this.isFinalPhase()) {
      const naipeMesa = this.tableCards[0].card.naipe;
      const temNaipe = currentHand.some(c => c.naipe === naipeMesa);

      // Se tem o naipe da mesa e tentou jogar outro -> ERRO
      if (temNaipe && card.naipe !== naipeMesa) {
        this.logs = `⚠️ Regra: Tens de jogar naipe de ${naipeMesa}!`;
        return false;
      }
    }

    // 5. Executar a Jogada
    currentHand.splice(index, 1);                  // Remove da mão
    this.tableCards.push({ card, player });        // Põe na mesa
    
    // 6. Trocar Turno e Logs
    this.turn = player === "player1" ? "player2" : "player1";
    this.logs = `Player ${player === 'player1' ? '1' : '2'} jogou ${card.rank}-${card.naipe}`;
    
    return true;
  }

  // --- IA DO BOT (Atua como Player 2) ---
  playBotCard() {
    if (this.player2Hand.length === 0) return;

    // Prepara dados para a IA
    const trunfoData = this.trunfo || { naipe: this.trunfoNaipe, value: 0 };
    const mustFollow = this.isFinalPhase();

    // IA decide o índice
    const index = this.botAI.makeMove(
      this.player2Hand, 
      this.tableCards, 
      trunfoData, 
      mustFollow
    );

    // Reutiliza a função principal dizendo que é o "player2" a jogar
    this.playCard("player2", index);
  }

  // --- RESOLUÇÃO DA VAZA (Quem ganhou?) ---
  resolveRound() {
    if (this.tableCards.length < 2) return null;

    const [move1, move2] = this.tableCards; // move1 é quem jogou primeiro nesta ronda
    const c1 = move1.card;
    const c2 = move2.card;

    let winner = "";

    // Lógica da Bisca
    if (c2.naipe === c1.naipe) {
      // Mesmo naipe: ganha maior valor ou rank
      if (c2.value > c1.value) winner = move2.player;
      else if (c1.value > c2.value) winner = move1.player;
      else winner = RANKS.indexOf(c2.rank) > RANKS.indexOf(c1.rank) ? move2.player : move1.player;
    } else {
      // Naipes diferentes: ganha quem cortou (trunfo), senão ganha o primeiro
      winner = c2.naipe === this.trunfoNaipe ? move2.player : move1.player;
    }

    // Atualizar Pontos
    const points = c1.value + c2.value;
    this.score[winner] += points;
    this.logs = `Vencedor da vaza: ${winner} (+${points} pts)`;

    // Pescar cartas (se houver baralho)
    this.drawCards(winner);

    return winner;
  }

  // --- LIMPEZA E VERIFICAÇÃO DE VITÓRIA ---
  cleanupRound(winner) {
    this.tableCards = []; // Limpa a mesa

    // Verifica se o jogo acabou (Mãos vazias)
    if (this.player1Hand.length === 0 && this.player2Hand.length === 0) {
      this.gameOver = true;
      this.turn = null;
      
      const s1 = this.score.player1;
      const s2 = this.score.player2;

      if (s1 > s2) this.logs = `FIM! Player 1 venceu (${s1} - ${s2})`;
      else if (s2 > s1) this.logs = `FIM! Player 2 venceu (${s2} - ${s1})`;
      else this.logs = "FIM! Empate Técnico (60-60)";
    } else {
      // O jogo continua: quem ganhou a vaza joga primeiro
      this.turn = winner;
    }
  }

  // --- AUXILIARES ---
  createDeck() {
    let deck = [];
    for (let naipe of NAIPES) {
      for (let rank of RANKS) {
        deck.push({ 
          rank, naipe, value: VALORES[rank], 
          id: `${rank}-${naipe}`, 
          color: (naipe === "c" || naipe === "o") ? "red" : "black" 
        });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  isFinalPhase() {
    return this.deck.length === 0 && this.trunfo === null;
  }

  drawCards(winner) {
    if (this.deck.length === 0 && !this.trunfo) return;

    const pull = () => {
      if (this.deck.length > 0) return this.deck.pop();
      if (this.trunfo) { const t = this.trunfo; this.trunfo = null; return t; }
      return null;
    };

    // Quem ganha pesca primeiro
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

  

  // --- GET STATE (Para o Frontend) ---
  getState() {
    return {
      id: this.id,
      // Dados principais com nomes corretos
      player1Hand: this.player1Hand,
      player2Hand: this.player2Hand, // Nota: Frontend deve esconder esta se for o Player 1
      
      score: this.score,
      turn: this.turn,
      
      // Dados comuns
      tableCards: this.tableCards,
      trunfo: this.trunfo,
      trunfoNaipe: this.trunfoNaipe,
      cardsLeft: this.deck.length,
      gameOver: this.gameOver,
      logs: this.logs,
      
      // --- LEGACY SUPPORT (Opcional, remove quando atualizares o frontend) ---
      playerHand: this.player1Hand, 
      botCardCount: this.player2Hand.length 
    };
  }
}