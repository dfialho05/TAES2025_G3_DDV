# 🚀 Quick Start - Sistema de Recuperação

## 📦 Instalação Rápida

### 1. Instalar Redis

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

**MacOS:**
```bash
brew install redis
brew services start redis
```

**Verificar instalação:**
```bash
redis-cli ping
# Deve retornar: PONG
```

### 2. Instalar Dependências

```bash
cd websockets
npm install
```

### 3. Configurar Ambiente

```bash
cp .env.example .env
```

**Configuração mínima (`.env`):**
```env
SERVER_ID=websocket-server-1
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
WATCHDOG_INTERVAL=30000
GAME_TIMEOUT_MS=120000
```

### 4. Iniciar Servidor

```bash
npm run dev
```

**Você deve ver:**
```
✅ [Redis] Cliente principal conectado
✅ [Redis] Subscriber conectado
✅ [Redis] Publisher conectado
✅ [Socket.IO] Redis Adapter configurado
✅ [Recovery] Sincronização periódica iniciada
🐕 [Watchdog] Iniciando Worker...
🎮 Servidor Bisca rodando na porta 3000
```

---

## 🧪 Testes Rápidos

### Verificar Redis
```bash
npm run redis:check
```

### Ver jogos ativos
```bash
npm run redis:games
```

### Executar teste do sistema
```bash
npm run recovery:test
```

### Verificação manual do Watchdog
```bash
npm run watchdog:manual
```

---

## 🔄 Funcionalidades Ativas

### ✅ Persistência com Redis
- Estado dos jogos salvo automaticamente
- Sobrevive a reinícios do servidor
- TTL de 2 horas para jogos inativos

### ✅ Reconexão Automática
- Clientes reconectam-se aos jogos ativos
- Estado é restaurado automaticamente
- Notificações para outros jogadores

### ✅ Escalabilidade Horizontal
- Redis Adapter permite múltiplos nós
- Estado compartilhado entre servidores
- Load balancing automático

### ✅ Watchdog (Monitoramento)
- Verifica jogos a cada 30 segundos
- Detecta servidores inativos
- Processa reembolsos automáticos
- Limpa jogos órfãos

### ✅ Sincronização Periódica
- Estado sincronizado a cada 10 segundos
- Heartbeat mantém jogos "vivos"
- Recuperação após crashes

---

## 📊 Comandos Úteis

### Redis
```bash
npm run redis:check      # Verifica conexão
npm run redis:monitor    # Monitora comandos em tempo real
npm run redis:stats      # Estatísticas do Redis
npm run redis:games      # Lista jogos ativos
npm run redis:flush      # ⚠️ Limpa TODOS os dados
```

### Watchdog
```bash
npm run watchdog:manual  # Força verificação imediata
```

### Testes
```bash
npm run recovery:test    # Testa sistema de recuperação
npm test                 # Suite completa de testes
```

---

## 🔧 Troubleshooting Rápido

### Problema: "Redis connection refused"
**Solução:**
```bash
# Verificar se Redis está rodando
redis-cli ping

# Se não estiver, iniciar:
sudo systemctl start redis      # Linux
brew services start redis       # MacOS
```

### Problema: Jogos não são recuperados
**Solução:**
```bash
# Verificar jogos ativos no Redis
npm run redis:games

# Ver logs detalhados
npm run dev
```

### Problema: Watchdog não detecta timeouts
**Solução:**
- Reduzir `GAME_TIMEOUT_MS` no `.env` para testar
- Verificar logs: `🐕 [Watchdog] Iniciando verificação`
- Forçar verificação manual: `npm run watchdog:manual`

---

## 🎯 Fluxo Básico de Uso

### 1. Cliente cria jogo
```
Cliente → createGame() → Jogo salvo no Redis
```

### 2. Cliente desconecta (crash, rede, etc)
```
Jogo permanece no Redis (aguarda reconexão)
```

### 3. Cliente reconecta
```
Cliente reconecta → Sistema detecta jogo ativo → Estado restaurado
```

### 4. Se cliente não reconectar em 2 minutos
```
Watchdog detecta timeout → Reembolsa moedas → Remove jogo
```

---

## 📖 Documentação Completa

Para detalhes técnicos completos, consulte:
- `RECOVERY_SYSTEM.md` - Documentação técnica completa
- `FUNCIONAMENTO.md` - Funcionamento do servidor

---

## 🆘 Suporte

**Problemas comuns:**
1. ✅ Redis não conecta → Verificar se está instalado e rodando
2. ✅ Jogos não salvam → Verificar logs de sincronização
3. ✅ Reembolsos falham → Verificar API Laravel

**Logs importantes:**
- `[Redis]` - Conexões e operações Redis
- `[Recovery]` - Sistema de recuperação
- `[Watchdog]` - Monitoramento de timeouts
- `[Laravel]` - Comunicação com API

---

## ✅ Checklist de Funcionamento

Após iniciar o servidor, você deve ver:

- [ ] `✅ [Redis] Cliente principal conectado`
- [ ] `✅ [Socket.IO] Redis Adapter configurado`
- [ ] `✅ [Recovery] Sincronização periódica iniciada`
- [ ] `🐕 [Watchdog] Iniciando Worker...`
- [ ] `🎮 Servidor Bisca rodando na porta 3000`

Se todos os itens aparecerem, o sistema está funcionando corretamente! 🎉

---

**Versão:** 1.0.0  
**Equipa:** TAES2025_G3_DDV