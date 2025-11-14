// Test script for card distribution validation
// This script tests if cards are being distributed correctly and validates game integrity

import { GameManager } from "./handlers/gameManager.js";
import { validateGameIntegrity, attemptGameRecovery } from "./handlers/gameHandlers.js";
import config from "./config.js";

console.log("🃏 Iniciando teste de distribuição de cartas...\n");

const manager = new GameManager();

// Test 1: Basic card distribution
const testBasicDistribution = () => {
  console.log("📋 Teste 1: Distribuição básica de cartas");

  try {
    const game = manager.createGame(["TestPlayer"], { cardsPerPlayer: 9 });
    const gameState = game.start();

    console.log(`   ✅ Jogo criado com ID: ${game.gameId || "N/A"}`);
    console.log(`   - Jogadores: ${game.players.join(", ")}`);
    console.log(`   - Bot: ${game.bot || "Nenhum"}`);
    console.log(`   - Cartas por jogador: ${game.cardsPerPlayer}`);

    // Check card distribution
    const playerCards = game.hands[game.players[0]].length;
    const botCards = game.bot ? game.hands[game.bot].length : 0;
    const deckCards = game.deck.length;
    const totalCards = playerCards + botCards + deckCards;

    console.log(`   - Player: ${playerCards} cartas`);
    console.log(`   - Bot: ${botCards} cartas`);
    console.log(`   - Deck: ${deckCards} cartas`);
    console.log(`   - Total: ${totalCards} cartas`);
    console.log(`   - Trunfo: ${gameState.trump}`);

    if (totalCards === 40) {
      console.log(`   ✅ Total de cartas correto (40)`);
    } else {
      console.log(`   ❌ Total de cartas incorreto: ${totalCards} (esperado: 40)`);
    }

    if (Math.abs(playerCards - botCards) <= 1) {
      console.log(`   ✅ Distribuição equilibrada`);
    } else {
      console.log(`   ❌ Distribuição desequilibrada`);
    }

    return { success: true, game };

  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return { success: false, error };
  }
};

// Test 2: Game integrity validation
const testGameIntegrity = (game) => {
  console.log("\n📋 Teste 2: Validação de integridade do jogo");

  const validation = validateGameIntegrity(game, "test-game-1");

  if (validation.valid) {
    console.log(`   ✅ Jogo válido`);
  } else {
    console.log(`   ❌ Jogo inválido:`);
    validation.errors.forEach(error => {
      console.log(`      - ${error}`);
    });
  }

  if (validation.warnings.length > 0) {
    console.log(`   ⚠️ Avisos:`);
    validation.warnings.forEach(warning => {
      console.log(`      - ${warning}`);
    });
  }

  console.log(`   📊 Resumo:`, validation.summary);

  return validation;
};

// Test 3: Simulate card play and check distribution
const testCardPlay = (game) => {
  console.log("\n📋 Teste 3: Simulação de jogadas e verificação");

  try {
    const player = game.players[0];
    const bot = game.bot;

    console.log(`   - Turno atual: ${game.currentTurn}`);
    console.log(`   - Cartas antes da jogada:`);
    console.log(`     Player: ${game.hands[player].length}`);
    console.log(`     Bot: ${game.hands[bot].length}`);

    // Simulate player playing a card
    if (game.hands[player].length > 0) {
      const playerCard = game.hands[player][0];
      game.hands[player].splice(0, 1);
      game.playedCards.push({ player, card: playerCard });
      console.log(`   - Player jogou: ${playerCard.getFace()}`);
    }

    // Simulate bot playing a card
    if (game.hands[bot].length > 0) {
      const botCard = game.hands[bot][0];
      game.hands[bot].splice(0, 1);
      game.playedCards.push({ player: bot, card: botCard });
      console.log(`   - Bot jogou: ${botCard.getFace()}`);
    }

    console.log(`   - Cartas após a jogada:`);
    console.log(`     Player: ${game.hands[player].length}`);
    console.log(`     Bot: ${game.hands[bot].length}`);
    console.log(`     Jogadas: ${game.playedCards.length}`);

    // Simulate dealing new cards from deck
    if (game.deck.length >= 2) {
      const newPlayerCard = game.deck.pop();
      const newBotCard = game.deck.pop();

      game.hands[player].push(newPlayerCard);
      game.hands[bot].push(newBotCard);

      console.log(`   - Novas cartas distribuídas:`);
      console.log(`     Player recebeu: ${newPlayerCard.getFace()}`);
      console.log(`     Bot recebeu: ${newBotCard.getFace()}`);
    }

    console.log(`   - Estado final:`);
    console.log(`     Player: ${game.hands[player].length} cartas`);
    console.log(`     Bot: ${game.hands[bot].length} cartas`);
    console.log(`     Deck: ${game.deck.length} cartas`);

    return { success: true };

  } catch (error) {
    console.log(`   ❌ Erro durante simulação: ${error.message}`);
    return { success: false, error };
  }
};

