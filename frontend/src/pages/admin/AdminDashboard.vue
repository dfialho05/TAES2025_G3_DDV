<template>
  <div class="admin-wrapper">
    
    <header class="dashboard-header">
      <div class="header-left">
        <h1>Painel de Administração</h1>
      </div>
    </header>

    <nav class="tabs-nav">
      <button 
        @click="currentTab = 'stats'" 
        :class="['tab-btn', currentTab === 'stats' ? 'active' : '']"
      >
        📊 Monitorização
      </button>
      <button 
        @click="currentTab = 'store'" 
        :class="['tab-btn', currentTab === 'store' ? 'active' : '']"
      >
        🛍️ Gestão da Loja
      </button>
    </nav>

    <div class="divider"></div>

    <transition name="fade" mode="out-in">
      
      <div v-if="currentTab === 'stats'" key="stats" class="stats-view">
        
        <div class="stats-grid">
          <div class="stat-card blue">
            <div class="icon-box">👥</div>
            <div class="stat-info">
              <h3>Total Utilizadores</h3>
              <p class="number">{{ stats?.total_users || 0 }}</p>
            </div>
          </div>

          <div class="stat-card green">
            <div class="icon-box">📈</div>
            <div class="stat-info">
              <h3>Novos (7 dias)</h3>
              <p class="number">+{{ stats?.new_users_week || 0 }}</p>
            </div>
          </div>

          <div class="stat-card purple">
            <div class="icon-box">🎮</div>
            <div class="stat-info">
              <h3>Jogos Ativos</h3>
              <p class="number">{{ stats?.active_games || 0 }}</p>
            </div>
          </div>

          <div class="stat-card orange">
            <div class="icon-box">💰</div>
            <div class="stat-info">
              <h3>Economia (Moedas)</h3>
              <p class="number">{{ formatCurrency(stats?.total_economy || 0) }}</p>
            </div>
          </div>
        </div>

        <h3 class="section-title">Diagnóstico do Servidor</h3>
        <div class="system-summary">
          
          <div class="summary-card">
            <div class="card-header-row">
              <h3>📡 REST API</h3>
              <span class="status-badge api">HTTP</span>
            </div>
            
            <div class="diag-content">
              <div class="status-row">
                <span>Nome:</span>
                <strong>{{ apiMetadata.name || 'A carregar...' }}</strong>
              </div>
              <div class="status-row">
                <span>Versão:</span>
                <span class="version-tag">{{ apiMetadata.version ? 'v'+apiMetadata.version : '...' }}</span>
              </div>
              <div class="status-row">
                <span>Estado:</span>
                <span :class="['status-text', apiMetadata.name ? 'ok' : 'error']">
                  {{ apiMetadata.name ? 'Disponível ✅' : 'Indisponível ❌' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="summary-card">
            <div class="card-header-row">
              <h3>⚡ WebSocket</h3>
              <span :class="['status-badge', socketConnected ? 'active' : 'inactive']">
                {{ socketConnected ? 'Ligado' : 'Desligado' }}
              </span>
            </div>

            <div class="diag-content">
              <div class="socket-test-area">
                <label>Teste de Echo (Latência)</label>
                <div class="input-row">
                  <input 
                    v-model="socketMessage" 
                    type="text" 
                    placeholder="Escreve algo..." 
                    @keyup.enter="sendEcho"
                  />
                  <button @click="sendEcho" class="btn-small" :disabled="!socketConnected">
                    Enviar
                  </button>
                </div>
                
                <div v-if="socketReceived" class="socket-response">
                  <span class="label">Recebido:</span>
                  <span class="value">{{ socketReceived }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>        
      </div>

      <div v-else-if="currentTab === 'store'" key="store" class="store-view">
        
        <section class="section-card">
          <div class="section-header">
            <h2>Lista de Baralhos</h2>
          </div>
          <div class="table-responsive">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Capa</th>
                  <th>Nome</th>
                  <th>Preço</th>
                  <th>Estado</th>
                  <th class="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="deck in decks" :key="deck.id">
                  <td>
                    <img :src="getDeckImage(deck.slug)" class="table-thumb" loading="lazy" />
                  </td>
                  <td class="fw-bold">{{ deck.name }}</td>
                  <td class="price-font">{{ deck.price }} 🪙</td>
                  <td>
                    <span :class="['status-pill', deck.active ? 'active' : 'inactive']">
                      {{ deck.active ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <button @click="toggleDeck(deck)" class="btn-icon" :title="deck.active ? 'Desativar' : 'Ativar'">
                      {{ deck.active ? '🛑' : '✅' }}
                    </button>
                    <button @click="deleteDeck(deck)" class="btn-icon delete" title="Apagar">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="section-card">
          <div class="section-header">
            <h2>Adicionar Novo Baralho</h2>
            <p class="section-subtitle">Preenche os dados e faz upload das imagens.</p>
          </div>

          <form @submit.prevent="uploadDeck" class="classic-form">
            <div class="form-row">
              <div class="form-group">
                <label>Nome do Baralho</label>
                <input v-model="form.name" type="text" placeholder="Ex: Cyberpunk" required />
              </div>
              <div class="form-group">
                <label>Preço</label>
                <input v-model="form.price" type="number" placeholder="100" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Capa (Preview Loja)</label>
                <input type="file" @change="e => handleSingleFile(e, 'preview')" accept="image/*" required class="file-control"/>
              </div>
              <div class="form-group">
                <label>Costas da Carta (Verso)</label>
                <input type="file" @change="e => handleSingleFile(e, 'back')" accept="image/*" required class="file-control"/>
              </div>
            </div>

            <div class="bulk-upload-section">
              <div class="label-with-tooltip">
                <label>📦 Cartas do Jogo (40 Imagens)</label>
                
                <div class="tooltip-container">
                  <span class="info-icon">ℹ️</span>
                  <div class="tooltip-content">
                    <h4>⚠️ Regras de Nomenclatura</h4>
                    <ul>
                      <li>♥️ <strong>Copas:</strong> c1.png ... c13.png</li>
                      <li>♠️ <strong>Espadas:</strong> e1.png ... e13.png</li>
                      <li>♦️ <strong>Ouros:</strong> o1.png ... o13.png</li>
                      <li>♣️ <strong>Paus:</strong> p1.png ... p13.png</li>
                    </ul>
                    <small>Total: 40 cartas (sem 8, 9, 10)</small>
                  </div>
                </div>
              </div>

              <div class="upload-area" :class="{ 'has-files': files.gameCards.length > 0 }">
                <input 
                  type="file" 
                  multiple 
                  @change="handleBulkFiles" 
                  accept="image/*" 
                  required 
                />
                <div class="upload-placeholder">
                  <div v-if="files.gameCards.length > 0" class="success-text">
                    ✅ {{ files.gameCards.length }} cartas selecionadas com sucesso!
                  </div>
                  <div v-else>
                    <span class="upload-icon">📂</span>
                    <p>Clica ou arrasta as <strong>40 cartas</strong> para aqui</p>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="message" class="alert success">{{ message }}</div>
            <div v-if="error" class="alert error">{{ error }}</div>

            <button type="submit" :disabled="isUploading" class="btn-submit large">
              <span v-if="isUploading" class="spinner"></span>
              {{ isUploading ? 'A processar imagens...' : 'Criar Baralho' }}
            </button>
          </form>
        </section>

      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted, inject} from 'vue';
import axios from 'axios';
import { useSocketStore } from '@/stores/socket';

// --- INICIALIZAR STORE ---
const socketStore = useSocketStore();

// --- ESTADO ---
const socket = inject('socket');
const currentTab = ref('stats'); // Começa nas Estatísticas
const stats = ref(null);
const decks = ref([]);
const isUploading = ref(false);
const message = ref('');
const error = ref('');

// Variáveis de Diagnóstico
const apiMetadata = ref({});
const socketConnected = ref(false);
const socketMessage = ref('Olá do Admin');
const socketReceived = ref('');

// Verificar API
const checkApiStatus = async () => {
  try {
    const response = await axios.get('http://localhost:8000/api/metadata');
    apiMetadata.value = response.data;
  } catch (e) {
    apiMetadata.value = { name: null };
  }
};

// Ação do Botão Echo
const sendEcho = () => {
  if (socketMessage.value) {
    socketStore.emitEcho(socketMessage.value); 
    socketReceived.value = 'A aguardar...';
  }
};

const form = ref({ name: '', price: 100 });
const files = ref({ preview: null, back: null, gameCards: [] });

// --- LOAD DATA ---
const loadData = async () => {
  checkApiStatus();
  if (socket) {
    socketConnected.value = socket.connected;
    socket.on('connect', () => { socketConnected.value = true; });
    socket.on('disconnect', () => { socketConnected.value = false; });
    socket.on('echo', (msg) => { socketReceived.value = msg; });
  }
  try {
    const [statsRes, decksRes] = await Promise.all([
      axios.get('admin/stats'),
      axios.get('admin/decks')
    ]);
    stats.value = statsRes.data;
    decks.value = decksRes.data;
  } catch (e) {
    console.error(e);
  }
};
onMounted(loadData);

// --- HELPERS ---
const getDeckImage = (slug) => `http://localhost:8000/storage/decks/${slug}/preview.png`;
const formatCurrency = (val) => new Intl.NumberFormat('pt-PT').format(val);

// --- AÇÕES ---
const handleSingleFile = (e, k) => files.value[k] = e.target.files[0];
const handleBulkFiles = (e) => files.value.gameCards = Array.from(e.target.files);

const toggleDeck = async (deck) => {
  if(deck.id == 1) return alert("O baralho do sistema está protegido.");
  try {
    const res = await axios.patch(`admin/decks/${deck.id}`);
    deck.active = res.data.active;
  } catch(e) { alert("Erro ao mudar estado."); }
};

const deleteDeck = async (deck) => {
  if(deck.id == 1) return alert("O baralho do sistema está protegido.");
  if(!confirm(`Tens a certeza que queres apagar "${deck.name}"?`)) return;
  
  try {
    await axios.delete(`admin/decks/${deck.id}`);
    decks.value = decks.value.filter(d => d.id !== deck.id);
  } catch(e) { alert("Erro ao apagar."); }
};

const uploadDeck = async () => {
  isUploading.value = true;
  message.value = ''; error.value = '';

  const fd = new FormData();
  fd.append('name', form.value.name);
  fd.append('price', form.value.price);
  if(files.value.preview) fd.append('image_preview', files.value.preview);
  if(files.value.back) fd.append('image_back', files.value.back);
  files.value.gameCards.forEach(f => fd.append('game_cards[]', f));

  try {
    await axios.post('admin/decks', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000 
    });
    message.value = "Baralho criado com sucesso!";
    // Reset Form
    form.value.name = ''; 
    files.value = { preview: null, back: null, gameCards: [] };
    // Recarregar dados
    await loadData();
  } catch (e) {
    error.value = "Erro: " + (e.response?.data?.message || e.message);
  } finally {
    isUploading.value = false;
  }
};
</script>

<style scoped>
/* --- LAYOUT GERAL --- */
.admin-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #334155;
}

/* HEADER */
.dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.header-left h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; }
.subtitle { color: #64748b; margin-top: 5px; }

.admin-badge {
  background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px;
  font-weight: 600; display: flex; align-items: center; gap: 8px;
}
.pulse-dot { width: 8px; height: 8px; background: #166534; border-radius: 50%; animation: pulse 2s infinite; }

/* TABS (NAVEGAÇÃO) */
.tabs-nav { display: flex; gap: 20px; margin-bottom: 20px; }
.tab-btn {
  background: none; border: none; padding: 10px 0;
  font-size: 1.1rem; font-weight: 600; color: #94a3b8;
  cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s;
}
.tab-btn:hover { color: #334155; }
.tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
.divider { height: 1px; background: #e2e8f0; margin-bottom: 40px; }

/* --- ESTATÍSTICAS --- */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 40px; }
.stat-card {
  background: white; padding: 24px; border-radius: 16px; display: flex; align-items: center; gap: 20px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s; border: 1px solid #f1f5f9;
}
.stat-card:hover { transform: translateY(-5px); }
.icon-box { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }

/* Cores */
.blue .icon-box { background: #eff6ff; color: #3b82f6; }
.green .icon-box { background: #f0fdf4; color: #22c55e; }
.purple .icon-box { background: #faf5ff; color: #a855f7; }
.orange .icon-box { background: #fff7ed; color: #f97316; }

.stat-info h3 { margin: 0; font-size: 0.9rem; color: #64748b; }
.stat-info .number { margin: 0; font-size: 1.8rem; font-weight: 800; color: #1e293b; }

/* RESUMO DO SISTEMA */
.system-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.summary-card { background: white; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; }
.summary-card h3 { margin-top: 0; color: #334155; margin-bottom: 20px; }
.status-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem; }
.status-ok { color: #166534; font-weight: 600; }
.summary-card.highlight { background: #1e293b; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
.summary-card.highlight h3 { color: white; }
.btn-action { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 15px; cursor: pointer; font-weight: 600; }

/* --- GESTÃO DA LOJA --- */
.section-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.section-header { padding: 25px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.section-header h2 { margin: 0; font-size: 1.2rem; color: #1e293b; }
.section-subtitle { margin: 5px 0 0; color: #64748b; font-size: 0.9rem; }

/* TABELA */
.table-responsive { overflow-x: auto; }
.modern-table { width: 100%; border-collapse: collapse; }
.modern-table th { text-align: left; padding: 15px 25px; font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.modern-table td { padding: 15px 25px; border-top: 1px solid #f1f5f9; vertical-align: middle; }
.table-thumb { width: 40px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0; }
.status-pill { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
.status-pill.active { background: #dcfce7; color: #166534; }
.status-pill.inactive { background: #fee2e2; color: #991b1b; }
.btn-icon { background: none; border: 1px solid #e2e8f0; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; margin-left: 5px; transition: all 0.2s; }
.btn-icon:hover { background: #f1f5f9; transform: scale(1.1); }
.text-right { text-align: right; }

/* FORMULÁRIO (ESTILO ANTERIOR) */
.classic-form { padding: 30px; }
.form-row { display: flex; gap: 30px; margin-bottom: 25px; }
.form-group { flex: 1; }
.form-group label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
.form-group input[type="text"], .form-group input[type="number"] { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }
.file-control { padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; width: 100%; }

/* UPLOAD MASSIVO COM TOOLTIP */
.bulk-upload-section { margin-top: 10px; }
.label-with-tooltip { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.tooltip-container { position: relative; cursor: help; }
.info-icon { background: #e2e8f0; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 0.8rem; }
.tooltip-content { visibility: hidden; opacity: 0; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); width: 220px; background: #334155; color: white; padding: 15px; border-radius: 8px; font-size: 0.85rem; transition: opacity 0.3s; z-index: 10; margin-bottom: 10px; }
.tooltip-container:hover .tooltip-content { visibility: visible; opacity: 1; }

.upload-area { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center; background: #f8fafc; position: relative; transition: all 0.3s; }
.upload-area:hover, .upload-area.has-files { border-color: #3b82f6; background: #eff6ff; }
.upload-area input { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.upload-icon { font-size: 2.5rem; display: block; margin-bottom: 10px; }
.success-text { color: #166534; font-weight: bold; font-size: 1.1rem; }

.btn-submit { width: 100%; padding: 15px; background: #0f172a; color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 20px; }
.btn-submit:hover:not(:disabled) { background: #334155; }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

/* FEEDBACK */
.alert { padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; font-weight: 500; }
.alert.success { background: #dcfce7; color: #166534; }
.alert.error { background: #fee2e2; color: #991b1b; }

/* ANIMATIONS */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

/* --- DIAGNÓSTICO DO SISTEMA --- */
.section-title { font-size: 1.2rem; color: #1e293b; margin: 30px 0 20px 0; border-top: 1px solid #e2e8f0; padding-top: 20px; }
.system-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.summary-card { background: white; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }

.card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9; }
.card-header-row h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }

.status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
.status-badge.api { background: #e0f2fe; color: #0369a1; }
.status-badge.active { background: #dcfce7; color: #166534; }
.status-badge.inactive { background: #fee2e2; color: #991b1b; }

.diag-content { display: flex; flex-direction: column; gap: 12px; }
.status-row { display: flex; justify-content: space-between; font-size: 0.95rem; }
.status-text.ok { color: #166534; font-weight: 600; }
.status-text.error { color: #ef4444; font-weight: 600; }
.version-tag { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-family: monospace; }

/* Área de Teste do Socket */
.socket-test-area label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; color: #64748b; }
.input-row { display: flex; gap: 10px; margin-bottom: 15px; }
.input-row input { flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; }
.btn-small { padding: 8px 16px; background: #0f172a; color: white; border: none; border-radius: 6px; cursor: pointer; }
.btn-small:disabled { background: #94a3b8; cursor: not-allowed; }

.socket-response { background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px dashed #cbd5e1; font-size: 0.9rem; }
.socket-response .label { color: #64748b; font-size: 0.8rem; display: block; }
.socket-response .value { color: #0f172a; font-weight: 600; }

/* Cores do Led no Header */
.pulse-dot.online { background: #166534; animation: pulse 2s infinite; box-shadow: 0 0 0 2px rgba(22, 101, 52, 0.2); }
.pulse-dot.offline { background: #ef4444; animation: none; box-shadow: none; }
</style>