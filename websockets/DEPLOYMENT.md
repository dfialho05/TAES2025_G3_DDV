# 🚀 Guia de Deploy - Sistema de Recuperação e Resiliência

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação em Produção](#instalação-em-produção)
3. [Configuração Multi-Node](#configuração-multi-node)
4. [Monitoramento](#monitoramento)
5. [Backup e Recuperação](#backup-e-recuperação)
6. [Troubleshooting em Produção](#troubleshooting-em-produção)
7. [Escalabilidade](#escalabilidade)

---

## 🔧 Pré-requisitos

### Software Necessário

- **Node.js:** >= 18.x
- **Redis:** >= 6.x (recomendado 7.x)
- **PM2:** Gestor de processos Node.js
- **Nginx:** (opcional) Para load balancing
- **Sistema Operacional:** Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### Portas Necessárias

- `3000-3002` - Servidores WebSocket
- `6379` - Redis (apenas localhost em produção)
- `80/443` - Nginx (se usado)

---

## 📦 Instalação em Produção

### Passo 1: Preparar o Servidor

```bash
# Atualizar sistema
sudo apt-get update && sudo apt-get upgrade -y

# Instalar Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### Passo 2: Instalar e Configurar Redis

```bash
# Instalar Redis
sudo apt-get install redis-server -y

# Configurar Redis para produção
sudo nano /etc/redis/redis.conf
```

**Configurações importantes no `redis.conf`:**

```conf
# Binding apenas localhost (segurança)
bind 127.0.0.1 ::1

# Porta padrão
port 6379

# Senha (IMPORTANTE!)
requirepass SEU_PASSWORD_FORTE_AQUI

# Persistência RDB (snapshots)
save 900 1
save 300 10
save 60 10000

# Persistência AOF (mais segura)
appendonly yes
appendfsync everysec

# Memória máxima (ajustar conforme servidor)
maxmemory 2gb
maxmemory-policy allkeys-lru

# Log
loglevel notice
logfile /var/log/redis/redis-server.log
```

```bash
# Reiniciar Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Testar
redis-cli -a SEU_PASSWORD_FORTE_AQUI ping
# Deve retornar: PONG
```

### Passo 3: Instalar PM2

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Verificar instalação
pm2 --version
```

### Passo 4: Preparar Aplicação

```bash
# Clonar repositório
cd /var/www
sudo git clone https://github.com/YOUR_REPO/TAES2025_G3_DDV.git
cd TAES2025_G3_DDV/websockets

# Instalar dependências
npm install --production

# Criar ficheiro .env
sudo nano .env
```

**Configuração `.env` para Produção:**

```env
# Servidor
SERVER_ID=prod-node-1
WEBSOCKET_PORT=3000
NODE_ENV=production

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=SEU_PASSWORD_FORTE_AQUI
REDIS_DB=0
REDIS_DEBUG=false

# Watchdog (configurações mais conservadoras em produção)
WATCHDOG_INTERVAL=30000        # 30 segundos
GAME_TIMEOUT_MS=180000         # 3 minutos (mais tempo que dev)
MAX_GAME_DURATION_MS=3600000   # 1 hora
HEARTBEAT_TTL=300              # 5 minutos

# Sincronização
SYNC_INTERVAL=15000            # 15 segundos (menos frequente)
DEFAULT_GAME_TTL=7200          # 2 horas

# Laravel API
LARAVEL_API_URL=http://127.0.0.1:8000/api
API_TIMEOUT=10000              # 10 segundos (mais tempo)

# Logging
LOG_LEVEL=info
```

### Passo 5: Configurar PM2

```bash
# Criar ficheiro ecosystem.config.js
nano ecosystem.config.js
```

**Conteúdo do `ecosystem.config.js`:**

```javascript
module.exports = {
  apps: [{
    name: 'bisca-websocket',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: {
      NODE_ENV: 'production',
      SERVER_ID: 'prod-node-1',
      WEBSOCKET_PORT: 3000
    },
    error_file: '/var/log/pm2/bisca-websocket-error.log',
    out_file: '/var/log/pm2/bisca-websocket-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
```

### Passo 6: Iniciar Aplicação

```bash
# Criar diretórios de logs
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Iniciar com PM2
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs bisca-websocket

# Salvar configuração PM2 (auto-start no boot)
pm2 save
pm2 startup
```

---

## 🔄 Configuração Multi-Node

### Arquitetura Multi-Node

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (Port 443) │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Node 1  │       │ Node 2  │       │ Node 3  │
   │:3000    │       │:3001    │       │:3002    │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │   (Port     │
                    │    6379)    │
                    └─────────────┘
```

### Node 1 - `ecosystem.node1.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'bisca-websocket-node1',
    script: './index.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      SERVER_ID: 'prod-node-1',
      WEBSOCKET_PORT: 3000
    }
  }]
};
```

### Node 2 - `ecosystem.node2.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'bisca-websocket-node2',
    script: './index.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      SERVER_ID: 'prod-node-2',
      WEBSOCKET_PORT: 3001
    }
  }]
};
```

### Node 3 - `ecosystem.node3.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'bisca-websocket-node3',
    script: './index.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      SERVER_ID: 'prod-node-3',
      WEBSOCKET_PORT: 3002
    }
  }]
};
```

### Iniciar Todos os Nós

```bash
# Iniciar cada nó
pm2 start ecosystem.node1.config.js
pm2 start ecosystem.node2.config.js
pm2 start ecosystem.node3.config.js

