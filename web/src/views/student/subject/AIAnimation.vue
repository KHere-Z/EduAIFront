<template><div class="page-container"><router-link :to="backLink" class="back-link">← 返回学科中心</router-link><div class="page-header"><div><h2>AI动图</h2><p>上传动点题 → AI生成动态演示</p></div></div><el-card><el-empty description="功能开发中，后端API待对接" :image-size="120"/></el-card></div></template>
<script setup>import { computed } from 'vue'; import { useRoute } from 'vue-router'
const route = useRoute(); const backLink = computed(() => route.path.startsWith('/teacher')?'/teacher/subject/math':'/student/subject/math')</script>
