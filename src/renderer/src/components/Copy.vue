<template>
  <div class="flex space-x-2 relative">
    <slot />
    <button class="absolute top-0 right-0 rounded-l-none btn btn-primary" @click="copyText">
      <img :src="copyIcon" alt="" class="w-5" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { defineComponent } from 'vue';
import copyIcon from '../assets/copy.png';
import Clipboard from '../helpers/clipboard';

const props = defineProps({
  textToCopy: {
    type: String,
    required: true
  }
});

async function copyText() {
  const cp = Clipboard({
    appendToBody: false
  });

  cp.toClipboard(props.textToCopy);
}
</script>
