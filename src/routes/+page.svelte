<script lang="ts">
	import "../app.css";
	import debug from "debug";
	import Canvas from "$lib/component/Canvas.svelte";
	import Fps from "$lib/component/FPS.svelte";

	const songs = {
		選擇歌曲: {
			ogg: "",
			tja: "",
		},
		"名探偵コナン メイン・テーマ": {
			ogg: "/game/1.2.062 名探偵コナン メイン・テーマ/名探偵コナン メイン・テーマ.ogg",
			tja: "/game/1.2.062 名探偵コナン メイン・テーマ/名探偵コナン メイン・テーマ.tja",
		},
		前前前世: {
			ogg: "/game/1.2.037 前前前世/前前前世.ogg",
			tja: "/game/1.2.037 前前前世/前前前世.tja",
		},
		千本桜: {
			ogg: "/game/1.3.006 千本桜/千本桜.ogg",
			tja: "/game/1.3.006 千本桜/千本桜.tja",
		},
		conflict: {
			ogg: "/game/1.5.035 conflict/conflict.ogg",
			tja: "/game/1.5.035 conflict/conflict.tja",
		},
		Nosferatu: {
			ogg: "/game/1.7.005 Nosferatu/Nosferatu.ogg",
			tja: "/game/1.7.005 Nosferatu/Nosferatu.tja",
		},
		零の夜想曲: {
			ogg: "/game/1.7.334 零の夜想曲/零の夜想曲.ogg",
			tja: "/game/1.7.334 零の夜想曲/零の夜想曲.tja",
		},
		第六天魔王: {
			ogg: "/game/1.7.483 第六天魔王/第六天魔王.ogg",
			tja: "/game/1.7.483 第六天魔王/第六天魔王.tja",
		},
	};

	let song: keyof typeof songs = Object.keys(songs)[0] as any;
	$: ogg = songs[song]?.ogg;
	$: tja = songs[song]?.tja;

	let difficulty = -1;

	debug.enable("game*");

	const diff: Record<number, string> = {
		"-1": "選擇難度",
		0: "簡單",
		1: "普通",
		2: "困難",
		3: "ㄜ...?",
	};
</script>

<svelte:head>
	<title>Taiko 3D - NTNU CSIE CG 2024</title>
</svelte:head>

{#if ogg && tja && difficulty >= 0}
	<Canvas {ogg} {tja} {difficulty} />
{:else}
	<!-- selectors -->
	<main class="w-full h-full flex justify-center items-center flex-col gap-4 p-2">
		<select class="select select-bordered w-80" bind:value={song}>
			{#each Object.keys(songs) as song}
				<option value={song}>{song}</option>
			{/each}
		</select>
		<select class="select select-bordered w-80" bind:value={difficulty}>
			{#each [-1, 0, 1, 2, 3] as d}
				<option value={d}>{diff[d]}</option>
			{/each}
		</select>
		<div class="prose flex-1 overflow-auto">
			<a href="https://github.com/JacobLinCool/rhythm-rs" target="_blank"
				>The headless game engine is written in Rust</a
			>
			and compiled to WebAssembly. <br />
			It uses WebGL for 3D rendering and Audio/AudioContext for music and sound effects.
			<hr />
			The player is a big white cube, you can rotate and move it with first-person view controls. The
			third-person view is a fixed camera.<br />
			A point light with local illumination has been implemented, it has three colors that respond to
			the game actions. <br />
			The wooden box has a nice texture with bump mapping. <br />
			The sphere mirror is implemented with dynamic reflection. <br />
			The note spheres are coming to you with the music, you can hit them when they approach the yellow
			hit zone. <br />
			<hr />
			<span class="font-bold">Copyright Notice</span> <br />
			All songs, TJA, and OBJ files are from the internet, the original author holds the copyright. The
			environment map is my own creation, I took the photo at 太平山 in a random day.
		</div>
	</main>
{/if}

<Fps />
