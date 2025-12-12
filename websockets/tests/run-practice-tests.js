#!/usr/bin/env node
// run-practice-tests.js
import { runAllPracticeTests } from "./test-practice-mode.js";
import { runAllIntegrationTests } from "./test-practice-integration.js";

console.log("🧪 EXECUTANDO SUITE COMPLETA DE TESTES PRACTICE MODE");
console.log("=".repeat(70));
console.log("📅 Data:", new Date().toLocaleString());
console.log("🔧 Node.js:", process.version);
console.log("=".repeat(70));

async function runAllPracticeTestSuites() {
  let totalSuites = 2;
  let passedSuites = 0;
  let allResults = [];

  console.log("\n🚀 INICIANDO EXECUÇÃO DOS TESTES...\n");

  // Suite 1: Testes unitários de practice mode
  console.log("📋 SUITE 1: Testes Unitários Practice Mode");
  console.log("=".repeat(50));
  try {
    const unitTestsResult = await runAllPracticeTests();
    allResults.push({
      name: "Testes Unitários Practice Mode",
      passed: unitTestsResult,
      type: "unit",
    });

    if (unitTestsResult) {
      passedSuites++;
      console.log("✅ SUITE 1 COMPLETA: Testes Unitários PASSARAM");
    } else {
      console.log("❌ SUITE 1 FALHOU: Testes Unitários");
    }
  } catch (error) {
    console.error("❌ ERRO NA SUITE 1:", error.message);
    allResults.push({
      name: "Testes Unitários Practice Mode",
      passed: false,
      type: "unit",
      error: error.message,
    });
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Suite 2: Testes de integração
  console.log("📋 SUITE 2: Testes de Integração Practice Mode");
  console.log("=".repeat(50));
  try {
    const integrationTestsResult = await runAllIntegrationTests();
    allResults.push({
      name: "Testes de Integração Practice Mode",
      passed: integrationTestsResult,
      type: "integration",
    });

    if (integrationTestsResult) {
      passedSuites++;
      console.log("✅ SUITE 2 COMPLETA: Testes de Integração PASSARAM");
    } else {
      console.log("❌ SUITE 2 FALHOU: Testes de Integração");
    }
  } catch (error) {
    console.error("❌ ERRO NA SUITE 2:", error.message);
    allResults.push({
      name: "Testes de Integração Practice Mode",
      passed: false,
      type: "integration",
      error: error.message,
    });
  }

  // Resumo final
  console.log("\n" + "=".repeat(70));
  console.log("📊 RELATÓRIO FINAL DOS TESTES PRACTICE MODE");
  console.log("=".repeat(70));

  console.log(`📈 Total de suites executadas: ${totalSuites}`);
  console.log(`✅ Suites que passaram: ${passedSuites}`);
  console.log(`❌ Suites que falharam: ${totalSuites - passedSuites}`);
  console.log(
    `🎯 Taxa de sucesso geral: ${((passedSuites / totalSuites) * 100).toFixed(1)}%`,
  );

  console.log("\n📋 DETALHES POR SUITE:");
  console.log("-".repeat(40));

  for (const result of allResults) {
    const status = result.passed ? "✅ PASSOU" : "❌ FALHOU";
    const type = result.type.toUpperCase().padEnd(12);
    console.log(`${status} | ${type} | ${result.name}`);

    if (!result.passed && result.error) {
      console.log(`       └─ Erro: ${result.error}`);
    }
  }

  if (passedSuites === totalSuites) {
    console.log("\n🎉🎉🎉 TODAS AS SUITES DE TESTE PASSARAM! 🎉🎉🎉");
    console.log("🏆 PRACTICE MODE IMPLEMENTATION IS 100% WORKING! 🏆");
    console.log("✨ Ready for production deployment! ✨");

    console.log("\n🔍 FUNCIONALIDADES VALIDADAS:");
    console.log("  ✅ Criação automática de usuários anônimos");
    console.log("  ✅ Jogos practice sem necessidade de login");
    console.log("  ✅ Não persistência de dados em BD para practice");
    console.log("  ✅ Gameplay completo em modo practice");
    console.log("  ✅ Suporte a múltiplos jogos simultâneos");
    console.log("  ✅ Tratamento robusto de erros");
    console.log("  ✅ Separação correta entre practice e jogos normais");
    console.log("  ✅ Integração end-to-end funcionando");

    return true;
  } else {
    console.log("\n⚠️ ALGUMAS SUITES FALHARAM");
    console.log("🔧 Verifique os logs acima para identificar problemas");
    console.log("🛠️ Corrija os issues antes de fazer deploy");
    return false;
  }
}

// Executar se chamado diretamente
if (process.argv[1].endsWith("run-practice-tests.js")) {
  console.log("🎬 Iniciando execução da suite de testes...\n");

  runAllPracticeTestSuites()
    .then((success) => {
      if (success) {
        console.log("\n🚀 TODOS OS TESTES PASSARAM - SISTEMA PRONTO!");
        process.exit(0);
      } else {
        console.log("\n💥 ALGUNS TESTES FALHARAM - VERIFIQUE OS LOGS");
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("\n💀 ERRO FATAL NA EXECUÇÃO DOS TESTES:");
      console.error(error);
      console.error("\nStack trace:");
      console.error(error.stack);
      process.exit(1);
    });
}

export { runAllPracticeTestSuites };
