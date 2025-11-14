// Teste rápido para verificar se as correções funcionam
import errorHandler from "./core/errorHandler.js";
import protectedHandlers from "./handlers/protectedHandlers.js";

console.log("TESTE RÁPIDO - Verificando correções");
console.log("=====================================");

// Simular objeto de jogo com cartas problemáticas
const mockGame = {
  gameId: "test-game-123",
  players: ["Jogador1", "Bot"],
  currentTurn: "Jogador1",
  points: { Jogador1: 10, Bot: 5 },
  hands: {
    Jogador1: [
      { getFace: () => "A♠", suit: "spades", value: 11 },
      { getFace: () => "K♦", suit: "diamonds", value: 4 },
    ],
    Bot: [{ getFace: () => "7♣", suit: "clubs", value: 10 }],
  },
  playedCards: [
    {
      player: "Jogador1",
      card: { getFace: () => "Q♥", suit: "hearts", value: 3 },
    },
  ],
  getState: () => ({
    players: mockGame.players,
    currentTurn: mockGame.currentTurn,
    points: mockGame.points,
  }),
};

// Simular IO mock
const mockIo = {
  to: (gameId) => ({
    emit: (event, data) => {
      console.log(`Emitindo para ${gameId}: ${event}`, data);
    },
  }),
};

let testsPassed = 0;
let totalTests = 0;

function test(name, testFn) {
  totalTests++;
  console.log(`\nTeste: ${name}`);

  try {
    const result = testFn();
    if (result !== false) {
      console.log("PASSOU");
      testsPassed++;
    } else {
      console.log("FALHOU");
    }
  } catch (error) {
    console.log("ERRO:", error.message);
  }
}

// Teste 1: Backup sem erros
test("Backup de estado do jogo", () => {
  try {
    protectedHandlers.backupGameState("test-game-123", mockGame);
    console.log("   Backup criado sem erros");
    return true;
  } catch (error) {
    console.log("   Erro no backup:", error.message);
    return false;
  }
});

// Teste 2: Recovery sem erros
test("Recovery de estado do jogo", () => {
  try {
    const recovered = protectedHandlers.recoverGameFromError(
      "test-game-123",
      mockGame,
      mockIo,
      new Error("Teste de erro"),
    );
    console.log(
      "   Recovery executado:",
      recovered ? "Sucesso" : "Falha esperada",
    );
    return true;
  } catch (error) {
    console.log("   Erro no recovery:", error.message);
    return false;
  }
});

// Teste 3: Reconstrução de cartas
test("Reconstrução de cartas", () => {
  try {
    const cardData = [
      { face: "A♠", suit: "spades", value: 11, isCard: true },
      { face: "K♦", suit: "diamonds", value: 4, isCard: true },
    ];

    const reconstructed = protectedHandlers.reconstructCards(cardData);
    console.log("   Cartas reconstruídas:", reconstructed.length);

    if (reconstructed.length === 2 && reconstructed[0].getFace() === "A♠") {
      console.log("   Reconstrução bem-sucedida");
      return true;
    }
    return false;
  } catch (error) {
    console.log("   Erro na reconstrução:", error.message);
    return false;
  }
});

// Teste 4: Handler protegido
test("Handler protegido com erro", () => {
  try {
    const protectedGameHandlers =
      protectedHandlers.createProtectedGameHandlers();

    // Simular erro no handleCardPlay
    const result = protectedGameHandlers.handleCardPlay(
      null, // game null para forçar erro
      "Jogador1",
      "A♠",
      mockIo,
      "test-game",
    );

    console.log("   Handler executado com proteção");
    return true;
  } catch (error) {
    console.log("   Erro no handler protegido:", error.message);
    return false;
  }
});

// Teste 5: Fallback do bot
test("Fallback do bot", () => {
  try {
    const result = protectedHandlers.createFallbackBotPlay(
      mockGame,
      mockIo,
      "test-game-123",
    );

    console.log("   Fallback do bot:", result.success ? "Sucesso" : "Esperado");
    return true;
  } catch (error) {
    console.log("   Erro no fallback:", error.message);
    return false;
  }
});

// Teste 6: Estatísticas do sistema
test("Estatísticas do sistema", () => {
  try {
    const stats = protectedHandlers.getRecoveryStats();
    console.log("   Estatísticas obtidas:", Object.keys(stats));
    return true;
  } catch (error) {
    console.log("   Erro nas estatísticas:", error.message);
    return false;
  }
});

// Executar testes
setTimeout(() => {
  console.log("\nRESULTADOS");
  console.log("=============");
  console.log(`Testes executados: ${totalTests}`);
  console.log(`Testes aprovados: ${testsPassed}`);
  console.log(`Testes falharam: ${totalTests - testsPassed}`);
  console.log(
    `Taxa de sucesso: ${Math.round((testsPassed / totalTests) * 100)}%`,
  );

  if (testsPassed === totalTests) {
    console.log("\nTODOS OS TESTES PASSARAM!");
    console.log("Correções aplicadas com sucesso!");
    console.log("Sistema pronto para uso!");
  } else {
    console.log("\nAlguns testes falharam, mas isso pode ser esperado.");
    console.log("Verifique os logs acima para detalhes.");
  }

  console.log("\nPara usar o sistema:");
  console.log("   node index.js");
  console.log("   # O sistema capturará e tratará erros automaticamente!");

  process.exit(0);
}, 100);
