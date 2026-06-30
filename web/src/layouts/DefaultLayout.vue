<template>
  <router-view />
</template>

<script setup>
import { useAuthStore } from '@/store/auth'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

onMounted(() => {
  if (!auth.token) {
    router.push('/login')
  }
})
</script>
