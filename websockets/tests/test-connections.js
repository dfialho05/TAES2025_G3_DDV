#!/usr/bin/env node
// test-connections.js
import * as ConnectionState from "../state/connections.js";

console.log("🧪 TESTES UNITÁRIOS: Estado de Conexões");
console.log("=".repeat(50));

// Mock socket object
function createMockSocket(id) {
  return {
    id: id,
    emit: function () {},
    on: function () {},
    join: function () {},
    leave: function () {},
  };
}

// Mock user object
function createMockUser(id, name) {
  return {
    id: id,
    name: name,
  };
}

function testAddUser() {
  console.log("\n📥 TESTE: Adicionar usuários");
  console.log("-".repeat(30));

  let passed = true;

  // Limpar estado inicial (se houver)
  const initialCount = ConnectionState.getUserCount();
  console.log(`👥 Usuários iniciais: ${initialCount}`);

  // Teste 1: Adicionar primeiro usuário
  const socket1 = createMockSocket("socket-123");
  const user1 = createMockUser("user-1", "João");

  ConnectionState.addUser(socket1, user1);
  const countAfterAdd1 = ConnectionState.getUserCount();

  console.log(`✅ Adicionado usuário: ${user1.name} (ID: ${user1.id})`);
  console.log(`👥 Contagem após adição: ${countAfterAdd1}`);

  if (countAfterAdd1 !== initialCount + 1) {
    console.log(
      `❌ ERRO: Esperava ${initialCount + 1} usuários, mas tem ${countAfterAdd1}`,
    );
    passed = false;
  }

  // Teste 2: Verificar se o usuário foi armazenado corretamente
  const retrievedUser = ConnectionState.getUser(socket1.id);
  if (
    !retrievedUser ||
    retrievedUser.id !== user1.id ||
    retrievedUser.name !== user1.name
  ) {
    console.log(`❌ ERRO: Usuário não foi armazenado corretamente`);
    console.log(`   Esperado: ${JSON.stringify(user1)}`);
    console.log(`   Obtido: ${JSON.stringify(retrievedUser)}`);
    passed = false;
  } else {
    console.log(`✅ Usuário recuperado corretamente`);
  }

  // Teste 3: Adicionar segundo usuário
  const socket2 = createMockSocket("socket-456");
  const user2 = createMockUser("user-2", "Maria");

  ConnectionState.addUser(socket2, user2);
  const countAfterAdd2 = ConnectionState.getUserCount();

  console.log(`✅ Adicionado usuário: ${user2.name} (ID: ${user2.id})`);
  console.log(`👥 Contagem final: ${countAfterAdd2}`);

  if (countAfterAdd2 !== initialCount + 2) {
    console.log(
      `❌ ERRO: Esperava ${initialCount + 2} usuários, mas tem ${countAfterAdd2}`,
    );
    passed = false;
  }

  return passed;
}

function testRemoveUser() {
  console.log("\n📤 TESTE: Remover usuários");
  console.log("-".repeat(30));

  let passed = true;

  // Preparar estado inicial
  const socket1 = createMockSocket("socket-remove-1");
  const user1 = createMockUser("user-rem-1", "Pedro");
  const socket2 = createMockSocket("socket-remove-2");
  const user2 = createMockUser("user-rem-2", "Ana");

  ConnectionState.addUser(socket1, user1);
  ConnectionState.addUser(socket2, user2);
  const initialCount = ConnectionState.getUserCount();

  console.log(`👥 Estado inicial: ${initialCount} usuários`);

  // Teste 1: Remover usuário existente
  const removedUser1 = ConnectionState.removeUser(socket1.id);
  const countAfterRemove1 = ConnectionState.getUserCount();

  if (!removedUser1 || removedUser1.id !== user1.id) {
    console.log(`❌ ERRO: Usuário removido não corresponde ao esperado`);
    console.log(`   Esperado: ${JSON.stringify(user1)}`);
    console.log(`   Obtido: ${JSON.stringify(removedUser1)}`);
    passed = false;
  } else {
    console.log(`✅ Usuário ${removedUser1.name} removido corretamente`);
  }

  if (countAfterRemove1 !== initialCount - 1) {
    console.log(`❌ ERRO: Contagem após remoção incorreta`);
    console.log(
      `   Esperado: ${initialCount - 1}, Obtido: ${countAfterRemove1}`,
    );
    passed = false;
  } else {
    console.log(`✅ Contagem atualizada: ${countAfterRemove1}`);
  }

  // Teste 2: Tentar recuperar usuário removido
  const shouldBeNull = ConnectionState.getUser(socket1.id);
  if (shouldBeNull !== undefined) {
    console.log(`❌ ERRO: Usuário removido ainda está acessível`);
    passed = false;
  } else {
    console.log(`✅ Usuário removido não está mais acessível`);
  }

  // Teste 3: Remover usuário inexistente
  const removedNonExistent = ConnectionState.removeUser("socket-inexistente");
  if (removedNonExistent !== null) {
    console.log(
      `❌ ERRO: Remoção de usuário inexistente deveria retornar null`,
    );
    passed = false;
  } else {
    console.log(`✅ Remoção de usuário inexistente retornou null corretamente`);
  }

  // Teste 4: Verificar que o segundo usuário ainda está lá
  const remainingUser = ConnectionState.getUser(socket2.id);
  if (!remainingUser || remainingUser.id !== user2.id) {
    console.log(`❌ ERRO: Usuário remanescente foi afetado incorretamente`);
    passed = false;
  } else {
    console.log(`✅ Usuário remanescente ainda está presente`);
  }

  return passed;
}

