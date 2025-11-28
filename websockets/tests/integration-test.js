// WebSocket integration test suite for testing server functionality
import { Server } from "socket.io";
import { createServer } from "http";
import Client from "socket.io-client";

const TEST_PORT = 3001;

// Create a test server instance
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Import handlers for testing
import { GameManager } from "../handlers/gameManager.js";
import { connectionManager } from "../handlers/connectionHandlers.js";

const manager = new GameManager();

// Basic server setup for testing
io.on("connection", (socket) => {
  console.log("Test client connected:", socket.id);

  socket.on("auth", ({ playerName }) => {
    socket.emit("authSuccess", {
      playerName,
      sessionInfo: { socketId: socket.id },
    });
  });

  socket.on("startSingleplayerGame", ({ playerName, turnTime = 30 }) => {
    try {
      const { gameId, game } = manager.createGame(playerName, null, turnTime);
      socket.join(gameId);

      socket.emit("gameStarted", {
        gameId,
        state: game.getState(),
        players: game.players,
        isBot: true,
        gameType: "singleplayer",
      });
    } catch (error) {
      socket.emit("gameError", { message: error.message });
    }
  });

  socket.on("playCard", ({ gameId, playerName, cardFace }) => {
    try {
      const game = manager.activeGames.get(gameId);
      if (!game) {
        socket.emit("gameError", { message: "Jogo não encontrado" });
        return;
      }

      // Simple card play for testing
      const playerHand = game.hands[playerName];
      const cardIndex = playerHand.findIndex(
        (card) => card.getFace() === cardFace,
      );

      if (cardIndex === -1) {
        socket.emit("gameError", { message: "Carta não encontrada" });
        return;
      }

      const playedCard = playerHand.splice(cardIndex, 1)[0];
      socket.emit("cardPlayed", {
        player: playerName,
        card: cardFace,
        remainingCards: playerHand.length,
      });
    } catch (error) {
      socket.emit("gameError", { message: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Test client disconnected:", socket.id);
  });
});

/**
 * Integration tests for the websocket server
 */
class WebSocketIntegrationTest {
  constructor() {
    this.server = httpServer;
    this.clients = [];
    this.testResults = [];
  }

  async startServer() {
    return new Promise((resolve) => {
      this.server.listen(TEST_PORT, () => {
        console.log(`Test server started on port ${TEST_PORT}`);
        resolve();
      });
    });
  }

  async stopServer() {
    return new Promise((resolve) => {
      // Close all client connections
      this.clients.forEach((client) => {
        if (client.connected) {
          client.disconnect();
        }
      });

      this.server.close(() => {
        console.log("Test server stopped");
        resolve();
      });
    });
  }

  createClient() {
    const client = new Client(`http://localhost:${TEST_PORT}`);
    this.clients.push(client);
    return client;
  }

  async waitForEvent(client, eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${eventName}`));
      }, timeout);

      client.once(eventName, (data) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  // Utility method to log test results
  log(testName, success, message = "") {
    const result = {
      testName,
      success,
      message,
      timestamp: new Date().toISOString(),
    };
    this.testResults.push(result);

    const status = success ? "PASS" : "FAIL";
    console.log(`${status} ${testName}${message ? ` - ${message}` : ""}`);

    return result;
  }

  async testAuthentication() {
    console.log("\nTesting Authentication...");

    const client = this.createClient();

    try {
      // Wait for connection
      await this.waitForEvent(client, "connect");

      // Test authentication
      client.emit("auth", { playerName: "TestPlayer1" });
      const authResponse = await this.waitForEvent(client, "authSuccess");

      this.log(
        "Authentication",
        authResponse.playerName === "TestPlayer1",
        `Player: ${authResponse.playerName}`,
      );

      client.disconnect();
      return true;
    } catch (error) {
      this.log("Authentication", false, error.message);
      client.disconnect();
      return false;
    }
  }

  async testSingleplayerGameCreation() {
    console.log("\nTesting Singleplayer Game Creation...");

    const client = this.createClient();

    try {
      await this.waitForEvent(client, "connect");

      // Authenticate first
      client.emit("auth", { playerName: "TestPlayer2" });
      await this.waitForEvent(client, "authSuccess");

      // Start singleplayer game
      client.emit("startSingleplayerGame", {
        playerName: "TestPlayer2",
        turnTime: 30,
      });
      const gameStarted = await this.waitForEvent(client, "gameStarted");

      const success =
        gameStarted.isBot === true &&
        gameStarted.gameType === "singleplayer" &&
        gameStarted.players.length === 2;

      this.log(
        "Singleplayer Game Creation",
        success,
        `GameID: ${gameStarted.gameId}, Players: ${gameStarted.players.join(", ")}`,
      );

      client.disconnect();
      return success;
    } catch (error) {
      this.log("Singleplayer Game Creation", false, error.message);
      client.disconnect();
      return false;
    }
  }

  async testCardPlay() {
    console.log("\nTesting Card Play...");

    const client = this.createClient();

    try {
      await this.waitForEvent(client, "connect");

      // Authenticate
      client.emit("auth", { playerName: "TestPlayer3" });
      await this.waitForEvent(client, "authSuccess");

      // Start game
      client.emit("startSingleplayerGame", {
        playerName: "TestPlayer3",
        turnTime: 30,
      });
      const gameStarted = await this.waitForEvent(client, "gameStarted");

      // Get first card from hand
      const playerHand = gameStarted.state.hands["TestPlayer3"];
      if (!playerHand || playerHand.length === 0) {
        throw new Error("No cards in player hand");
      }

      const firstCard = playerHand[0];

      // Play card
      client.emit("playCard", {
        gameId: gameStarted.gameId,
        playerName: "TestPlayer3",
        cardFace: firstCard,
      });

      const cardPlayed = await this.waitForEvent(client, "cardPlayed");

      const success =
        cardPlayed.player === "TestPlayer3" && cardPlayed.card === firstCard;

      this.log(
        "Card Play",
        success,
        `Card: ${cardPlayed.card}, Remaining: ${cardPlayed.remainingCards}`,
      );

      client.disconnect();
      return success;
    } catch (error) {
      this.log("Card Play", false, error.message);
      client.disconnect();
      return false;
    }
  }

  async testErrorHandling() {
    console.log("\nTesting Error Handling...");

    const client = this.createClient();

    try {
      await this.waitForEvent(client, "connect");

      // Authenticate
      client.emit("auth", { playerName: "TestPlayer4" });
      await this.waitForEvent(client, "authSuccess");

      // Try to play card without game
      client.emit("playCard", {
        gameId: "invalid-game-id",
        playerName: "TestPlayer4",
        cardFace: "c1",
      });

      const error = await this.waitForEvent(client, "gameError");

      const success = error.message === "Jogo não encontrado";

      this.log("Error Handling", success, `Error message: ${error.message}`);

      client.disconnect();
      return success;
    } catch (error) {
      this.log("Error Handling", false, error.message);
      client.disconnect();
      return false;
    }
  }

  async testMultipleClients() {
    console.log("\nTesting Multiple Clients...");

    const client1 = this.createClient();
    const client2 = this.createClient();

    try {
      // Connect both clients
      await Promise.all([
        this.waitForEvent(client1, "connect"),
        this.waitForEvent(client2, "connect"),
      ]);

      // Authenticate both
      client1.emit("auth", { playerName: "MultiPlayer1" });
      client2.emit("auth", { playerName: "MultiPlayer2" });

      await Promise.all([
        this.waitForEvent(client1, "authSuccess"),
        this.waitForEvent(client2, "authSuccess"),
      ]);

      // Start games for both
      client1.emit("startSingleplayerGame", { playerName: "MultiPlayer1" });
      client2.emit("startSingleplayerGame", { playerName: "MultiPlayer2" });

      const [game1, game2] = await Promise.all([
        this.waitForEvent(client1, "gameStarted"),
        this.waitForEvent(client2, "gameStarted"),
      ]);

      const success =
        game1.gameId !== game2.gameId &&
        game1.players.includes("MultiPlayer1") &&
        game2.players.includes("MultiPlayer2");

      this.log(
        "Multiple Clients",
        success,
        `Game1: ${game1.gameId}, Game2: ${game2.gameId}`,
      );

      client1.disconnect();
      client2.disconnect();
      return success;
    } catch (error) {
      this.log("Multiple Clients", false, error.message);
      client1.disconnect();
      client2.disconnect();
      return false;
    }
  }

  async testConnectionResilience() {
    console.log("\nTesting Connection Resilience...");

    const client = this.createClient();

    try {
      await this.waitForEvent(client, "connect");

      // Authenticate
      client.emit("auth", { playerName: "ResilienceTest" });
      await this.waitForEvent(client, "authSuccess");

      // Disconnect and reconnect
      client.disconnect();
      await this.waitForEvent(client, "disconnect");

      // Wait a bit then reconnect
      await new Promise((resolve) => setTimeout(resolve, 100));

      client.connect();
      await this.waitForEvent(client, "connect");

      // Re-authenticate
      client.emit("auth", { playerName: "ResilienceTest2" });
      const authResponse = await this.waitForEvent(client, "authSuccess");

      const success = authResponse.playerName === "ResilienceTest2";

      this.log("Connection Resilience", success, "Reconnection successful");

      client.disconnect();
      return success;
    } catch (error) {
      this.log("Connection Resilience", false, error.message);
      client.disconnect();
      return false;
    }
  }

  async runAllTests() {
    console.log("Starting WebSocket Integration Tests...\n");

    try {
      await this.startServer();

      // Wait for server to be ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Run all tests
      const tests = [
        this.testAuthentication.bind(this),
        this.testSingleplayerGameCreation.bind(this),
        this.testCardPlay.bind(this),
        this.testErrorHandling.bind(this),
        this.testMultipleClients.bind(this),
        this.testConnectionResilience.bind(this),
      ];

      const results = [];
      for (const test of tests) {
        try {
          const result = await test();
          results.push(result);

          // Wait between tests
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error("Test failed:", error);
          results.push(false);
        }
      }

      await this.stopServer();

      // Print summary
      this.printTestSummary();

      const passedTests = results.filter((r) => r === true).length;
      const totalTests = results.length;

      console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`);

      if (passedTests === totalTests) {
        console.log("All tests passed!");
        return true;
      } else {
        console.log("Some tests failed!");
        return false;
      }
    } catch (error) {
      console.error("Test suite failed:", error);
      await this.stopServer();
      return false;
    }
  }

  printTestSummary() {
    console.log("\nDetailed Test Results:");
    console.log("=".repeat(50));

    this.testResults.forEach((result) => {
      const status = result.success ? "PASS" : "FAIL";
      console.log(
        `${status} | ${result.testName.padEnd(25)} | ${result.message}`,
      );
    });

    console.log("=".repeat(50));
  }
}

// Export for use in other test files
export { WebSocketIntegrationTest };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new WebSocketIntegrationTest();

  tester
    .runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test suite crashed:", error);
      process.exit(1);
    });
}
