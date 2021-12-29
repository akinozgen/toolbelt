<template>
    <div class="copy-value">
        <slot />
        <i class="copy-target" @click="copyText">
            <img :src="copyIcon"
                    alt="">
        </i>
    </div>
</template>

<script lang="ts" setup>
import { defineComponent } from "vue";
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