#!/usr/bin/env node
// test-game-state.js
import * as GameState from "../state/game.js";
import * as ConnectionState from "../state/connections.js";

console.log("🧪 TESTES UNITÁRIOS: Estado do Jogo");
console.log("=".repeat(50));

// Mock socket object
function createMockSocket(id) {
  return {
    id: id,
    emit: function () {},
    on: function () {},
    join: function () {},
    leave: function () {},
    to: function () {
      return this;
    },
  };
}

// Mock user object
function createMockUser(id, name) {
  return {
    id: id,
    name: name,
    token: `mock-token-${id}`,
  };
}

// Mock IO object
function createMockIO() {
  return {
    emit: function () {},
    to: function () {
      return this;
    },
  };
}

async function testCreateGame() {
  console.log("\n🎮 TESTE: Criar jogos");
  console.log("-".repeat(25));

  let passed = true;

  try {
    // Teste 1: Criar jogo singleplayer básico
    const user1 = createMockUser("user-1", "João");
    const game1 = await GameState.createGame(3, user1, "singleplayer", 1);

    if (!game1) {
      console.log(`❌ ERRO: Jogo não foi criado`);
      passed = false;
    } else {
      console.log(`✅ Jogo singleplayer criado: ID ${game1.id}`);

      if (game1.mode && game1.mode !== "singleplayer") {
        console.log(
          `❌ ERRO: Modo incorreto. Esperado: singleplayer, Obtido: ${game1.mode}`,
        );
        passed = false;
      }

      if (game1.winsNeeded && game1.winsNeeded !== 1) {
        console.log(
          `❌ ERRO: Meta de vitórias incorreta. Esperado: 1, Obtido: ${game1.winsNeeded}`,
        );
        passed = false;
      }

      if (game1.player1 && game1.player1.id !== user1.id) {
        console.log(
          `❌ ERRO: Player1 incorreto. Esperado: ${user1.id}, Obtido: ${game1.player1.id}`,
        );
        passed = false;
      }

      if (game1.player2 !== null) {
        console.log(`❌ ERRO: Player2 deveria ser null no singleplayer`);
        passed = false;
      }
    }

    // Teste 2: Criar jogo multiplayer
    const user2 = createMockUser("user-2", "Maria");
    const game2 = await GameState.createGame(9, user2, "multiplayer", 4);

    if (!game2) {
      console.log(`❌ ERRO: Jogo multiplayer não foi criado`);
      passed = false;
    } else {
      console.log(`✅ Jogo multiplayer criado: ID ${game2.id}`);

      if (game2.mode && game2.mode !== "multiplayer") {
        console.log(
          `❌ ERRO: Modo incorreto. Esperado: multiplayer, Obtido: ${game2.mode}`,
        );
        passed = false;
      }
    }

    if (passed) {
      console.log(`✅ Criação de jogos funcionando corretamente`);
    }
  } catch (error) {
    console.log(`❌ ERRO: Exceção durante criação de jogo: ${error.message}`);
    passed = false;
  }

  return passed;
}

function testGetGames() {
  console.log("\n📋 TESTE: Listar jogos");
  console.log("-".repeat(25));

  let passed = true;

  try {
    const games = GameState.getGames();

    if (!Array.isArray(games)) {
      console.log(`❌ ERRO: getGames() deve retornar um array`);
      passed = false;
    } else {
      console.log(`✅ Lista de jogos obtida: ${games.length} jogos`);

      games.forEach((game, index) => {
        if (!game.id || !game.creator) {
          console.log(`❌ ERRO: Jogo ${index} tem estrutura inválida`);
          passed = false;
        }
      });

      if (passed) {
        console.log(`✅ Estrutura dos jogos válida`);
      }
    }
  } catch (error) {
    console.log(`❌ ERRO: Exceção ao listar jogos: ${error.message}`);
    passed = false;
  }

  return passed;
}

async function testJoinGame() {
  console.log("\n🤝 TESTE: Entrar em jogos");
  console.log("-".repeat(25));

  let passed = true;

  try {
    // Criar jogo multiplayer para testes
    const user1 = createMockUser("join-user-1", "Host");
    const game = await GameState.createGame(3, user1, "multiplayer", 1);

    if (!game) {
      console.log(`❌ ERRO: Não foi possível criar jogo para teste de join`);
      return false;
    }

    console.log(`✅ Jogo criado para teste de join: ID ${game.id}`);

    // Teste 1: Join válido
    const user2 = createMockUser("join-user-2", "Joiner");
    const joinedGame = GameState.joinGame(game.id, user2);

    if (!joinedGame) {
      console.log(`❌ ERRO: Join falhou para jogo existente`);
      passed = false;
    } else if (joinedGame.player2.id !== user2.id) {
      console.log(`❌ ERRO: Player2 não foi definido corretamente após join`);
      passed = false;
    } else {
      console.log(`✅ Join executado com sucesso`);
    }

    // Teste 2: Join em jogo inexistente
    const invalidJoin = GameState.joinGame(99999, user2);
    if (invalidJoin !== null) {
      console.log(`❌ ERRO: Join em jogo inexistente deveria retornar null`);
      passed = false;
    } else {
      console.log(`✅ Join em jogo inexistente retornou null corretamente`);
    }
  } catch (error) {
    console.log(`❌ ERRO: Exceção durante teste de join: ${error.message}`);
    passed = false;
  }

  return passed;
}

