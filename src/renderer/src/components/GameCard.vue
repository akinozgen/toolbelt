<template>
	<a
		class="game-card shadow-md hover:shadow-lg transition rounded"
		:href="`steam://run/${props.steam_appid}`"
	>
		<div
			class="h-64 bg-cover hover:bg-gray bg-center bg-cover"
			:style="{ 'background-image': `url('${props.header_image}')` }"
		></div>
		<div class="mx-6 my-4">
			<div class="font-medium text-base text-gray-darker mb-4">{{ props.name }}</div>
		</div>
	</a>
</template>

<script lang="ts" setup>
import { computed, ref, defineComponent, defineProps } from 'vue';

const props = defineProps({
	steam_appid: {
		type: Number,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	header_image: {
		type: String,
		required: true
	}
});
</script>
