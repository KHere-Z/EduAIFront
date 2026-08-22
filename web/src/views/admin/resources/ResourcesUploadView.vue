<template>
  <div class="ru-page">
    <div class="ru-head">
      <h2>📚 学习资源上传</h2>
      <p>选择学科 → 学段 → 教材 → 学期年级 → 章节 → 小节 逐级定位（支持「新增」），末级按类型 + 年份批量上传，统一 200 资源点</p>
    </div>

    <ResourceUploadPanel selectable-subject price-mode="fixed" :fixed-price="200" allow-add />
  </div>
</template>

<script setup>
import ResourceUploadPanel from '@/components/ResourceUploadPanel.vue'
</script>

<style scoped>
.ru-page { max-width: 860px; margin: 0 auto; padding: 24px 16px 48px }
.ru-head { margin-bottom: 18px }
.ru-head h2 { font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px }
.ru-head p { font-size: 13px; color: var(--text-muted) }
</style>
