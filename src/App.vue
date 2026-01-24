<script setup lang="ts"></script>

<template>
  <header>
    <nav>
      <RouterLink to="/">首页</RouterLink> | <RouterLink to="/order-tracker">订单追踪</RouterLink> |
      <RouterLink to="/data-uploader">数据上传</RouterLink> |
      <RouterLink to="/review-inbox">订单审批</RouterLink> |
    </nav>
  </header>

  <RouterView />
</template>

<style scoped></style>
