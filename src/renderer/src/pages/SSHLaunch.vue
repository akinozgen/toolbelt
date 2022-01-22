<template>
  <h1 class="page-title left">SSH Profiles</h1>
  <div class="page-full-height-scrollable">
    <section class="ssh-list">
      <div class="ssh-list-item" v-for="profile in sshProfiles" :key="profile.id"></div>
    </section>
  </div>
</template>
<script lang="ts" setup>
import StoredValue from '../helpers/localStorage';
import { ref, computed } from 'vue';
</script>
