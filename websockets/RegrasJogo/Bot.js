export class Bot {
    constructor(difficulty = 'normal') {
        this.difficulty = difficulty;
    }

    /**
     * Decide qual carta jogar.
     * @param {Array} hand - As cartas na mão do bot
     * @param {Array} tableCards - As cartas já jogadas na mesa (para saber o que o jogador jogou)
     * @param {Object} trunfo - A carta trunfo do jogo
     * @returns {Number} - O índice da carta a jogar no array 'hand'
     */
    makeMove(hand, tableCards, trunfo) {
        // Se a mesa estiver vazia (Bot joga primeiro)
        if (tableCards.length === 0) {
            return this.playOffensive(hand, trunfo);
        }

        // Se o jogador já jogou (Bot responde)
        const opponentMove = tableCards.find(c => c.player === 'user');
        return this.playDefensive(hand, opponentMove.card, trunfo);
    }

    // Estratégia quando o Bot joga primeiro
    playOffensive(hand, trunfo) {
        // Lógica Simples: Tenta jogar uma carta que não seja trunfo e seja baixa
        // para não gastar força. Se só tiver trunfos, joga o menor.
        
        // 1. Tentar jogar carta que NÃO é trunfo
        const nonTrunfos = hand.map((c, i) => ({ ...c, originalIndex: i }))
                               .filter(c => c.naipe !== trunfo.naipe);

        if (nonTrunfos.length > 0) {
            // Joga a de menor valor (lixo)
            nonTrunfos.sort((a, b) => a.value - b.value);
            return nonTrunfos[0].originalIndex;
        }

        // 2. Se só tem trunfos, joga o mais fraco
        // (Aqui podes melhorar depois)
        return 0; 
    }

    // Estratégia quando o Bot responde ao jogador
    playDefensive(hand, opponentCard, trunfo) {
        // Aqui podes meter IA complexa. 
        // Por agora, vamos manter o aleatório para não complicar,
        // mas a estrutura já está pronta para receber inteligência!
        
        return Math.floor(Math.random() * hand.length);
    }
}