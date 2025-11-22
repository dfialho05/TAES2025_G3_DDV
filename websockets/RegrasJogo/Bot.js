export class Bot {
  constructor(difficulty = "normal") {
    this.difficulty = difficulty;
    // Cache da hierarquia para comparações rápidas
    this.ranks = ["2", "3", "4", "5", "6", "Q", "J", "K", "7", "A"];
  }


  makeMove(hand, tableCards, trunfo, mustFollowSuit = false) {
    const mappedHand = hand.map((c, i) => ({ ...c, originalIndex: i }));
    const trunfoNaipe = trunfo.naipe || trunfo;

    // Se a mesa estiver vazia (Bot joga primeiro)
    if (tableCards.length === 0) {
      return this.playOffensive(mappedHand, trunfoNaipe);
    }

    // Se o jogador já jogou (Bot responde)
    const opponentMove = tableCards.find((c) => c.player === "user");

    // Passamos a flag de obrigação para a defesa
    return this.playDefensive(
      mappedHand,
      opponentMove.card,
      trunfoNaipe,
      mustFollowSuit
    );
  }

  // --- ESTRATÉGIA OFENSIVA (Joga Primeiro) ---
  playOffensive(hand, trunfoNaipe) {
    // OBJETIVO: Jogar "lixo" para forçar o oponente a gastar cartas,
    // ou guardar trunfos para o fim.

    // 1. Separa o que não é trunfo
    const nonTrunfos = hand.filter((c) => c.naipe !== trunfoNaipe);

    if (nonTrunfos.length > 0) {
      // Ordena do mais fraco para o mais forte
      nonTrunfos.sort((a, b) => this.compareCardsStrength(a, b));

      // Joga a carta mais fraca que tiver (ex: um 2 ou 3 de copas)
      return nonTrunfos[0].originalIndex;
    }

    // 2. Se só tem trunfos, é obrigado a jogar um.
    // Joga o trunfo mais baixo para não perder os fortes (Ás/7)
    hand.sort((a, b) => this.compareCardsStrength(a, b));
    return hand[0].originalIndex;
  }

  playDefensive(hand, opponentCard, trunfoNaipe, mustFollowSuit) {
    const oppPoints = opponentCard.value;
    const oppIsTrunfo = opponentCard.naipe === trunfoNaipe;

    // --- LÓGICA DA FASE FINAL (Obrigatório Assistir) ---
    let playableCards = hand;

    // Se for OBRIGADO a assistir e tiver cartas do naipe do oponente...
    if (mustFollowSuit) {
      const sameSuitCards = hand.filter((c) => c.naipe === opponentCard.naipe);
      if (sameSuitCards.length > 0) {
        // ...então SÓ pode jogar essas cartas. O resto da mão não conta agora.
        playableCards = sameSuitCards;
      }
    }
    // ---------------------------------------------------

    // 1. TENTAR GANHAR ASSISTINDO AO NAIPE (Dentro das cartas permitidas)
    const winningSuitCards = playableCards.filter(
      (c) =>
        c.naipe === opponentCard.naipe &&
        this.compareCardsStrength(c, opponentCard) > 0
    );

    if (winningSuitCards.length > 0) {
      winningSuitCards.sort((a, b) => this.compareCardsStrength(a, b));
      return winningSuitCards[0].originalIndex;
    }

    // 2. TENTAR CORTAR (Se permitido e vantajoso)
    // Só cortamos se não tivermos naipe para assistir (ou se não formos obrigados)
    // E se a carta valer a pena.
    const hasSuit = playableCards.some((c) => c.naipe === opponentCard.naipe);

    // Se eu tenho o naipe e sou obrigado a assistir, NÃO posso cortar.
    // Se eu não tenho o naipe (mesmo obrigado), então posso cortar.
    if (!hasSuit && !oppIsTrunfo && oppPoints >= 2) {
      const myTrumps = hand.filter((c) => c.naipe === trunfoNaipe); // Trunfos estão sempre na mão original

      if (myTrumps.length > 0) {
        myTrumps.sort((a, b) => this.compareCardsStrength(a, b));
        return myTrumps[0].originalIndex;
      }
    }

    // 3. DESCARTE
    // Ordena as cartas PERMITIDAS (playableCards) para jogar a mais fraca
    playableCards.sort((a, b) => {
      const aIsTrunfo = a.naipe === trunfoNaipe;
      const bIsTrunfo = b.naipe === trunfoNaipe;

      if (aIsTrunfo && !bIsTrunfo) return 1;
      if (!aIsTrunfo && bIsTrunfo) return -1;
      return this.compareCardsStrength(a, b);
    });

    return playableCards[0].originalIndex;
  }

  // --- HELPER: Comparador de Força Real na Bisca ---
  // Retorna > 0 se A ganha a B, < 0 se B ganha a A
  compareCardsStrength(cardA, cardB) {
    // 1. Critério Principal: Pontos (11, 10, 4, 3, 2, 0)
    if (cardA.value !== cardB.value) {
      return cardA.value - cardB.value;
    }
    // 2. Critério de Desempate: Rank para cartas de 0 pontos (2, 3, 4, 5, 6)
    return this.getRankIndex(cardA.rank) - this.getRankIndex(cardB.rank);
  }

  getRankIndex(rank) {
    return this.ranks.indexOf(rank);
  }
}
