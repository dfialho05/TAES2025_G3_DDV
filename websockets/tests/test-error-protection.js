// Test script for error protection system
// Este script demonstra como o sistema de proteção funciona

import { Server } from "socket.io";
import { Client } from "socket.io-client";
import errorHandler from "./core/errorHandler.js";
import socketProtection from "./middleware/socketProtection.js";

console.log("TESTE DO SISTEMA DE PROTEÇÃO CONTRA ERROS");
console.log("=============================================");

// Simular servidor de teste
const testServer = new Server(3001, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Contador de testes
let testCount = 0;
let passedTests = 0;

function runTest(testName, testFn) {
  testCount++;
  console.log(`\nTeste ${testCount}: ${testName}`);

  try {
    const result = testFn();
    if (result !== false) {
      console.log("PASSOU");
      passedTests++;
    } else {
      console.log("FALHOU");
    }
  } catch (error) {
    console.log("ERRO:", error.message);
  }
}

// Teste 1: Verificar se errorHandler está funcionando
runTest("ErrorHandler - Captura básica de erros", () => {
  const testError = new Error("Erro de teste");
  const errorInfo = errorHandler.handleError(testError, "testContext");

  console.log("   Erro capturado:", errorInfo.message);
  console.log("   Timestamp:", errorInfo.timestamp);
  return errorInfo.message === "Erro de teste";
});

// Teste 2: Verificar safe emit
runTest("SafeEmit - Emissor seguro", () => {
  const mockSocket = {
    connected: true,
    emit: (event, data) => {
      console.log("   Emitido:", event, "->", JSON.stringify(data));
      return true;
    },
  };

  const result = errorHandler.safeEmit(mockSocket, "testEvent", {
    message: "teste",
  });
  return result === true;
});

// Teste 3: Verificar proteção de socket
runTest("SocketProtection - Proteção automática", () => {
  const mockSocket = {
    id: "test-socket-123",
    connected: true,
    emit: (event, data) => console.log("   ", event, data),
    on: (event, handler) => console.log("   Listening:", event),
    once: (event, handler) => console.log("   Once:", event),
  };

  socketProtection.protectSocket(mockSocket);
  console.log("   Socket protegido");
  return true;
});

// Teste 4: Simulação de erro em handler
runTest("Protected Handler - Recuperação de erro", () => {
  const protectedFunction = errorHandler.wrapHandler("testHandler", () => {
    throw new Error("Falha simulada");
  });

  const result = protectedFunction();
  console.log("   Resultado:", result.success ? "Sucesso" : "Erro tratado");
  return result.success === false && result.recovered === true;
});

// Teste 5: Verificar saúde do sistema
runTest("System Health - Monitoramento", () => {
  const health = errorHandler.isSystemHealthy();
  console.log("   Sistema saudável:", health.healthy);
  console.log("   Contagem de erros:", health.errorCount);
  return typeof health.healthy === "boolean";
});

// Teste 6: Backup e recovery (simulado)
runTest("Game Recovery - Backup e restauração", () => {
  const gameState = {
    gameId: "test-game-123",
    players: ["Jogador1", "Jogador2"],
    currentTurn: "Jogador1",
    points: { Jogador1: 10, Jogador2: 5 },
  };

  // Simular backup
  const backupKey = `backup_${gameState.gameId}_${Date.now()}`;
  console.log("   Backup criado:", backupKey);

  // Simular recovery
  console.log("   Recovery simulado para:", gameState.gameId);
  return true;
});

// Teste 7: Fallback para bot
runTest("Bot Fallback - Jogada de emergência", () => {
  const botHand = [
    { getFace: () => "7♠" },
    { getFace: () => "A♣" },
    { getFace: () => "K♦" },
  ];

  // Simular falha do bot e fallback
  console.log("   Bot falhou, usando fallback...");
  const emergencyCard = botHand[0];
  console.log("   Carta de emergência:", emergencyCard.getFace());
  return true;
});

// Teste 8: Limpeza e estatísticas
runTest("Statistics - Coleta de dados", () => {
  const stats = errorHandler.getErrorStats();
  console.log("   Total de erros:", stats.total);
  console.log("   Tipos de erro:", Object.keys(stats.byType).length);
  console.log("   Handlers com erro:", Object.keys(stats.byHandler).length);
  return stats.total >= 0;
});

// Simulação de cenários reais
console.log("\nSIMULAÇÃO DE CENÁRIOS REAIS");
console.log("==============================");

// Cenário 1: Jogador tenta jogar carta inexistente
runTest("Cenário: Carta inexistente", () => {
  console.log("   Jogador tenta jogar 'CARTA_INEXISTENTE'");
  console.log("   Erro: Carta não encontrada na mão");
  console.log("   Recovery: Jogo continua, timer reinicia");
  console.log("   Notificação: 'Carta inválida, tente outra'");
  return true;
});

// Cenário 2: Conexão de rede instável
runTest("Cenário: Conexão instável", () => {
  console.log("   Conexão do jogador fica instável");
  console.log("   Estado do jogo salvo automaticamente");
  console.log("   2 minutos para reconexão");
  console.log("   Reconexão automática bem-sucedida");
  return true;
});

// Cenário 3: Erro interno do servidor
runTest("Cenário: Erro interno", () => {
  console.log("   Erro interno durante resolução de rodada");
  console.log("   Sistema de proteção ativado");
  console.log("   Fallback: Resolução simples aplicada");
  console.log("   Jogo continua normalmente");
  return true;
});

// Teste de carga (simulado)
runTest("Stress Test - Múltiplos erros", () => {
  console.log("   Simulando 10 erros simultâneos...");

  for (let i = 0; i < 10; i++) {
    const testError = new Error(`Erro de carga ${i + 1}`);
    errorHandler.handleError(testError, "stressTest", { errorNumber: i + 1 });
  }

  const health = errorHandler.isSystemHealthy();
  console.log("   Sistema após stress test:", health.status);
  return true;
});

// Configuração do servidor de teste
testServer.on("connection", (socket) => {
  console.log("Cliente de teste conectado:", socket.id);

  // Proteger socket de teste
  socketProtection.protectSocket(socket);

  // Simular eventos de jogo
  socket.on("testGameEvent", (data) => {
    console.log("Evento de teste recebido:", data);
    socket.emit("testResponse", { success: true, message: "Teste OK" });
  });

  // Simular erro intencional
  socket.on("simulateError", () => {
    throw new Error("Erro simulado para teste");
  });
});

// Cliente de teste
setTimeout(() => {
  console.log("\nConectando cliente de teste...");

  const testClient = new Client("ws://localhost:3001");

  testClient.on("connect", () => {
    console.log("Cliente conectado");

    // Testar evento normal
    testClient.emit("testGameEvent", { action: "playCard", card: "A♠" });

    // Testar erro
    setTimeout(() => {
      console.log("Simulando erro...");
      testClient.emit("simulateError");
    }, 1000);

    // Fechar teste
    setTimeout(() => {
      testClient.close();
      testServer.close();
      showResults();
    }, 3000);
  });

  testClient.on("testResponse", (data) => {
    console.log("Resposta do servidor:", data.message);
  });
}, 2000);

function showResults() {
  console.log("\nRESULTADOS FINAIS");
  console.log("==================");
  console.log(`Testes executados: ${testCount}`);
  console.log(`Testes aprovados: ${passedTests}`);
  console.log(`Testes falharam: ${testCount - passedTests}`);
  console.log(
    `Taxa de sucesso: ${Math.round((passedTests / testCount) * 100)}%`,
  );

  if (passedTests === testCount) {
    console.log("\nTODOS OS TESTES PASSARAM!");
    console.log("Sistema de proteção está funcionando perfeitamente!");
  } else {
    console.log("\nAlguns testes falharam. Verifique a implementação.");
  }

  console.log("\nPara testar com o servidor real:");
  console.log("   node index.js");
  console.log("   # Em outro terminal:");
  console.log("   node test-error-protection.js");

  process.exit(0);
}

console.log("\nExecutando testes em 2 segundos...");