function testGetUser() {
  console.log("\n🔍 TESTE: Recuperar usuários");
  console.log("-".repeat(30));

  let passed = true;

  // Preparar estado
  const socket = createMockSocket("socket-get-test");
  const user = createMockUser("user-get-test", "Carlos");

  // Teste 1: Buscar usuário inexistente
  const nonExistentUser = ConnectionState.getUser("socket-inexistente");
  if (nonExistentUser !== undefined) {
    console.log(
      `❌ ERRO: Busca por usuário inexistente deveria retornar undefined`,
    );
    console.log(`   Obtido: ${JSON.stringify(nonExistentUser)}`);
    passed = false;
  } else {
    console.log(`✅ Busca por usuário inexistente retornou undefined`);
  }

  // Teste 2: Adicionar e buscar usuário
  ConnectionState.addUser(socket, user);
  const foundUser = ConnectionState.getUser(socket.id);

  if (!foundUser) {
    console.log(`❌ ERRO: Usuário adicionado não foi encontrado`);
    passed = false;
  } else if (foundUser.id !== user.id || foundUser.name !== user.name) {
    console.log(`❌ ERRO: Dados do usuário encontrado não correspondem`);
    console.log(`   Esperado: ${JSON.stringify(user)}`);
    console.log(`   Obtido: ${JSON.stringify(foundUser)}`);
    passed = false;
  } else {
    console.log(`✅ Usuário encontrado corretamente: ${foundUser.name}`);
  }

  return passed;
}

function testGetUserCount() {
  console.log("\n🔢 TESTE: Contagem de usuários");
  console.log("-".repeat(30));

  let passed = true;

  // Nota: Este teste assume que outros testes podem ter deixado usuários
  const initialCount = ConnectionState.getUserCount();
  console.log(`👥 Contagem inicial: ${initialCount}`);

  // Adicionar usuários para testar
  const testUsers = [
    {
      socket: createMockSocket("count-test-1"),
      user: createMockUser("count-user-1", "User1"),
    },
    {
      socket: createMockSocket("count-test-2"),
      user: createMockUser("count-user-2", "User2"),
    },
    {
      socket: createMockSocket("count-test-3"),
      user: createMockUser("count-user-3", "User3"),
    },
  ];

  // Adicionar usuários um por um e verificar contagem
  testUsers.forEach((testUser, index) => {
    ConnectionState.addUser(testUser.socket, testUser.user);
    const expectedCount = initialCount + index + 1;
    const actualCount = ConnectionState.getUserCount();

    console.log(
      `➕ Adicionado ${testUser.user.name} - Contagem: ${actualCount}`,
    );

    if (actualCount !== expectedCount) {
      console.log(`❌ ERRO: Contagem incorreta após adição ${index + 1}`);
      console.log(`   Esperado: ${expectedCount}, Obtido: ${actualCount}`);
      passed = false;
    }
  });

  // Remover usuários um por um e verificar contagem
  testUsers.forEach((testUser, index) => {
    ConnectionState.removeUser(testUser.socket.id);
    const expectedCount = initialCount + testUsers.length - index - 1;
    const actualCount = ConnectionState.getUserCount();

    console.log(`➖ Removido ${testUser.user.name} - Contagem: ${actualCount}`);

    if (actualCount !== expectedCount) {
      console.log(`❌ ERRO: Contagem incorreta após remoção ${index + 1}`);
      console.log(`   Esperado: ${expectedCount}, Obtido: ${actualCount}`);
      passed = false;
    }
  });

  if (passed) {
    console.log(`✅ Contagem funcionando corretamente`);
  }

  return passed;
}

function testConcurrentOperations() {
  console.log("\n🔄 TESTE: Operações concorrentes");
  console.log("-".repeat(35));

  let passed = true;

  // Simular múltiplas operações simultâneas
  const operations = [];
  const sockets = [];
  const users = [];

  // Criar múltiplos usuários
  for (let i = 0; i < 10; i++) {
    const socket = createMockSocket(`concurrent-socket-${i}`);
    const user = createMockUser(`concurrent-user-${i}`, `ConcurrentUser${i}`);
    sockets.push(socket);
    users.push(user);
  }

  const initialCount = ConnectionState.getUserCount();

  // Adicionar todos
  sockets.forEach((socket, i) => {
    ConnectionState.addUser(socket, users[i]);
  });

  const countAfterAdds = ConnectionState.getUserCount();
  console.log(`➕ Adicionados 10 usuários - Contagem: ${countAfterAdds}`);

  if (countAfterAdds !== initialCount + 10) {
    console.log(`❌ ERRO: Contagem após adições múltiplas incorreta`);
    console.log(`   Esperado: ${initialCount + 10}, Obtido: ${countAfterAdds}`);
    passed = false;
  }

  // Verificar se todos foram adicionados corretamente
  let allFound = true;
  sockets.forEach((socket, i) => {
    const foundUser = ConnectionState.getUser(socket.id);
    if (!foundUser || foundUser.id !== users[i].id) {
      allFound = false;
      console.log(`❌ ERRO: Usuário ${i} não encontrado ou incorreto`);
    }
  });

  if (allFound) {
    console.log(`✅ Todos os usuários encontrados corretamente`);
  } else {
    passed = false;
  }

  // Remover metade
  const toRemove = sockets.slice(0, 5);
  toRemove.forEach((socket) => {
    ConnectionState.removeUser(socket.id);
  });

  const countAfterRemovals = ConnectionState.getUserCount();
  console.log(`➖ Removidos 5 usuários - Contagem: ${countAfterRemovals}`);

  if (countAfterRemovals !== initialCount + 5) {
    console.log(`❌ ERRO: Contagem após remoções parciais incorreta`);
    console.log(
      `   Esperado: ${initialCount + 5}, Obtido: ${countAfterRemovals}`,
    );
    passed = false;
  }

  // Verificar que os removidos não existem e os restantes existem
  toRemove.forEach((socket, i) => {
    const shouldNotExist = ConnectionState.getUser(socket.id);
    if (shouldNotExist !== undefined) {
      console.log(`❌ ERRO: Usuário ${i} deveria ter sido removido`);
      passed = false;
    }
  });

  const remaining = sockets.slice(5);
  remaining.forEach((socket, i) => {
    const shouldExist = ConnectionState.getUser(socket.id);
    if (!shouldExist) {
      console.log(`❌ ERRO: Usuário remanescente ${i + 5} não encontrado`);
      passed = false;
    }
  });

  if (passed) {
    console.log(`✅ Operações concorrentes funcionando corretamente`);
  }

  // Limpar usuários de teste restantes
  remaining.forEach((socket) => {
    ConnectionState.removeUser(socket.id);
  });

  return passed;
}