// Test 4: Recovery system
const testRecoverySystem = () => {
  console.log("\n📋 Teste 4: Sistema de recuperação");

  try {
    // Create a game with corrupted state
    const game = manager.createGame(["TestPlayer"], { cardsPerPlayer: 9 });
    game.start();

    // Corrupt the game state by removing all bot cards
    const bot = game.bot;
    const originalBotCards = [...game.hands[bot]];
    game.hands[bot] = []; // Simulate bot losing all cards

    console.log(`   - Estado corrompido criado:`);
    console.log(`     Bot cards: ${game.hands[bot].length}`);
    console.log(`     Deck cards: ${game.deck.length}`);

    // Test recovery
    const mockIo = {
      to: () => ({
        emit: (event, data) => {
          console.log(`   📡 Event emitted: ${event}`, data.message || '');
        }
      })
    };

    const recovery = attemptGameRecovery(game, "test-recovery", mockIo);

    if (recovery.success) {
      console.log(`   ✅ Recuperação bem-sucedida`);
      console.log(`     Bot cards após recuperação: ${game.hands[bot].length}`);
    } else {
      console.log(`   ❌ Recuperação falhou: ${recovery.message || recovery.error}`);
    }

    return { success: recovery.success };

  } catch (error) {
    console.log(`   ❌ Erro no teste de recuperação: ${error.message}`);
    return { success: false, error };
  }
};

// Test 5: Multiple games in match
const testMultipleGames = () => {
  console.log("\n📋 Teste 5: Múltiplos jogos em uma partida");

  try {
    const game = manager.createGame(["TestPlayer"], { cardsPerPlayer: 9 });
    game.start();

    console.log(`   - Jogo inicial ${game.gameNumber}:`);
    console.log(`     Total de cartas: ${Object.values(game.hands).reduce((sum, hand) => sum + hand.length, 0) + game.deck.length}`);

    // Simulate finishing first game
    game.marks[game.players[0]] = 1;

    // Start new game
    const newGameState = game.startNewGame();

    console.log(`   - Novo jogo ${game.gameNumber}:`);
    const totalCards = Object.values(game.hands).reduce((sum, hand) => sum + hand.length, 0) + game.deck.length;
    console.log(`     Total de cartas: ${totalCards}`);

    if (totalCards === 40) {
      console.log(`   ✅ Distribuição correta no novo jogo`);
      return { success: true };
    } else {
      console.log(`   ❌ Distribuição incorreta no novo jogo: ${totalCards}`);
      return { success: false };
    }

  } catch (error) {
    console.log(`   ❌ Erro no teste de múltiplos jogos: ${error.message}`);
    return { success: false, error };
  }
};

// Run all tests
const runAllTests = async () => {
  console.log("🚀 Executando todos os testes de distribuição de cartas...\n");

  const results = [];

  // Test 1
  const test1 = testBasicDistribution();
  results.push({ name: "Distribuição Básica", success: test1.success });

  if (test1.success) {
    // Test 2 (depends on test 1)
    const test2 = testGameIntegrity(test1.game);
    results.push({ name: "Validação de Integridade", success: test2.valid });

    // Test 3 (depends on test 1)
    const test3 = testCardPlay(test1.game);
    results.push({ name: "Simulação de Jogadas", success: test3.success });
  }

  // Test 4 (independent)
  const test4 = testRecoverySystem();
  results.push({ name: "Sistema de Recuperação", success: test4.success });

  // Test 5 (independent)
  const test5 = testMultipleGames();
  results.push({ name: "Múltiplos Jogos", success: test5.success });

  // Summary
  console.log("\n📊 Resumo dos Testes:");
  console.log("========================");

  let passed = 0;
  results.forEach((result, index) => {
    const status = result.success ? "✅ PASSOU" : "❌ FALHOU";
    console.log(`${index + 1}. ${result.name}: ${status}`);
    if (result.success) passed++;
  });

  console.log(`\n🏁 Resultado Final: ${passed}/${results.length} testes passaram`);

  if (passed === results.length) {
    console.log("🎉 Todos os testes de distribuição de cartas passaram!");
  } else {
    console.log("⚠️ Alguns testes falharam - verifique os logs acima");
  }

  return results;
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log("\n🛑 Encerrando testes...");
  process.exit(0);
});

// Run tests
runAllTests().then((results) => {
  const allPassed = results.every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}).catch((error) => {
  console.error("💥 Erro fatal durante os testes:", error.message);
  process.exit(1);
});
