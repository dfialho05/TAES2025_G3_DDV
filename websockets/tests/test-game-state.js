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

function testCreateGame() {
  console.log("\n🎮 TESTE: Criar jogos");
  console.log("-".repeat(25));

  let passed = true;

  // Teste 1: Criar jogo singleplayer básico
  const user1 = createMockUser("user-1", "João");
  const game1 = GameState.createGame(3, user1, "singleplayer", 1);

  if (!game1) {
    console.log(`❌ ERRO: Jogo não foi criado`);
    passed = false;
  } else {
    console.log(`✅ Jogo singleplayer criado: ID ${game1.id}`);

    if (game1.mode !== "singleplayer") {
      console.log(
        `❌ ERRO: Modo incorreto. Esperado: singleplayer, Obtido: ${game1.mode}`,
      );
      passed = false;
    }

    if (game1.winsNeeded !== 1) {
      console.log(
        `❌ ERRO: Meta de vitórias incorreta. Esperado: 1, Obtido: ${game1.winsNeeded}`,
      );
      passed = false;
    }

    if (game1.player1.id !== user1.id) {
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
  const game2 = GameState.createGame(9, user2, "multiplayer", 4);

  if (!game2) {
    console.log(`❌ ERRO: Jogo multiplayer não foi criado`);
    passed = false;
  } else {
    console.log(`✅ Jogo multiplayer criado: ID ${game2.id}`);

    if (game2.mode !== "multiplayer") {
      console.log(
        `❌ ERRO: Modo incorreto. Esperado: multiplayer, Obtido: ${game2.mode}`,
      );
      passed = false;
    }

    if (game2.winsNeeded !== 4) {
      console.log(
        `❌ ERRO: Meta de vitórias incorreta. Esperado: 4, Obtido: ${game2.winsNeeded}`,
      );
      passed = false;
    }

    if (game2.turn !== null) {
      console.log(
        `❌ ERRO: Turno deveria ser null aguardando player2. Obtido: ${game2.turn}`,
      );
      passed = false;
    }
  }

  // Teste 3: Verificar IDs únicos
  const user3 = createMockUser("user-3", "Pedro");
  const game3 = GameState.createGame(3, user3);

  if (game1.id === game2.id || game1.id === game3.id || game2.id === game3.id) {
    console.log(`❌ ERRO: IDs de jogos não são únicos`);
    console.log(
      `   Game1: ${game1.id}, Game2: ${game2.id}, Game3: ${game3.id}`,
    );
    passed = false;
  } else {
    console.log(
      `✅ IDs únicos verificados: ${game1.id}, ${game2.id}, ${game3.id}`,
    );
  }

  return passed;
}

function testJoinGame() {
  console.log("\n👥 TESTE: Entrar em jogos");
  console.log("-".repeat(25));

  let passed = true;

  // Preparar cenário
  const creator = createMockUser("creator", "Criador");
  const joiner = createMockUser("joiner", "Participante");
  const intruder = createMockUser("intruder", "Intruso");

  // Criar jogo multiplayer
  const game = GameState.createGame(3, creator, "multiplayer", 1);
  console.log(`🎮 Jogo criado: ID ${game.id} por ${creator.name}`);

  // Teste 1: Segundo jogador entra com sucesso
  const joinResult1 = GameState.joinGame(game.id, joiner);

  if (!joinResult1) {
    console.log(`❌ ERRO: Segundo jogador não conseguiu entrar no jogo`);
    passed = false;
  } else {
    console.log(`✅ ${joiner.name} entrou no jogo ${game.id}`);

    if (game.player2.id !== joiner.id) {
      console.log(`❌ ERRO: Player2 não foi definido corretamente`);
      passed = false;
    }
  }

  // Teste 2: Terceiro jogador não pode entrar (jogo cheio)
  const joinResult2 = GameState.joinGame(game.id, intruder);

  if (joinResult2 !== null) {
    console.log(`❌ ERRO: Terceiro jogador conseguiu entrar em jogo cheio`);
    passed = false;
  } else {
    console.log(`✅ Terceiro jogador bloqueado corretamente`);
  }

  // Teste 3: Criador não pode entrar novamente
  const joinResult3 = GameState.joinGame(game.id, creator);

  if (joinResult3 !== null) {
    console.log(`❌ ERRO: Criador conseguiu entrar novamente no próprio jogo`);
    passed = false;
  } else {
    console.log(`✅ Criador bloqueado de entrar novamente`);
  }

  // Teste 4: Entrar em jogo inexistente
  const joinResult4 = GameState.joinGame(99999, joiner);

  if (joinResult4 !== null) {
    console.log(`❌ ERRO: Conseguiu entrar em jogo inexistente`);
    passed = false;
  } else {
    console.log(`✅ Entrada em jogo inexistente bloqueada`);
  }

  return passed;
}

function testGetGames() {
  console.log("\n📋 TESTE: Listar jogos disponíveis");
  console.log("-".repeat(35));

  let passed = true;

  // Limpar jogos existentes (se possível)
  const initialGames = GameState.getGames();
  console.log(`🎮 Jogos iniciais na lista: ${initialGames.length}`);

  // Criar diferentes tipos de jogos
  const user1 = createMockUser("list-user-1", "Listador1");
  const user2 = createMockUser("list-user-2", "Listador2");
  const user3 = createMockUser("list-user-3", "Listador3");

  // Jogo singleplayer (não deve aparecer na lista)
  const singleGame = GameState.createGame(3, user1, "singleplayer", 1);
  console.log(`🎮 Jogo singleplayer criado: ${singleGame.id}`);

  // Jogo multiplayer aberto (deve aparecer)
  const multiGame = GameState.createGame(9, user2, "multiplayer", 4);
  console.log(`🎮 Jogo multiplayer criado: ${multiGame.id}`);

  // Jogo multiplayer cheio (não deve aparecer)
  const fullGame = GameState.createGame(3, user3, "multiplayer", 1);
  GameState.joinGame(fullGame.id, user1); // Preencher com segundo jogador
  console.log(`🎮 Jogo multiplayer cheio: ${fullGame.id}`);

  // Verificar lista
  const gamesList = GameState.getGames();
  console.log(`📋 Jogos listados: ${gamesList.length}`);

  // Deve conter apenas o jogo multiplayer aberto
  const expectedCount = initialGames.length + 1; // +1 para o multiGame aberto
  if (gamesList.length !== expectedCount) {
    console.log(`❌ ERRO: Número incorreto de jogos na lista`);
    console.log(`   Esperado: ${expectedCount}, Obtido: ${gamesList.length}`);
    passed = false;
  }

  // Verificar se o jogo correto está na lista
  const multiGameInList = gamesList.find((g) => g.id === multiGame.id);
  if (!multiGameInList) {
    console.log(`❌ ERRO: Jogo multiplayer aberto não está na lista`);
    passed = false;
  } else {
    console.log(`✅ Jogo multiplayer encontrado na lista`);

    if (multiGameInList.creator !== user2.name) {
      console.log(`❌ ERRO: Nome do criador incorreto na lista`);
      passed = false;
    }

    if (multiGameInList.winsNeeded !== 4) {
      console.log(`❌ ERRO: Meta de vitórias incorreta na lista`);
      passed = false;
    }

    if (multiGameInList.type !== "9 Cartas") {
      console.log(`❌ ERRO: Tipo de jogo incorreto na lista`);
      passed = false;
    }
  }

  // Verificar se jogos que não deveriam estar não estão
  const singleGameInList = gamesList.find((g) => g.id === singleGame.id);
  const fullGameInList = gamesList.find((g) => g.id === fullGame.id);

  if (singleGameInList) {
    console.log(`❌ ERRO: Jogo singleplayer apareceu na lista multiplayer`);
    passed = false;
  } else {
    console.log(`✅ Jogo singleplayer corretamente excluído da lista`);
  }

  if (fullGameInList) {
    console.log(`❌ ERRO: Jogo cheio apareceu na lista de disponíveis`);
    passed = false;
  } else {
    console.log(`✅ Jogo cheio corretamente excluído da lista`);
  }

  return passed;
}

function testGetGame() {
  console.log("\n🔍 TESTE: Recuperar jogo específico");
  console.log("-".repeat(35));

  let passed = true;

  // Criar jogo de teste
  const user = createMockUser("get-user", "GetUser");
  const game = GameState.createGame(3, user, "singleplayer", 1);
  console.log(`🎮 Jogo criado para teste: ID ${game.id}`);

  // Teste 1: Recuperar jogo existente
  const retrievedGame = GameState.getGame(game.id);

  if (!retrievedGame) {
    console.log(`❌ ERRO: Não conseguiu recuperar jogo existente`);
    passed = false;
  } else {
    console.log(`✅ Jogo recuperado com sucesso`);

    if (retrievedGame.id !== game.id) {
      console.log(`❌ ERRO: ID do jogo recuperado não confere`);
      passed = false;
    }

    if (retrievedGame.player1.id !== user.id) {
      console.log(`❌ ERRO: Dados do jogo recuperado não conferem`);
      passed = false;
    }
  }

  // Teste 2: Tentar recuperar jogo inexistente
  const nonExistent = GameState.getGame(99999);

  if (nonExistent !== undefined) {
    console.log(`❌ ERRO: Recuperou jogo inexistente`);
    passed = false;
  } else {
    console.log(`✅ Busca por jogo inexistente retornou undefined`);
  }

  return passed;
}

function testRemoveGame() {
  console.log("\n🗑️ TESTE: Remover jogos");
  console.log("-".repeat(20));

  let passed = true;

  // Criar jogo para remoção
  const user = createMockUser("remove-user", "RemoveUser");
  const game = GameState.createGame(3, user, "singleplayer", 1);
  const gameId = game.id;
  console.log(`🎮 Jogo criado para remoção: ID ${gameId}`);

  // Verificar que existe
  const gameBeforeRemoval = GameState.getGame(gameId);
  if (!gameBeforeRemoval) {
    console.log(`❌ ERRO: Jogo não foi encontrado antes da remoção`);
    passed = false;
  }

  // Remover jogo
  GameState.removeGame(gameId);
  console.log(`🗑️ Jogo ${gameId} removido`);

  // Verificar que não existe mais
  const gameAfterRemoval = GameState.getGame(gameId);
  if (gameAfterRemoval !== undefined) {
    console.log(`❌ ERRO: Jogo ainda existe após remoção`);
    passed = false;
  } else {
    console.log(`✅ Jogo removido com sucesso`);
  }

  // Tentar remover jogo inexistente (não deve dar erro)
  try {
    GameState.removeGame(99999);
    console.log(`✅ Remoção de jogo inexistente não causou erro`);
  } catch (error) {
    console.log(
      `❌ ERRO: Remoção de jogo inexistente causou exceção: ${error.message}`,
    );
    passed = false;
  }

  return passed;
}

function testHandlePlayerMove() {
  console.log("\n🎯 TESTE: Processar jogadas");
  console.log("-".repeat(30));

  let passed = true;

  // Preparar cenário
  const player1 = createMockUser("move-p1", "MovePlayer1");
  const player2 = createMockUser("move-p2", "MovePlayer2");
  const outsider = createMockUser("outsider", "Outsider");

  // Adicionar usuários ao sistema de conexões
  const socket1 = createMockSocket("socket-move-1");
  const socket2 = createMockSocket("socket-move-2");
  const socketOutsider = createMockSocket("socket-outsider");

  ConnectionState.addUser(socket1, player1);
  ConnectionState.addUser(socket2, player2);
  ConnectionState.addUser(socketOutsider, outsider);

  // Criar jogo multiplayer
  const game = GameState.createGame(3, player1, "multiplayer", 1);
  GameState.joinGame(game.id, player2);
  console.log(`🎮 Jogo multiplayer preparado: ID ${game.id}`);

  // Teste 1: Jogada válida do player1
  const result1 = GameState.handlePlayerMove(game.id, 0, socket1.id);

  if (!result1) {
    console.log(`❌ ERRO: Jogada válida retornou null`);
    passed = false;
  } else {
    console.log(`✅ Jogada processada: válida=${result1.moveValid}`);

    if (!result1.game) {
      console.log(`❌ ERRO: Resultado não contém objeto do jogo`);
      passed = false;
    }
  }

  // Teste 2: Jogador não autorizado tenta jogar
  const result2 = GameState.handlePlayerMove(game.id, 0, socketOutsider.id);

  if (result2 !== null) {
    console.log(`❌ ERRO: Jogador não autorizado conseguiu fazer jogada`);
    passed = false;
  } else {
    console.log(`✅ Jogador não autorizado bloqueado corretamente`);
  }

  // Teste 3: Jogada em jogo inexistente
  const result3 = GameState.handlePlayerMove(99999, 0, socket1.id);

  if (result3 !== null) {
    console.log(`❌ ERRO: Jogada em jogo inexistente não foi bloqueada`);
    passed = false;
  } else {
    console.log(`✅ Jogada em jogo inexistente bloqueada`);
  }

  // Teste 4: Socket sem usuário associado
  const orphanSocket = createMockSocket("orphan-socket");
  const result4 = GameState.handlePlayerMove(game.id, 0, orphanSocket.id);

  if (result4 !== null) {
    console.log(`❌ ERRO: Socket órfão conseguiu fazer jogada`);
    passed = false;
  } else {
    console.log(`✅ Socket órfão bloqueado corretamente`);
  }

  // Limpar conexões de teste
  ConnectionState.removeUser(socket1.id);
  ConnectionState.removeUser(socket2.id);
  ConnectionState.removeUser(socketOutsider.id);

  return passed;
}

function testAdvanceGame() {
  console.log("\n⏭️ TESTE: Avanço automático do jogo");
  console.log("-".repeat(35));

  let passed = true;

  // Preparar cenário
  const player = createMockUser("advance-player", "AdvancePlayer");
  const socket = createMockSocket("socket-advance");
  const mockIO = createMockIO();

  ConnectionState.addUser(socket, player);

  // Teste 1: Avanço em jogo singleplayer (com bot)
  const singleGame = GameState.createGame(3, player, "singleplayer", 1);
  console.log(`🎮 Jogo singleplayer criado: ID ${singleGame.id}`);

  try {
    GameState.advanceGame(singleGame.id, mockIO);
    console.log(`✅ Avanço de jogo singleplayer executado sem erro`);
  } catch (error) {
    console.log(`❌ ERRO: Avanço de jogo causou exceção: ${error.message}`);
    passed = false;
  }

  // Teste 2: Avanço em jogo inexistente
  try {
    GameState.advanceGame(99999, mockIO);
    console.log(`✅ Avanço em jogo inexistente não causou erro`);
  } catch (error) {
    console.log(
      `❌ ERRO: Avanço em jogo inexistente causou exceção: ${error.message}`,
    );
    passed = false;
  }

  // Limpar
  ConnectionState.removeUser(socket.id);

  return passed;
}

function testGameStateConsistency() {
  console.log("\n🔄 TESTE: Consistência do estado");
  console.log("-".repeat(30));

  let passed = true;

  // Criar múltiplos jogos e verificar consistência
  const users = [];
  const games = [];

  for (let i = 0; i < 5; i++) {
    const user = createMockUser(`consistency-user-${i}`, `ConsistencyUser${i}`);
    users.push(user);

    const game = GameState.createGame(3, user, "singleplayer", 1);
    games.push(game);
  }

  console.log(`🎮 Criados ${games.length} jogos para teste de consistência`);

  // Verificar que todos os jogos têm IDs únicos
  const gameIds = games.map((g) => g.id);
  const uniqueIds = new Set(gameIds);

  if (uniqueIds.size !== games.length) {
    console.log(`❌ ERRO: IDs de jogos não são únicos`);
    console.log(`   Total: ${games.length}, Únicos: ${uniqueIds.size}`);
    passed = false;
  } else {
    console.log(`✅ Todos os IDs são únicos`);
  }

  // Verificar que todos os jogos podem ser recuperados
  let allRetrievable = true;
  games.forEach((game) => {
    const retrieved = GameState.getGame(game.id);
    if (!retrieved || retrieved.id !== game.id) {
      allRetrievable = false;
      console.log(`❌ ERRO: Jogo ${game.id} não pode ser recuperado`);
    }
  });

  if (allRetrievable) {
    console.log(`✅ Todos os jogos podem ser recuperados`);
  } else {
    passed = false;
  }

  // Remover jogos um por um e verificar que os outros ainda existem
  for (let i = 0; i < games.length; i++) {
    const gameToRemove = games[i];
    GameState.removeGame(gameToRemove.id);

    // Verificar que foi removido
    const removed = GameState.getGame(gameToRemove.id);
    if (removed !== undefined) {
      console.log(`❌ ERRO: Jogo ${gameToRemove.id} não foi removido`);
      passed = false;
    }

    // Verificar que os outros ainda existem
    for (let j = i + 1; j < games.length; j++) {
      const shouldStillExist = GameState.getGame(games[j].id);
      if (!shouldStillExist) {
        console.log(`❌ ERRO: Jogo ${games[j].id} foi removido indevidamente`);
        passed = false;
      }
    }
  }

  if (passed) {
    console.log(`✅ Consistência mantida durante operações`);
  }

  return passed;
}

function runAllTests() {
  console.log("Iniciando bateria de testes de estado do jogo...\n");

  const results = {
    createGame: testCreateGame(),
    joinGame: testJoinGame(),
    getGames: testGetGames(),
    getGame: testGetGame(),
    removeGame: testRemoveGame(),
    handlePlayerMove: testHandlePlayerMove(),
    advanceGame: testAdvanceGame(),
    consistency: testGameStateConsistency(),
  };

  console.log("\n" + "=".repeat(50));
  console.log("📋 RESUMO DOS TESTES DE ESTADO DO JOGO");
  console.log("=".repeat(50));
  console.log(
    `🎮 Criar jogos:           ${results.createGame ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `👥 Entrar em jogos:       ${results.joinGame ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `📋 Listar jogos:          ${results.getGames ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🔍 Recuperar jogo:        ${results.getGame ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🗑️ Remover jogos:         ${results.removeGame ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🎯 Processar jogadas:     ${results.handlePlayerMove ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `⏭️ Avanço automático:     ${results.advanceGame ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🔄 Consistência:          ${results.consistency ? "✅ PASSOU" : "❌ FALHOU"}`,
  );

  const allPassed = Object.values(results).every((result) => result === true);
  console.log(
    `\n🏆 RESULTADO FINAL: ${allPassed ? "✅ TODOS OS TESTES PASSARAM" : "❌ ALGUNS TESTES FALHARAM"}`,
  );

  if (allPassed) {
    console.log("\n🎉 Sistema de estado do jogo funciona corretamente:");
    console.log("   • Criação de jogos singleplayer e multiplayer");
    console.log("   • Sistema de entrada em jogos");
    console.log("   • Listagem de jogos disponíveis");
    console.log("   • Recuperação e remoção de jogos");
    console.log("   • Processamento de jogadas");
    console.log("   • Avanço automático do jogo");
    console.log("   • Consistência do estado");
  }

  process.exit(allPassed ? 0 : 1);
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };
