<template>
  <div class="leaderboard-section">
    <div class="section-header">
      <h3 class="section-title">
        <span class="title-emoji">{{ emoji }}</span>
        {{ title }}
      </h3>
      <p class="section-description">{{ description }}</p>
    </div>

    <div class="section-content">
      <div v-if="isLoading && entries.length === 0" class="loading-state">
        <div class="mini-spinner"></div>
        <span>A carregar...</span>
      </div>

      <div v-else-if="entries.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <p>Sem dados disponíveis</p>
      </div>

      <div v-else class="entries-list">
        <div
          v-for="(entry, index) in entries"
          :key="entry.id"
          :class="[
            'entry-item',
            { 'current-user': entry.id === currentUserId },
            `position-${entry.position}`
          ]"
        >
          <!-- Position Badge -->
          <div :class="['position-badge', getPositionClass(entry.position)]">
            <span v-if="entry.position <= 3" class="medal">
              {{ getMedal(entry.position) }}
            </span>
            <span v-else class="position-number">{{ entry.position }}</span>
          </div>

          <!-- Player Avatar -->
          <div class="player-avatar">
            <img
              v-if="entry.photo_avatar_filename"
              :src="`/api/avatars/${entry.photo_avatar_filename}`"
              :alt="entry.name"
              class="avatar-image"
              @error="handleImageError"
            />
            <div v-else class="avatar-placeholder">
              {{ getInitials(entry.nickname || entry.name) }}
            </div>
          </div>

          <!-- Player Info -->
          <div class="player-info">
            <h4 class="player-name">
              {{ entry.nickname || entry.name }}
              <span v-if="entry.id === currentUserId" class="you-badge">Tu</span>
            </h4>
            <p class="player-stats">{{ getPlayerStats(entry) }}</p>
          </div>

          <!-- Main Stat -->
          <div class="main-stat">
            <span class="stat-value">{{ getMainStat(entry) }}</span>
            <span class="stat-unit">{{ getStatUnit() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- View More Button -->
    <div v-if="entries.length >= 5" class="view-more">
      <button @click="$emit('viewMore', type)" class="view-more-btn">
        Ver mais {{ title.toLowerCase() }}
        <span class="arrow">→</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  emoji: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  entries: {
    type: Array,
    default: () => []
  },
  currentUserId: {
    type: [String, Number],
    default: null
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['viewMore'])

// Methods
const getPositionClass = (position) => {
  switch(position) {
    case 1: return 'gold'
    case 2: return 'silver'
    case 3: return 'bronze'
    default: return 'regular'
  }
}

const getMedal = (position) => {
  switch(position) {
    case 1: return '🥇'
    case 2: return '🥈'
    case 3: return '🥉'
    default: return position
  }
}

const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
  event.target.parentNode.querySelector('.avatar-placeholder').style.display = 'flex'
}

const getPlayerStats = (entry) => {
  switch(props.type) {
    case 'mostWins':
      return `${entry.wins || 0} vitórias • ${(entry.win_rate || 0).toFixed(1)}% win rate`
    case 'mostMatches':
      return `${entry.total_matches || 0} partidas • ${(entry.match_win_rate || 0).toFixed(1)}% win rate`
    case 'mostGames':
      return `${entry.total_games || 0} jogos • ${(entry.win_rate || 0).toFixed(1)}% win rate`
    case 'bestWinRatio':
      return `${entry.total_games || 0} jogos • ${entry.wins || 0} vitórias`
    default:
      return ''
  }
}

const getMainStat = (entry) => {
  switch(props.type) {
    case 'mostWins':
      return entry.wins || 0
    case 'mostMatches':
      return entry.total_matches || 0
    case 'mostGames':
      return entry.total_games || 0
    case 'bestWinRatio':
      return (entry.win_rate || 0).toFixed(1)
    default:
      return 0
  }
}

const getStatUnit = () => {
  switch(props.type) {
    case 'bestWinRatio':
      return '%'
    default:
      return ''
  }
}
</script>

<style scoped>
.leaderboard-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.leaderboard-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* Section Header */
.section-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #f7fafc;
}

.section-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: bold;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-emoji {
  font-size: 1.5rem;
}

.section-description {
  margin: 0;
  font-size: 0.875rem;
  color: #718096;
}

/* Section Content */
.section-content {
  padding: 1rem 0;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #718096;
}

.mini-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #718096;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

/* Entries List */
.entries-list {
  padding: 0 0.5rem;
}

.entry-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.entry-item:hover {
  background: #f7fafc;
}

.entry-item.current-user {
  background: linear-gradient(90deg, #ebf8ff 0%, #e6fffa 100%);
  border: 2px solid #3182ce;
}

/* Position Badge */
.position-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.position-badge.gold {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  color: #744210;
}

.position-badge.silver {
  background: linear-gradient(45deg, #c0c0c0, #e2e8f0);
  color: #2d3748;
}

.position-badge.bronze {
  background: linear-gradient(45deg, #cd7f32, #d69e2e);
  color: #744210;
}

.position-badge.regular {
  background: #e2e8f0;
  color: #4a5568;
}

.medal {
  font-size: 1.2rem;
}

.position-number {
  font-size: 0.875rem;
}

/* Player Avatar */
.player-avatar {
  width: 40px;
  height: 40px;
  margin-right: 0.75rem;
  position: relative;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(45deg, #4299e1, #3182ce);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}

/* Player Info */
.player-info {
  flex: 1;
  min-width: 0;
}

.player-name {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.you-badge {
  background: #3182ce;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
}

.player-stats {
  margin: 0;
  font-size: 0.875rem;
  color: #718096;
}

/* Main Stat */
.main-stat {
  display: flex;
  flex-direction: column;
  align-items: end;
  text-align: right;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #3182ce;
}

.stat-unit {
  font-size: 0.75rem;
  color: #718096;
  margin-top: -0.25rem;
}

/* View More */
.view-more {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f7fafc;
}

.view-more-btn {
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  color: #3182ce;
  border: 2px solid #3182ce;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.view-more-btn:hover {
  background: #3182ce;
  color: white;
}

.arrow {
  transition: transform 0.3s ease;
}

.view-more-btn:hover .arrow {
  transform: translateX(4px);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
