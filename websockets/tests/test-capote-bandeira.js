#!/usr/bin/env node
// test-capote-bandeira.js
import { BiscaGame } from "../RegrasJogo/Game.js";

console.log("🧪 TESTE AUTOMATIZADO: Capote e Bandeira");
console.log("=" .repeat(50));

function createTestGame(winsNeeded = 4) {
    return new BiscaGame(3, "singleplayer", winsNeeded);
}

function forceGameEnd(game, p1Score, p2Score) {
    // Forçar o score
    game.score.player1 = p1Score;
    game.score.player2 = p2Score;

    // Esvaziar as mãos para triggar o fim da partida
    game.player1Hand = [];
    game.player2Hand = [];

    // Triggar a lógica de fim de partida
    game.cleanupRound("player1");
}

function testCapote() {
    console.log("\n🔥 TESTE CAPOTE (91-119 pontos = +2 marks)");
    console.log("-".repeat(40));

    const game = createTestGame(4); // Precisa de 4 vitórias para ganhar
    const initialMarks = { p1: game.matchWins.player1, p2: game.matchWins.player2 };

    console.log(`📊 Estado inicial:`);
    console.log(`   Marks: P1=${initialMarks.p1}, P2=${initialMarks.p2}`);
    console.log(`   Meta: ${game.winsNeeded} vitórias\n`);

    // Testar capote com 95 pontos
    console.log(`🎯 Simulando partida: P1=95pts, P2=25pts`);
    forceGameEnd(game, 95, 25);

    console.log(`📈 Resultado:`);
    console.log(`   Score final: P1=95, P2=25`);
    console.log(`   Marks após partida: P1=${game.matchWins.player1}, P2=${game.matchWins.player2}`);
    console.log(`   Marks ganhas: +${game.matchWins.player1 - initialMarks.p1}`);
    console.log(`   Log: ${game.logs}`);
    console.log(`   Jogo acabou: ${game.gameOver ? '✅ SIM' : '❌ NÃO'}`);

    // Verificar se foi capote
    const marksGained = game.matchWins.player1 - initialMarks.p1;
    if (marksGained === 2) {
        console.log(`✅ CAPOTE DETECTADO CORRETAMENTE (+2 marks)`);
        return true;
    } else {
        console.log(`❌ ERRO: Esperava +2 marks, mas ganhou +${marksGained}`);
        return false;
    }
}

function testBandeira() {
    console.log("\n🏴 TESTE BANDEIRA (120 pontos = vitória imediata)");
    console.log("-".repeat(45));

    const game = createTestGame(4); // Precisa de 4 vitórias para ganhar
    const initialMarks = { p1: game.matchWins.player1, p2: game.matchWins.player2 };

    console.log(`📊 Estado inicial:`);
    console.log(`   Marks: P1=${initialMarks.p1}, P2=${initialMarks.p2}`);
    console.log(`   Meta: ${game.winsNeeded} vitórias\n`);

    // Testar bandeira com 120 pontos
    console.log(`🎯 Simulando partida: P1=120pts, P2=0pts`);
    forceGameEnd(game, 120, 0);

    console.log(`📈 Resultado:`);
    console.log(`   Score final: P1=120, P2=0`);
    console.log(`   Marks após partida: P1=${game.matchWins.player1}, P2=${game.matchWins.player2}`);
    console.log(`   Marks ganhas: +${game.matchWins.player1 - initialMarks.p1}`);
    console.log(`   Log: ${game.logs}`);
    console.log(`   Jogo acabou: ${game.gameOver ? '✅ SIM' : '❌ NÃO'}`);

    // Verificar se foi bandeira (deve dar vitória imediata)
    const marksGained = game.matchWins.player1 - initialMarks.p1;
    if (marksGained === 4 && game.gameOver) {
        console.log(`✅ BANDEIRA DETECTADA CORRETAMENTE (vitória imediata)`);
        return true;
    } else {
        console.log(`❌ ERRO: Esperava vitória imediata (+4 marks), mas ganhou +${marksGained}`);
        return false;
    }
}

function testRisca() {
    console.log("\n📝 TESTE RISCA NORMAL (< 91 pontos = +1 mark)");
    console.log("-".repeat(40));

    const game = createTestGame(4);
    const initialMarks = { p1: game.matchWins.player1, p2: game.matchWins.player2 };

    console.log(`📊 Estado inicial:`);
    console.log(`   Marks: P1=${initialMarks.p1}, P2=${initialMarks.p2}`);
    console.log(`   Meta: ${game.winsNeeded} vitórias\n`);

    // Testar risca normal com 70 pontos
    console.log(`🎯 Simulando partida: P1=70pts, P2=50pts`);
    forceGameEnd(game, 70, 50);

    console.log(`📈 Resultado:`);
    console.log(`   Score final: P1=70, P2=50`);
    console.log(`   Marks após partida: P1=${game.matchWins.player1}, P2=${game.matchWins.player2}`);
    console.log(`   Marks ganhas: +${game.matchWins.player1 - initialMarks.p1}`);
    console.log(`   Log: ${game.logs}`);
    console.log(`   Jogo acabou: ${game.gameOver ? '✅ SIM' : '❌ NÃO'}`);

    // Verificar se foi risca normal
    const marksGained = game.matchWins.player1 - initialMarks.p1;
    if (marksGained === 1) {
        console.log(`✅ RISCA NORMAL DETECTADA CORRETAMENTE (+1 mark)`);
        return true;
    } else {
        console.log(`❌ ERRO: Esperava +1 mark, mas ganhou +${marksGained}`);
        return false;
    }
}

