import { Bot } from "./Bot.js";

const NAIPES = ["c", "o", "p", "e"];
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

export class BiscaGame {
  constructor() {
    this.deck = this.createDeck();
    this.trunfo = this.deck.pop();

    // CRUCIAL: Guardar o naipe para quando a carta física for pescada
    this.trunfoNaipe = this.trunfo.naipe;

    this.botAI = new Bot("normal");
    this.playerHand = this.deck.splice(0, 9);
    this.botHand = this.deck.splice(0, 9);
    this.tableCards = [];
    this.score = { user: 0, bot: 0 };
    this.turn = "user";
    this.logs = "Jogo iniciado!";
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
          color: naipe === "c" || naipe === "o" ? "red" : "black",
        });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  // Helper para saber se estamos na Fase 2 (Sem baralho -> Obrigatório Assistir)
  isFinalPhase() {
    return this.deck.length === 0 && this.trunfo === null;
  }

  playUserCard(index) {
    // 1. Validações Básicas
    if (this.gameOver || this.turn !== "user") return false;
    if (index < 0 || index >= this.playerHand.length) return false;

    const cardToPlay = this.playerHand[index];

    // 2. REGRA DO PROFESSOR: VALIDAÇÃO DA FASE FINAL
    // Se o Bot jogou primeiro E estamos na fase final (sem baralho)
    if (this.tableCards.length > 0 && this.isFinalPhase()) {
      const botMove = this.tableCards[0]; // A carta que o bot jogou
      const suitToFollow = botMove.card.naipe;

      // Verifica se o jogador tem cartas desse naipe na mão
      const hasSuit = this.playerHand.some((c) => c.naipe === suitToFollow);

      // Se tem o naipe e tentou jogar outro, BLOQUEIA a jogada
      if (hasSuit && cardToPlay.naipe !== suitToFollow) {
        this.logs = `⚠️ Regra: É obrigatório assistir ao naipe (${suitToFollow})!`;
        return false; // O servidor recusa a jogada e o frontend não mexe
      }
    }

    // 3. Executa a jogada
    this.playerHand.splice(index, 1);
    this.tableCards.push({ card: cardToPlay, player: "user" });

    // Passa a vez ao bot e avisa o user
    this.turn = "bot";
    this.logs = "Bot a pensar...";
    return true;
  }

  playBotCard() {
    if (this.botHand.length === 0) return;

    // Prepara info do trunfo (caso a carta seja null)
    const trunfoInfo = this.trunfo
      ? this.trunfo
      : { naipe: this.trunfoNaipe, value: 0, rank: "" };

    // Verifica se o Bot é obrigado a assistir ao naipe (Fase 2)
    const mustFollow = this.isFinalPhase();

    // Pede ao Bot para decidir (passando a flag de obrigação)
    const selectedIndex = this.botAI.makeMove(
      this.botHand,
      this.tableCards,
      trunfoInfo,
      mustFollow
    );

    const card = this.botHand.splice(selectedIndex, 1)[0];
    this.tableCards.push({ card, player: "bot" });

    // Devolve o turno ao user para ele poder responder
    this.turn = "user";
    this.logs = "Sua vez...";
  }

  resolveRound() {
    if (this.tableCards.length < 2) return null;

    const firstMove = this.tableCards[0];
    const secondMove = this.tableCards[1];

    const c1 = firstMove.card;
    const c2 = secondMove.card;
    const trunfoNaipe = this.trunfoNaipe;
    let winnerPlayer = "";

    // Lógica de Vencedor da Vaza
    if (c2.naipe === c1.naipe) {
      // Mesmo naipe: ganha valor maior
      if (c2.value > c1.value) winnerPlayer = secondMove.player;
      else if (c1.value > c2.value) winnerPlayer = firstMove.player;
      else {
        // Desempate por rank (ex: 6 ganha a 5)
        const r1 = RANKS.indexOf(c1.rank);
        const r2 = RANKS.indexOf(c2.rank);
        winnerPlayer = r2 > r1 ? secondMove.player : firstMove.player;
      }
    } else {
      // Naipes diferentes
      if (c2.naipe === trunfoNaipe) {
        // O segundo jogador cortou com trunfo -> Ganha o segundo
        winnerPlayer = secondMove.player;
      } else {
        // O segundo não tem o naipe e não cortou -> Ganha o primeiro
        winnerPlayer = firstMove.player;
      }
    }
    

    const points = c1.value + c2.value;
    this.score[winnerPlayer] += points;
    this.logs =
      winnerPlayer === "user"
        ? `Ganhaste a vaza! (+${points} pts)`
        : `Bot ganhou a vaza.`;

    // Tenta pescar cartas (só acontece se houver baralho)
    this.drawCards(winnerPlayer);

    return winnerPlayer;
  }

  drawCards(winner) {
    // Se o baralho acabou E o trunfo já foi pescado, não faz nada
    if (this.deck.length === 0 && !this.trunfo) return;

    const pullCard = () => {
      if (this.deck.length > 0) return this.deck.pop();
      if (this.trunfo) {
        const t = this.trunfo;
        this.trunfo = null;
        return t;
      }
      return null;
    };

    const winnerCard = pullCard();
    const loserCard = pullCard();

    if (winner === "user") {
      if (winnerCard) this.playerHand.push(winnerCard);
      if (loserCard) this.botHand.push(loserCard);
    } else {
      if (winnerCard) this.botHand.push(winnerCard);
      if (loserCard) this.playerHand.push(loserCard);
    }
  }

  cleanupRound(winner) {
    this.tableCards = [];

    // REGRA DO PROFESSOR: Condições de Fim de Jogo
    // 1. Acabaram as cartas nas mãos
    // 2. Alguém atingiu 61 pontos (Maioria matemática)
    const handsEmpty =
      this.playerHand.length === 0 && this.botHand.length === 0;
    const userWon = this.score.user > 60; // > 60 é 61 ou mais
    const botWon = this.score.bot > 60;

    if (handsEmpty || userWon || botWon) {
      this.gameOver = true;

      let result = "";
      if (this.score.user > 60)
        result = "PARABÉNS! JÁ TENS 61+ PONTOS! GANHASTE!";
      else if (this.score.bot > 60)
        result = "PERDESTE! O BOT ATINGIU 61 PONTOS.";
      else if (this.score.user === this.score.bot) result = "EMPATE TÉCNICO!";
      else
        result =
          this.score.user > this.score.bot
            ? "FIM! GANHASTE NOS PONTOS!"
            : "FIM! PERDESTE NOS PONTOS!";

      this.logs = result;
      this.turn = null;
    } else {
      // Regra Base: Quem ganha a vaza joga primeiro na próxima
      this.turn = winner;

      if (winner === "user") {
        this.logs += " Sua vez de jogar.";
      } else {
        this.logs += " Vez do Bot jogar.";
      }
    }
  }

  getState() {
    return {
      playerHand: this.playerHand, // Envia a mão do jogador
      //botHand: this.botHand,  //apenas para debug
      botCardCount: this.botHand.length, // Nº de cartas do bot
      trunfo: this.trunfo, // Carta de trunfo (pode ser null)
      trunfoNaipe: this.trunfoNaipe, // Naipe do trunfo
      tableCards: this.tableCards, // Cartas na mesa
      score: this.score, // Pontuação atual
      turn: this.turn, // De quem é a vez
      logs: this.logs, // Mensagem de status
      gameOver: this.gameOver, // Estado do jogo
      cardsLeft: this.deck.length, // Cartas restantes no baralho
    };
  }
}