function testEdgeCases() {
  console.log("\n🔍 TESTE: Casos extremos");
  console.log("-".repeat(25));

  let passed = true;

  // Teste 1: Socket com ID vazio
  console.log(`🧪 Testando socket com ID vazio...`);
  try {
    const emptySocket = createMockSocket("");
    const user = createMockUser("edge-user-1", "EdgeUser");
    ConnectionState.addUser(emptySocket, user);

    const retrieved = ConnectionState.getUser("");
    if (!retrieved) {
      console.log(`❌ ERRO: Usuário com socket ID vazio não foi armazenado`);
      passed = false;
    } else {
      console.log(`✅ Socket com ID vazio funciona`);
      ConnectionState.removeUser(""); // Limpar
    }
  } catch (error) {
    console.log(
      `❌ ERRO: Exceção ao usar socket com ID vazio: ${error.message}`,
    );
    passed = false;
  }

  // Teste 2: Usuário com dados null/undefined
  console.log(`🧪 Testando usuário com dados null...`);
  try {
    const socket = createMockSocket("edge-socket-null");
    ConnectionState.addUser(socket, null);

    const retrieved = ConnectionState.getUser(socket.id);
    if (retrieved !== null) {
      console.log(`❌ ERRO: Usuário null não foi armazenado corretamente`);
      passed = false;
    } else {
      console.log(`✅ Usuário null armazenado corretamente`);
    }
    ConnectionState.removeUser(socket.id); // Limpar
  } catch (error) {
    console.log(`❌ ERRO: Exceção ao usar usuário null: ${error.message}`);
    passed = false;
  }

  // Teste 3: Sobrescrever usuário existente
  console.log(`🧪 Testando sobrescrita de usuário...`);
  const socket = createMockSocket("edge-socket-overwrite");
  const user1 = createMockUser("edge-user-orig", "OriginalUser");
  const user2 = createMockUser("edge-user-new", "NewUser");

  ConnectionState.addUser(socket, user1);
  const countBefore = ConnectionState.getUserCount();

  ConnectionState.addUser(socket, user2); // Mesmo socket, usuário diferente
  const countAfter = ConnectionState.getUserCount();

  const retrieved = ConnectionState.getUser(socket.id);

  if (countAfter !== countBefore) {
    console.log(
      `❌ ERRO: Contagem mudou na sobrescrita (${countBefore} → ${countAfter})`,
    );
    passed = false;
  } else if (!retrieved || retrieved.id !== user2.id) {
    console.log(`❌ ERRO: Usuário não foi sobrescrito corretamente`);
    console.log(`   Esperado: ${JSON.stringify(user2)}`);
    console.log(`   Obtido: ${JSON.stringify(retrieved)}`);
    passed = false;
  } else {
    console.log(`✅ Sobrescrita funcionou corretamente`);
  }

  ConnectionState.removeUser(socket.id); // Limpar

  return passed;
}

function runAllTests() {
  console.log("Iniciando bateria de testes de conexões...\n");

  const results = {
    addUser: testAddUser(),
    removeUser: testRemoveUser(),
    getUser: testGetUser(),
    getUserCount: testGetUserCount(),
    concurrent: testConcurrentOperations(),
    edgeCases: testEdgeCases(),
  };

  console.log("\n" + "=".repeat(50));
  console.log("📋 RESUMO DOS TESTES DE CONEXÕES");
  console.log("=".repeat(50));
  console.log(
    `📥 Adicionar usuários:     ${results.addUser ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `📤 Remover usuários:       ${results.removeUser ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🔍 Recuperar usuários:     ${results.getUser ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🔢 Contagem de usuários:   ${results.getUserCount ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🔄 Operações concorrentes: ${results.concurrent ? "✅ PASSOU" : "❌ FALHOU"}`,
  );
  console.log(
    `🔍 Casos extremos:         ${results.edgeCases ? "✅ PASSOU" : "❌ FALHOU"}`,
  );

  const allPassed = Object.values(results).every((result) => result === true);
  console.log(
    `\n🏆 RESULTADO FINAL: ${allPassed ? "✅ TODOS OS TESTES PASSARAM" : "❌ ALGUNS TESTES FALHARAM"}`,
  );

  if (allPassed) {
    console.log("\n🎉 Sistema de conexões funciona corretamente:");
    console.log("   • Adição de usuários");
    console.log("   • Remoção de usuários");
    console.log("   • Recuperação de usuários");
    console.log("   • Contagem precisa");
    console.log("   • Operações concorrentes");
    console.log("   • Casos extremos");
  }

  process.exit(allPassed ? 0 : 1);
}

// Se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };
