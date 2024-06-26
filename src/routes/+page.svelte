<script lang="ts">
	import "../app.css";
	import debug from "debug";
	import Canvas from "$lib/component/Canvas.svelte";
	import Fps from "$lib/component/FPS.svelte";
	import { page } from "$app/stores";

	const qs = $page.url.searchParams;
	const ext = qs.get("ogg") && qs.get("tja");
	const auto = !!qs.get("auto");
	const auto_epsilon = parseFloat(qs.get("ep") || "0.01") || 0.01;
	const auto_combo_sampling = parseInt(qs.get("cs") || "0.5") || 0.5;

	const songs = {
		選擇歌曲: {
			ogg: "",
			tja: "",
		},
		"名探偵コナン メイン・テーマ": {
			ogg: "/game/1.2.062 名探偵コナン メイン・テーマ/名探偵コナン メイン・テーマ.mp3",
			tja: "/game/1.2.062 名探偵コナン メイン・テーマ/名探偵コナン メイン・テーマ.tja",
		},
		前前前世: {
			ogg: "/game/1.2.037 前前前世/前前前世.mp3",
			tja: "/game/1.2.037 前前前世/前前前世.tja",
		},
		千本桜: {
			ogg: "/game/1.3.006 千本桜/千本桜.mp3",
			tja: "/game/1.3.006 千本桜/千本桜.tja",
		},
		conflict: {
			ogg: "/game/1.5.035 conflict/conflict.mp3",
			tja: "/game/1.5.035 conflict/conflict.tja",
		},
		Nosferatu: {
			ogg: "/game/1.7.005 Nosferatu/Nosferatu.mp3",
			tja: "/game/1.7.005 Nosferatu/Nosferatu.tja",
		},
		零の夜想曲: {
			ogg: "/game/1.7.334 零の夜想曲/零の夜想曲.mp3",
			tja: "/game/1.7.334 零の夜想曲/零の夜想曲.tja",
		},
		第六天魔王: {
			ogg: "/game/1.7.483 第六天魔王/第六天魔王.mp3",
			tja: "/game/1.7.483 第六天魔王/第六天魔王.tja",
		},
		[ext ? "外部歌曲" : "無外部歌曲 (?ogg=<ogg>&tja=<tja>)"]: {
			ogg: qs.get("ogg") || "",
			tja: qs.get("tja") || "",
		},
		本機歌曲: {
			ogg: "",
			tja: "",
		},
	};

	let song = ext ? "外部歌曲" : Object.keys(songs)[0];
	$: ogg = songs[song]?.ogg;
	$: tja = songs[song]?.tja;

	let difficulty = -1;

	const diff: Record<number, string> = {
		"-1": "選擇難度",
		0: "簡單",
		1: "普通",
		2: "困難",
		3: "ㄜ...?",
	};

	let local_input: HTMLInputElement;
	let local_files: FileList;
	async function upload() {
		if (local_files.length !== 2) {
			alert("請選擇一個 .ogg 或 .mp3 檔案和一個 .tja 檔案");
			return;
		}

		const files = Array.from({ length: local_files.length }, (_, i) => local_files.item(i));
		const ogg_file = files.find((f) => f?.name.endsWith(".ogg") || f?.name.endsWith(".mp3"));
		const tja_file = files.find((f) => f?.name.endsWith(".tja"));

		if (!ogg_file || !tja_file) {
			alert("請選擇一個 .ogg 或 .mp3 檔案和一個 .tja 檔案");
			return;
		}

		const ogg_url = URL.createObjectURL(ogg_file);
		const tja_url = URL.createObjectURL(tja_file);

		songs["本機歌曲"] = { ogg: ogg_url, tja: tja_url };
		ogg = ogg_url;
		tja = tja_url;
	}

	function song_change() {
		if (song === "本機歌曲" && !songs["本機歌曲"].ogg) {
			local_input.click();
		}
	}

	debug.enable("game*, se*");
</script>

<svelte:head>
	<title>Taiko 3D - NTNU CSIE CG 2024</title>
</svelte:head>

{#if ogg && tja && difficulty >= 0}
	<Canvas {ogg} {tja} {difficulty} {auto} {auto_epsilon} {auto_combo_sampling} />
{:else}
	<!-- selectors -->
	<main class="w-full h-full flex justify-center items-center flex-col gap-4 p-2">
		<select class="select select-bordered w-80" bind:value={song} on:change={song_change}>
			{#each Object.keys(songs) as song}
				<option value={song} disabled={song.includes("無外部歌曲")}>
					{song}
				</option>
			{/each}
		</select>
		<select class="select select-bordered w-80" bind:value={difficulty}>
			{#each [-1, 0, 1, 2, 3] as d}
				<option value={d} disabled={d < 0}>{diff[d]}</option>
			{/each}
		</select>
		<div class="prose overflow-auto">
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

<input
	type="file"
	accept=".mp3,.ogg,.tja"
	multiple
	class="hidden"
	bind:files={local_files}
	on:change={upload}
	bind:this={local_input}
/>