function testSequenceGame() {
    console.log("\n🎮 TESTE SEQUÊNCIA DE PARTIDAS");
    console.log("-".repeat(35));

    const game = createTestGame(4);
    let partida = 1;

    const cenarios = [
        { p1: 70, p2: 50, expected: 1, desc: "Risca Normal" },
        { p1: 95, p2: 25, expected: 2, desc: "Capote" },
        { p1: 120, p2: 0, expected: 4, desc: "Bandeira (deve acabar)" }
    ];

    let allCorrect = true;

    for (const cenario of cenarios) {
        if (game.gameOver) {
            console.log(`⚠️  Jogo já acabou, não pode fazer mais partidas`);
            break;
        }

        console.log(`\n--- Partida ${partida}: ${cenario.desc} ---`);
        const marksBefore = game.matchWins.player1;

        // Reset do jogo para nova partida
        if (partida > 1) {
            game.startNewMatch();
        }

        forceGameEnd(game, cenario.p1, cenario.p2);

        const marksAfter = game.matchWins.player1;
        const marksGained = marksAfter - marksBefore;

        console.log(`Score: P1=${cenario.p1}, P2=${cenario.p2}`);
        console.log(`Marks: ${marksBefore} → ${marksAfter} (+${marksGained})`);
        console.log(`Esperado: +${cenario.expected}, Obtido: +${marksGained}`);
        console.log(`Status: ${game.gameOver ? 'JOGO ACABOU' : 'Continua'}`);

        if (marksGained === cenario.expected) {
            console.log(`✅ Correto`);
        } else {
            console.log(`❌ Erro`);
            allCorrect = false;
        }

        partida++;
    }

    return allCorrect;
}

function testEdgeCases() {
    console.log("\n🔍 TESTE CASOS EXTREMOS");
    console.log("-".repeat(25));

    let allCorrect = true;

    // Teste: Exatamente 91 pontos (deve ser capote)
    console.log(`\n--- Caso 1: Exatamente 91 pontos (limite do capote) ---`);
    const game1 = createTestGame(4);
    forceGameEnd(game1, 91, 29);
    const marks1 = game1.matchWins.player1;
    console.log(`Score: 91-29, Marks: +${marks1}`);
    if (marks1 === 2) {
        console.log(`✅ 91 pontos = Capote (+2) - Correto`);
    } else {
        console.log(`❌ 91 pontos deveria ser Capote (+2), mas foi +${marks1}`);
        allCorrect = false;
    }

    // Teste: 90 pontos (deve ser risca normal)
    console.log(`\n--- Caso 2: 90 pontos (deve ser risca normal) ---`);
    const game2 = createTestGame(4);
    forceGameEnd(game2, 90, 30);
    const marks2 = game2.matchWins.player1;
    console.log(`Score: 90-30, Marks: +${marks2}`);
    if (marks2 === 1) {
        console.log(`✅ 90 pontos = Risca Normal (+1) - Correto`);
    } else {
        console.log(`❌ 90 pontos deveria ser Risca Normal (+1), mas foi +${marks2}`);
        allCorrect = false;
    }

    // Teste: 119 pontos (ainda deve ser capote)
    console.log(`\n--- Caso 3: 119 pontos (limite superior do capote) ---`);
    const game3 = createTestGame(4);
    forceGameEnd(game3, 119, 1);
    const marks3 = game3.matchWins.player1;
    console.log(`Score: 119-1, Marks: +${marks3}`);
    if (marks3 === 2) {
        console.log(`✅ 119 pontos = Capote (+2) - Correto`);
    } else {
        console.log(`❌ 119 pontos deveria ser Capote (+2), mas foi +${marks3}`);
        allCorrect = false;
    }

    return allCorrect;
}

// Executar todos os testes
function runAllTests() {
    console.log("Iniciando bateria de testes...\n");

    const results = {
        risca: testRisca(),
        capote: testCapote(),
        bandeira: testBandeira(),
        sequence: testSequenceGame(),
        edgeCases: testEdgeCases()
    };

    console.log("\n" + "=".repeat(50));
    console.log("📋 RESUMO DOS TESTES");
    console.log("=".repeat(50));
    console.log(`📝 Risca:     ${results.risca ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`🔥 Capote:    ${results.capote ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`🏴 Bandeira:  ${results.bandeira ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`🎮 Sequência: ${results.sequence ? '✅ PASSOU' : '❌ FALHOU'}`);
    console.log(`🔍 Extremos:  ${results.edgeCases ? '✅ PASSOU' : '❌ FALHOU'}`);

    const allPassed = Object.values(results).every(result => result === true);
    console.log(`\n🏆 RESULTADO FINAL: ${allPassed ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM'}`);

    if (allPassed) {
        console.log("\n🎉 Sistema de pontuação funciona corretamente:");
        console.log("   • Risca Normal: < 91 pontos = +1 mark");
        console.log("   • Capote: 91-119 pontos = +2 marks");
        console.log("   • Bandeira: 120 pontos = vitória imediata");
    }

    process.exit(allPassed ? 0 : 1);
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}