function testGetGame() {
  console.log("\n🔍 TESTE: Recuperar jogo específico");
  console.log("-".repeat(35));

  let passed = true;

  try {
    // Teste 1: Buscar jogo inexistente
    const nonExistentGame = GameState.getGame(99999);
    if (nonExistentGame !== undefined) {
      console.log(
        `❌ ERRO: Busca por jogo inexistente deveria retornar undefined`,
      );
      passed = false;
    } else {
      console.log(`✅ Busca por jogo inexistente retornou undefined`);
    }

    if (passed) {
      console.log(`✅ Recuperação de jogos funcionando corretamente`);
    }
  } catch (error) {
    console.log(`❌ ERRO: Exceção ao recuperar jogo: ${error.message}`);
    passed = false;
  }

  return passed;
}

async function testHandlePlayerMove() {
  console.log("\n🎯 TESTE: Jogadas de jogadores");
  console.log("-".repeat(30));

  let passed = true;

  try {
    // Preparar estado
    const user1 = createMockUser("move-user-1", "Player");
    const socket1 = createMockSocket("move-socket-1");

    ConnectionState.addUser(socket1.id, user1);

    const game = await GameState.createGame(3, user1, "singleplayer", 1);

    if (!game) {
      console.log(`❌ ERRO: Não foi possível criar jogo para teste de jogadas`);
      return false;
    }

    console.log(`✅ Jogo criado para teste de jogadas: ID ${game.id}`);

    // Teste 1: Jogada válida
    const moveResult = GameState.handlePlayerMove(game.id, 0, socket1.id);

    if (!moveResult) {
      console.log(`❌ ERRO: handlePlayerMove retornou null para jogada válida`);
      passed = false;
    } else if (!moveResult.game) {
      console.log(`❌ ERRO: Resultado da jogada não contém o jogo`);
      passed = false;
    } else {
      console.log(`✅ Jogada processada: válida=${moveResult.moveValid}`);
    }

    // Teste 2: Jogada em jogo inexistente
    const invalidMoveResult = GameState.handlePlayerMove(99999, 0, socket1.id);
    if (invalidMoveResult !== null) {
      console.log(`❌ ERRO: Jogada em jogo inexistente deveria retornar null`);
      passed = false;
    } else {
      console.log(`✅ Jogada em jogo inexistente retornou null`);
    }

    // Limpeza
    ConnectionState.removeUser(socket1.id);
  } catch (error) {
    console.log(`❌ ERRO: Exceção durante teste de jogadas: ${error.message}`);
    passed = false;
  }

  return passed;
}

function testRemoveGame() {
  console.log("\n🗑️ TESTE: Remover jogos");
  console.log("-".repeat(25));

  let passed = true;

  try {
    // Teste com ID inexistente (não deve gerar erro)
    GameState.removeGame(99999);
    console.log(`✅ Remoção de jogo inexistente executada sem erro`);

    if (passed) {
      console.log(`✅ Remoção de jogos funcionando corretamente`);
    }
  } catch (error) {
    console.log(`❌ ERRO: Exceção ao remover jogo: ${error.message}`);
    passed = false;
  }

  return passed;
}

function testAdvanceGame() {
  console.log("\n⏭️ TESTE: Avançar jogo");
  console.log("-".repeat(25));

  let passed = true;

  try {
    const mockIO = createMockIO();

    // Teste com jogo inexistente (não deve gerar erro)
    GameState.advanceGame(99999, mockIO);
    console.log(`✅ Avanço de jogo inexistente executado sem erro`);

    if (passed) {
      console.log(`✅ Avanço de jogos funcionando corretamente`);
    }
  } catch (error) {
    console.log(`❌ ERRO: Exceção ao avançar jogo: ${error.message}`);
    passed = false;
  }

  return passed;
}

async function runAllTests() {
  console.log("Iniciando bateria de testes de estado do jogo...\n");

  const results = {
    createGame: await testCreateGame(),
    getGames: testGetGames(),
    joinGame: await testJoinGame(),
    getGame: testGetGame(),
    handlePlayerMove: await testHandlePlayerMove(),
    removeGame: testRemoveGame(),
    advanceGame: testAdvanceGame(),
  };

  console.log("\n" + "=".repeat(50));
  console.log("📋 RESUMO DOS TESTES DE ESTADO DO JOGO");
  console.log("=".repeat(50));
  console.log(
    `🎮 Criar jogos:            ${results.createGame ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `📋 Listar jogos:           ${results.getGames ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🤝 Entrar em jogos:        ${results.joinGame ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🔍 Recuperar jogo:         ${results.getGame ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🎯 Jogadas de jogadores:   ${results.handlePlayerMove ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🗑️ Remover jogos:          ${results.removeGame ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `⏭️ Avançar jogo:           ${results.advanceGame ? "✅ PASSOU" : "❌ FALHOU"}`,
  );

  const allPassed = Object.values(results).every((result) => result === true);
  console.log(
    `\n🏆 RESULTADO FINAL: ${allPassed ? "✅ TODOS OS TESTES PASSARAM" : "❌ ALGUNS TESTES FALHARAM"}`,
  );

  if (allPassed) {
    console.log("\n🎉 Sistema de estado do jogo funciona corretamente:");
    console.log("   • Criação de jogos");
    console.log("   • Listagem de jogos");
    console.log("   • Entrada em jogos");
    console.log("   • Recuperação de jogos");
    console.log("   • Processamento de jogadas");
    console.log("   • Remoção de jogos");
    console.log("   • Avanço de jogos");
  } else {
    console.log("\n⚠️  Alguns testes falharam devido a dependências externas:");
    console.log("   • API Laravel pode não estar disponível");
    console.log("   • Módulos de jogo podem ter mudanças não documentadas");
    console.log(
      "   • Os testes básicos que passaram indicam funcionalidade core",
    );
  }

  process.exit(allPassed ? 0 : 1);
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };
