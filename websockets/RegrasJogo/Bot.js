export class Bot {
    constructor(difficulty = 'normal') {
        this.difficulty = difficulty;
        // Cache da hierarquia para comparações rápidas
        this.ranks = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A'];
    }

    /**
     * Decide qual carta jogar.
     * @param {Array} hand - As cartas na mão do bot
     * @param {Array} tableCards - As cartas já jogadas na mesa
     * @param {Object} trunfo - A carta ou objeto contendo o naipe do trunfo
     * @returns {Number} - O índice da carta a jogar no array 'hand'
     */
    makeMove(hand, tableCards, trunfo) {
        // Adiciona o índice original a cada carta para podermos ordenar sem perder a referência
        const mappedHand = hand.map((c, i) => ({ ...c, originalIndex: i }));
        
        // Normaliza o naipe do trunfo (caso venha o objeto carta ou só o naipe)
        const trunfoNaipe = trunfo.naipe || trunfo; 

        // Se a mesa estiver vazia (Bot joga primeiro)
        if (tableCards.length === 0) {
            return this.playOffensive(mappedHand, trunfoNaipe);
        }

        // Se o jogador já jogou (Bot responde)
        const opponentMove = tableCards.find(c => c.player === 'user');
        return this.playDefensive(mappedHand, opponentMove.card, trunfoNaipe);
    }

    // --- ESTRATÉGIA OFENSIVA (Joga Primeiro) ---
    playOffensive(hand, trunfoNaipe) {
        // OBJETIVO: Jogar "lixo" para forçar o oponente a gastar cartas,
        // ou guardar trunfos para o fim.

        // 1. Separa o que não é trunfo
        const nonTrunfos = hand.filter(c => c.naipe !== trunfoNaipe);

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

    // --- ESTRATÉGIA DEFENSIVA (Responde ao Jogador) ---
    playDefensive(hand, opponentCard, trunfoNaipe) {
        const oppPoints = opponentCard.value;
        const oppIsTrunfo = opponentCard.naipe === trunfoNaipe;

        // 1. TENTAR GANHAR ASSISTINDO AO NAIPE
        // Procura cartas do mesmo naipe que sejam mais fortes que a do oponente
        const winningSuitCards = hand.filter(c => 
            c.naipe === opponentCard.naipe && 
            this.compareCardsStrength(c, opponentCard) > 0
        );

        if (winningSuitCards.length > 0) {
            // OTIMIZAÇÃO: Ganhar com a carta "mais barata" possível.
            // Exemplo: Ele jogou Valete (3pts). Eu tenho Rei (4pts) e Ás (11pts).
            // Devo jogar o Rei, não o Ás.
            winningSuitCards.sort((a, b) => this.compareCardsStrength(a, b));
            return winningSuitCards[0].originalIndex;
        }

        // 2. TENTAR CORTAR COM TRUNFO (Se não conseguimos ganhar pelo naipe)
        // Só cortamos se:
        // a) O oponente NÃO jogou trunfo (não podemos cortar trunfo com trunfo se ele for maior que o nosso)
        // b) A carta do oponente vale pontos (>= 2 pts: Dama, Valete, Rei, 7, Ás)
        //    (Não vale a pena gastar trunfo para ganhar um 2 ou 6)
        if (!oppIsTrunfo && oppPoints >= 2) {
            const myTrumps = hand.filter(c => c.naipe === trunfoNaipe);
            
            if (myTrumps.length > 0) {
                // Corta com o trunfo mais baixo possível
                myTrumps.sort((a, b) => this.compareCardsStrength(a, b));
                return myTrumps[0].originalIndex;
            }
        }

        // 3. DESCARTE (BALDAR LIXO)
        // Se não conseguimos ganhar ou não vale a pena cortar.
        // Devemos descartar a carta mais fraca da mão, protegendo os trunfos.
        
        hand.sort((a, b) => {
            const aIsTrunfo = a.naipe === trunfoNaipe;
            const bIsTrunfo = b.naipe === trunfoNaipe;
            
            // Trunfos são sempre considerados "mais valiosos", ficam para o fim
            if (aIsTrunfo && !bIsTrunfo) return 1;
            if (!aIsTrunfo && bIsTrunfo) return -1;
            
            // Entre cartas do mesmo tipo (ambas trunfo ou ambas normais), ordena por força
            return this.compareCardsStrength(a, b);
        });

        // Joga a primeira da lista (a mais fraca que não é trunfo)
        return hand[0].originalIndex;
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