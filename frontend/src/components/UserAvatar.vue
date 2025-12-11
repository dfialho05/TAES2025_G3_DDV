<script setup>
import { ref, computed, inject } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  size: {
    type: String,
    default: 'md', // xs, sm, md, lg, xl
  },
  showFallback: {
    type: Boolean,
    default: true,
  },
  debug: {
    type: Boolean,
    default: false,
  },
})

const serverBaseURL = inject('serverBaseURL')
const imageError = ref(false)
const imageLoading = ref(false)
const imageLoaded = ref(false)

// Debug serverBaseURL injection
if (!serverBaseURL) {
  console.error('UserAvatar: serverBaseURL not injected properly')
}

// Computed para o tamanho do avatar
const avatarSizeClass = computed(() => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-32 h-32',
  }
  return sizes[props.size] || sizes.md
})

// Computed para o tamanho do texto do fallback
const fallbackTextSize = computed(() => {
  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-4xl',
  }
  return textSizes[props.size] || textSizes.md
})

// URL da imagem com fallback
const imageUrl = computed(() => {
  if (!serverBaseURL) {
    if (props.debug) {
      console.error('UserAvatar: serverBaseURL is not available')
    }
    return null
  }

  if (!props.user?.photo_avatar_filename || imageError.value) {
    if (props.debug) {
      console.log('UserAvatar: No image URL', {
        hasUser: !!props.user,
        hasFilename: !!props.user?.photo_avatar_filename,
        filename: props.user?.photo_avatar_filename,
        hasError: imageError.value,
        serverBaseURL,
      })
    }
    return null
  }
  const url = `${serverBaseURL}/api/avatars/${props.user.photo_avatar_filename}`
  if (props.debug) {
    console.log('UserAvatar: Generated image URL', {
      user: props.user?.name,
      filename: props.user.photo_avatar_filename,
      serverBaseURL,
      url,
    })
  }
  return url
})

// Iniciais do nome para fallback
const initials = computed(() => {
  if (!props.user?.name) return '?'

  const nameParts = props.user.name.trim().split(' ')
  if (nameParts.length >= 2) {
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }
  return props.user.name.charAt(0).toUpperCase()
})

// Lidar com erro de carregamento da imagem
const handleImageError = (event) => {
  imageError.value = true
  imageLoading.value = false
  if (props.debug) {
    console.warn('UserAvatar: Failed to load image', imageUrl.value, event)
  }
}

// Lidar com carregamento bem-sucedido
const handleImageLoad = () => {
  imageLoaded.value = true
  imageLoading.value = false
  if (props.debug) {
    console.log('UserAvatar: Image loaded successfully', imageUrl.value)
  }
}

// Resetar estados quando o usuário muda
const resetImageError = () => {
  if (props.debug) {
    console.log('UserAvatar: Resetting image states', {
      user: props.user?.name,
      previousError: imageError.value,
    })
  }
  imageError.value = false
  imageLoaded.value = false
  imageLoading.value = !!imageUrl.value
}

// Watch para resetar erro quando user muda
import { watch } from 'vue'
watch(
  () => props.user?.id,
  () => {
    resetImageError()
  },
)
</script>

<template>
  <div
    :class="avatarSizeClass"
    class="ring-1 ring-slate-100 shadow-sm relative overflow-hidden rounded-full bg-gradient-to-br from-slate-100 to-slate-200"
  >
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="user?.name || 'User avatar'"
      class="w-full h-full object-cover transition-opacity duration-200"
      :class="{ 'opacity-50': imageLoading && !imageLoaded }"
      @error="handleImageError"
      @load="handleImageLoad"
    />
    <div
      v-if="showFallback && (!imageUrl || imageError)"
      :class="fallbackTextSize"
      class="absolute inset-0 flex items-center justify-center text-slate-600 font-semibold bg-gradient-to-br from-slate-100 to-slate-200"
    >
      {{ initials }}
    </div>
  </div>
</template>
