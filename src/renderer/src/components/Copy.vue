<template>
  <div class="flex gap-2 w-full">
    <div class="flex-1 min-w-0">
      <slot />
    </div>
    <button class="btn btn-secondary flex-shrink-0" @click="copyText" :title="copied ? 'Copied!' : 'Copy'">
      <Check v-if="copied" :size="14" />
      <ClipboardCopy v-else :size="14" />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Check, ClipboardCopy } from 'lucide-vue-next';
import Clipboard from '../helpers/clipboard';

const props = defineProps({
  textToCopy: {
    type: String,
    required: true
  }
});

const copied = ref(false);

async function copyText() {
  const cp = Clipboard({ appendToBody: false });
  cp.toClipboard(props.textToCopy);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>
