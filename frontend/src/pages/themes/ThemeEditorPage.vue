<template>
    <div class="max-w-4xl mx-auto p-6">
        <h1 class="text-3xl font-bold mb-8">Create Board Theme</h1>

        <div class="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Theme Details</CardTitle>
                    <CardDescription>Set up your memory game theme</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="space-y-2">
                        <Label for="theme-name">Theme Name</Label>
                        <Input id="theme-name" v-model="themeName" placeholder="Enter theme name" :disabled="saving" />
                    </div>

                    <div class="space-y-2">
                        <Label for="theme-description">Description (optional)</Label>
                        <Input id="theme-description" v-model="themeDescription" placeholder="Enter theme description"
                            :disabled="saving" />
                    </div>

                    <div class="space-y-2">
                        <Label for="visibility">Visibility</Label>
                        <Select v-model="visibility" :disabled="saving">
                            <SelectTrigger id="visibility">
                                <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PR">Private (only you)</SelectItem>
                                <SelectItem value="PU">Public (everyone)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Card Images</CardTitle>
                    <CardDescription>
                        Upload 8 images for your memory game ({{ cardFacesURLs.length }}/8 uploaded)
                    </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="space-y-2">
                        <Button @click="open" type="button" variant="outline" :disabled="saving || isUploading">
                            {{ isUploading ? 'Uploading...' : 'Select Images (up to 8)' }}
                        </Button>
                        <Button v-if="files" @click="uploadImages">Save Photo</Button>
                        <Button v-if="files" @click="reset" variant="ghost">
                            Cancel
                        </Button>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div v-for="(image, index) in cardFacesURLs" :key="index" class="aspect-square">
                            <img :src="`${serverBaseURL}${image.cardface_url}`" :alt="`Card ${index + 1}`"
                                class="w-full h-full object-cover" />
                        </div>
                    </div>
                </CardContent>

                <CardFooter class="flex gap-4">
                    <Button @click="saveTheme" class="flex-1">Create Theme </Button>
                    <Button @click="$router.back()" variant="outline" :disabled="saving">
                        Cancel
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { useFileDialog } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const router = useRouter()
const apiStore = useAPIStore()
const authStore = useAuthStore()

const serverBaseURL = inject("serverBaseURL")

const themeName = ref('')
const themeDescription = ref('')
const visibility = ref('PR')
const isUploading = ref(false)
const saving = ref(false)
const cardFacesURLs = ref([])

const { files, open, reset } = useFileDialog({
    accept: 'image/*',
    multiple: true
})

const uploadImages = async () => {

    try {
        const response = await apiStore.uploadCardFaces(files.value)
        if (response.data && response.data.files) {
          cardFacesURLs.value = response.data.files
            reset()
        }
    } catch (error) {
        console.error('Failed to upload card faces:', error)
        toast.success("Failed to upload card faces. Please try again.")
    }
}

const saveTheme = async () => {

    try {
        const themeData = {
            name: themeName.value,
            description: themeDescription.value,
            visibility: visibility.value,
            user_id: authStore.currentUser.id
        }
        const boardTheameResponse = await apiStore.postBoardTheme(themeData)
        for (let face of cardFacesURLs.value) {
              let cardFaceData = {
                  board_theme_id: boardTheameResponse.data.data.id,
                  face_image_url: face.cardface_url
              }
              await apiStore.postCardFace(cardFaceData)
          }
          toast.success('Theme created successfully')
          router.push('/themes')
    } catch (error) {
        console.error('Failed to save theme:', error)
        toast.error('Failed to save theme')
    } finally {
        saving.value = false
    }
}

</script>
