<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-8">My Profile</h1>

    <div v-if="authStore.currentUser" class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Update your profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col sm:flex-row items-start gap-6">
            <div class="flex-shrink-0">
              <Avatar class="w-32 h-32">
                <AvatarImage
                  v-if="authStore.currentUser.photo_avatar_filename"
                  :src="`${serverBaseURL}/storage/photos_avatars/${authStore.currentUser.photo_avatar_filename}`"
                  :alt="authStore.currentUser.name"
                />
                <AvatarFallback class="text-4xl">
                  {{ authStore.currentUser.name?.charAt(0).toUpperCase() }}
                </AvatarFallback>
              </Avatar>
            </div>

            <div class="flex-1 space-y-3">
              <div class="flex flex-wrap gap-2">
                <Button @click="open" variant="outline"> Choose Photo </Button>
                <Button v-if="files" @click="uploadPhoto">Save Photo</Button>
                <Button v-if="files" @click="reset" variant="ghost"> Cancel </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" v-model="formData.name" placeholder="Enter your name" />
          </div>
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="formData.email"
              type="email"
              placeholder="Enter your email"
            />
          </div>
        </CardContent>
        <CardFooter class="flex justify-between">
          <Button @click="saveProfile"> Save Changes </Button>
        </CardFooter>
      </Card>

      <Card v-if="authStore.currentUser?.type !== 'A'">
        <CardFooter class="flex justify-between">
          <Button @click="confirmDelete" variant="destructive"> Delete Account </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { useFileDialog } from '@vueuse/core'
import { toast } from 'vue-sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const apiStore = useAPIStore()
const router = useRouter()

const serverBaseURL = inject('serverBaseURL')

const formData = ref({
  name: '',
  email: '',
})

watch(
  () => authStore.currentUser,
  (user) => {
    if (user) {
      formData.value = {
        name: user.name || '',
        email: user.email || '',
      }
    }
  },
  { immediate: true },
)

const { files, open, reset } = useFileDialog({
  accept: 'image/*',
  multiple: false,
})

const uploadPhoto = async () => {
  try {
    const response = await apiStore.uploadProfilePhoto(files.value[0])

    // ADICIONA ISTO PARA DEBUG
    console.log('Resposta do Upload:', response.data)

    // Tenta capturar o nome corretamente.
    // Se a resposta for { "location": "photos/abc.jpg" }, tens de usar .location
    const uploadedFilename = response.data.filename || response.data.location || response.data

    console.log('Nome do ficheiro a enviar:', uploadedFilename) // ISTO NÃO PODE SER UNDEFINED

    if (uploadedFilename) {
      await apiStore.patchUserPhoto(authStore.currentUser.id, uploadedFilename)
      await authStore.getUser()
      toast.success('Profile photo updated successfully')
      reset()
    }
  } catch (error) {
    ;+console.error('Failed to upload photo:', error)
    toast.error('Failed to upload photo. Please try again.')
  }
}

const saveProfile = async () => {
  try {
    const user = Object.assign({}, authStore.currentUser)

    user.name = formData.value.name
    user.email = formData.value.email

    await apiStore.putUser(user)
    await authStore.getUser()
    toast.success('Profile updated successfully')
  } catch (error) {
    console.error('Failed to update profile:', error)
    toast.error('Failed to update profile. Please try again.')
  }
}

const confirmDelete = async () => {
  // ask for final confirmation
  if (
    !confirm('Tem a certeza que pretende eliminar a sua conta? Esta ação não pode ser desfeita.')
  ) {
    return
  }

  // prompt for current password (backend expects current_password)
  const currentPassword = prompt('Por favor insira a sua password atual para confirmar:')
  if (currentPassword === null) {
    // user cancelled the prompt
    return
  }

  try {
    // call API with the provided password
    await authStore.deleteAccount(currentPassword)

    // After account deletion the current token may be invalidated.
    // Attempt to logout, but ignore 401 (token already revoked) so the UX is smooth.
    try {
      await authStore.logout()
    } catch (logoutErr) {
      const status = logoutErr?.response?.status
      if (status === 401) {
        // Token already invalid/removed on server side; no action required.
        console.warn('Logout returned 401 after account deletion — ignoring.')
      } else {
        // rethrow other logout errors to be handled below
        throw logoutErr
      }
    }

    toast.success('Account deleted successfully')
    router.push('/')
  } catch (error) {
    console.error('Failed to delete account:', error)
    const msg = error?.response?.data?.message ?? error?.message ?? 'Please try again.'
    toast.error(`Failed to delete account - ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`)
  }
}
</script>