# Verificar
pm2 list
```

### Configurar Nginx para Load Balancing

```bash
sudo nano /etc/nginx/sites-available/bisca-websocket
```

**Configuração Nginx:**

```nginx
upstream websocket_backend {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name bisca.yourdomain.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bisca.yourdomain.com;

    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/bisca.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bisca.yourdomain.com/privkey.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # WebSocket específico
    location /socket.io/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        
        # Headers WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Headers padrão
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/bisca-websocket /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📊 Monitoramento

### PM2 Monitoring

```bash
# Dashboard em tempo real
pm2 monit

# Informações detalhadas
pm2 info bisca-websocket

# Logs
pm2 logs bisca-websocket --lines 100

# Flush logs antigos
pm2 flush
```

### PM2 Plus (Cloud Monitoring)

```bash
# Conectar ao PM2 Plus
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY

# Ver métricas em: https://app.pm2.io
```

### Redis Monitoring

```bash
# Entrar no Redis CLI
redis-cli -a YOUR_PASSWORD

# Ver informações
INFO
INFO stats
INFO memory

# Ver comandos em tempo real
MONITOR

# Ver jogos ativos
SMEMBERS active_games

# Ver uso de memória por chave
MEMORY USAGE game:123
```

### Script de Monitoramento Personalizado

Criar `monitor.sh`:

```bash
#!/bin/bash

echo "======================================"
echo "🔍 BISCA WEBSOCKET - STATUS REPORT"
echo "======================================"
echo ""

echo "📊 PM2 Processes:"
pm2 list

echo ""
echo "🗄️  Redis Status:"
redis-cli -a YOUR_PASSWORD ping
redis-cli -a YOUR_PASSWORD INFO stats | grep total_commands_processed
redis-cli -a YOUR_PASSWORD DBSIZE

echo ""
echo "🎮 Active Games:"
redis-cli -a YOUR_PASSWORD SMEMBERS active_games | wc -l

echo ""
echo "💾 System Resources:"
free -h
df -h /

echo ""
echo "🌐 Network Connections:"
netstat -an | grep :3000 | wc -l

echo "======================================"
```

```bash
# Tornar executável
chmod +x monitor.sh

# Executar
./monitor.sh
```

### Alertas Automáticos

Criar `alert.sh`:

```bash
#!/bin/bash

# Webhook do Slack/Discord
WEBHOOK_URL="YOUR_WEBHOOK_URL"

# Verificar se PM2 está rodando
if ! pm2 status | grep -q "online"; then
    curl -X POST $WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d '{"text":"⚠️ ALERTA: Servidor WebSocket offline!"}'
fi

# Verificar Redis
if ! redis-cli -a YOUR_PASSWORD ping > /dev/null 2>&1; then
    curl -X POST $WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d '{"text":"⚠️ ALERTA: Redis não responde!"}'
fi
```

**Agendar com Cron:**

```bash
crontab -e

# Verificar a cada 5 minutos
*/5 * * * * /var/www/TAES2025_G3_DDV/websockets/alert.sh
```

---

## 💾 Backup e Recuperação

### Backup do Redis

**Configurar backups automáticos:**

```bash
# Criar script de backup
sudo nano /usr/local/bin/redis-backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Fazer backup RDB
redis-cli -a YOUR_PASSWORD BGSAVE
sleep 5

# Copiar dump
cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb

# Comprimir
gzip $BACKUP_DIR/dump_$DATE.rdb

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "dump_*.rdb.gz" -mtime +7 -delete

echo "✅ Backup do Redis concluído: $BACKUP_DIR/dump_$DATE.rdb.gz"
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/redis-backup.sh

# Agendar (todo dia às 3h da manhã)
sudo crontab -e
0 3 * * * /usr/local/bin/redis-backup.sh
```

### Restaurar Backup

```bash
# Parar Redis
sudo systemctl stop redis-server

# Restaurar dump
sudo gunzip -c /var/backups/redis/dump_YYYYMMDD_HHMMSS.rdb.gz > /var/lib/redis/dump.rdb

# Ajustar permissões
sudo chown redis:redis /var/lib/redis/dump.rdb

# Iniciar Redis
sudo systemctl start redis-server
```

---

## 🐛 Troubleshooting em Produção

### Servidor não inicia

```bash
# Ver logs de erro
pm2 logs bisca-websocket --err --lines 50

# Verificar porta em uso
sudo lsof -i :3000

# Matar processo na porta
sudo kill -9 $(lsof -t -i:3000)

# Reiniciar
pm2 restart bisca-websocket
```

### Redis com alta latência

```bash
# Ver comandos lentos
redis-cli -a YOUR_PASSWORD SLOWLOG GET 10

# Ver latência
redis-cli -a YOUR_PASSWORD --latency

# Verificar uso de memória
redis-cli -a YOUR_PASSWORD INFO memory
```

### Muitos jogos órfãos

```bash
# Entrar no Redis
redis-cli -a YOUR_PASSWORD

# Ver todos os jogos
SMEMBERS active_games

# Limpar jogos órfãos manualmente (CUIDADO!)
SREM active_games 123 456 789
```

### Logs muito grandes

```bash
# Rotacionar logs PM2
pm2 flush

# Configurar logrotate
sudo nano /etc/logrotate.d/pm2
```

```
/var/log/pm2/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## 📈 Escalabilidade

### Escalabilidade Vertical

**Aumentar recursos do servidor:**

```bash
# Ajustar memória máxima no PM2
pm2 delete bisca-websocket
pm2 start ecosystem.config.js --max-memory-restart 2G
```

### Escalabilidade Horizontal

**Adicionar mais nós:**

1. Preparar novo servidor
2. Instalar dependências (Node.js, Redis client)
3. Clonar repositório
4. Configurar `.env` com `SERVER_ID` único
5. Adicionar ao Nginx upstream
6. Iniciar com PM2

### Load Testing

```bash
# Instalar Artillery
npm install -g artillery

# Criar teste
nano load-test.yml
```

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  socketio:
    transports: ['websocket']

scenarios:
  - engine: socketio
    flow:
      - emit:
          channel: 'join'
          data:
            id: 'load_test_{{ $randomNumber() }}'
            name: 'Load Test User'
      - think: 2
      - emit:
          channel: 'create_game'
          data:
            type: 'bisca'
            mode: 'singleplayer'
```

```bash
# Executar teste
artillery run load-test.yml
```

---

## 🔐 Segurança em Produção

### Firewall

```bash
# Configurar UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3000/tcp   # WebSocket (apenas via Nginx)
sudo ufw deny 6379/tcp   # Redis (apenas localhost)
sudo ufw enable
```

### Atualizações de Segurança

```bash
# Atualizações automáticas
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## ✅ Checklist de Deploy

- [ ] Redis instalado e configurado com senha
- [ ] Node.js 18+ instalado
- [ ] PM2 instalado globalmente
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install --production`)
- [ ] Arquivo `.env` configurado
- [ ] PM2 ecosystem configurado
- [ ] Aplicação iniciada com PM2
- [ ] PM2 configurado para auto-start
- [ ] Nginx configurado (se multi-node)
- [ ] SSL/TLS configurado (Let's Encrypt)
- [ ] Firewall configurado
- [ ] Backups automáticos do Redis configurados
- [ ] Monitoramento configurado
- [ ] Alertas configurados
- [ ] Load testing realizado
- [ ] Documentação de runbook criada

---

## 📞 Suporte de Emergência

### Comandos de Emergência

```bash
# Reinício completo
pm2 restart all

# Parar tudo
pm2 stop all

# Ver erros críticos
pm2 logs --err --lines 100

# Flush Redis (EXTREMO - apenas se necessário)
redis-cli -a YOUR_PASSWORD FLUSHDB
pm2 restart all
```

---

**Versão:** 1.0.0  
**Última atualização:** 2025  
**Equipa:** TAES2025_G3_DDV