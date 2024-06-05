<script lang="ts">
	import { onMount } from "svelte";

	const samples: number[] = [];
	let fps = 0;

	onMount(() => {
		requestAnimationFrame(function loop() {
			const sample = Date.now();
			samples.push(sample);
			if (samples.length > 60) {
				samples.shift();
			}

			if (samples.length > 1) {
				fps =
					Math.round(((samples.length - 1) / (samples[samples.length - 1] - samples[0])) * 10000) /
					10;
			}

			requestAnimationFrame(loop);
		});
	});
</script>

<div class="absolute bottom-0 right-0 p-2 bg-white/50">
	<span class="font-mono">FPS {fps.toFixed(1)}</span>
</div>
