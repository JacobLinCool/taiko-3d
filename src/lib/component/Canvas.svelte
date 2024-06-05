<script lang="ts">
	import { onMount } from "svelte";
	import { Game, type OutState } from "$lib/game";
	import { Camera } from "$lib/webgl/camera";
	import { Skybox } from "$lib/webgl/mod/skybox";
	import { Studio } from "$lib/webgl/studio";
	import { Main, type Item } from "$lib/webgl/mod/main";
	import { loadObj, type Obj } from "$lib/webgl/parse-obj";
	import { mat4 } from "gl-matrix";
	import { Tex } from "$lib/webgl/tex";

	export let ogg: string;
	export let tja: string;
	export let difficulty = 2;
	export let auto = false;
	export let auto_epsilon = 0.01;
	export let auto_combo_sampling = 0.5;

	let canvas: HTMLCanvasElement;

	// let studio: Studio;
	let game: Game;

	let gl: WebGL2RenderingContext;
	let studio: Studio;
	let player: Item;
	let mirror: Item;
	let box: Item;
	let disable_mirror = false;
	const cam1 = new Camera();
	const cam2 = new Camera();
	cam2.pos = { x: 0.2, y: 0.8, z: -0.1 };
	cam2.direction = { x: -0.2, y: -0.8, z: -0.1 };
	cam2.fov = 120;
	const mirror_cam = new Camera();
	mirror_cam.pos = { x: -0.7, y: 0.3, z: -0.4 };
	const pressed = new Set<string>();

	let cube: Obj;
	let sphere: Obj;
	let wbox: Obj;
	let mainctl: Main;

	let box_normal: WebGLTexture;

	onMount(async () => {
		gl = canvas.getContext("webgl2")!;
		if (!gl) {
			alert("WebGL2 is not available in your browser.");
			return;
		}

		studio = new Studio(gl);
		await studio.register((s) =>
			Skybox.init(s, {
				posx: "/skybox/px.webp",
				negx: "/skybox/nx.webp",
				posy: "/skybox/py.webp",
				negy: "/skybox/ny.webp",
				posz: "/skybox/pz.webp",
				negz: "/skybox/nz.webp",
			}),
		);
		mainctl = await studio.register((s) => Main.init(s));

		cube = await loadObj("/object/cube.obj");
		sphere = await loadObj("/object/sphere.obj");
		wbox = await loadObj("/object/wooden-box.obj");

		player = mainctl.add(cube);
		mat4.scale(player.matrix, player.matrix, [0.2, 0.2, 0.2]);

		{
			const line = mainctl.add(cube);
			line.color = [0.8, 0.8, 0.4];
			mat4.translate(line.matrix, line.matrix, [0, -0.15, -0.1]);
			mat4.scale(line.matrix, line.matrix, [0.5, 0.005, 0.01]);
		}
		{
			const line = mainctl.add(cube);
			line.color = [0.8, 0.8, 0.4];
			mat4.translate(line.matrix, line.matrix, [0, 0.15, -0.1]);
			mat4.scale(line.matrix, line.matrix, [0.5, 0.005, 0.01]);
		}
		{
			const line = mainctl.add(cube);
			line.color = [0.8, 0.8, 0.4];
			mat4.translate(line.matrix, line.matrix, [0.15, 0, -0.1]);
			mat4.scale(line.matrix, line.matrix, [0.005, 0.5, 0.01]);
		}
		{
			const line = mainctl.add(cube);
			line.color = [0.8, 0.8, 0.4];
			mat4.translate(line.matrix, line.matrix, [-0.15, 0, -0.1]);
			mat4.scale(line.matrix, line.matrix, [0.005, 0.5, 0.01]);
		}
		{
			box = mainctl.add(wbox);
			const tex = await Tex.load2d(gl, "/wooden-box.webp");
			box.tex = tex.texture;
			const normal = await Tex.load2d(gl, "/wooden-box-normal.webp");
			box_normal = normal.texture;
			mat4.translate(box.matrix, box.matrix, [-0.5, -0.3, 0.3]);
			mat4.scale(box.matrix, box.matrix, [0.3, 0.3, 0.3]);
		}

		mirror = mainctl.add(sphere);
		mat4.translate(mirror.matrix, mirror.matrix, [-0.7, 0.3, -0.4]);
		mat4.scale(mirror.matrix, mirror.matrix, [0.1, 0.1, 0.1]);

		game = new Game();
		await game.init();

		await game.load(ogg, tja);

		start();
	});

	let shadow: 0 | 1 | 2 = 0;
	let shadow_timer = 0;
	let display_state: OutState | null = null;
	let note_map = new Map<number, [Item, number, number]>();
	let judgement = "-";
	let judgement_timer = 0;
	let i = 0;
	let prev_time = Date.now();

	async function run() {
		move();

		if (pressed.has("n")) {
			box.normal = undefined;
		} else {
			box.normal = box_normal;
		}

		if (game.engine) {
			update();
		}

		if (i % 10 === 0 && !disable_mirror) {
			mirror.skip = true;
			mainctl.renderTex = false;
			const cube = await studio.renderCubemap(mirror_cam);
			mirror.cube = cube;
			mainctl.renderTex = true;
			mirror.skip = false;
		}

		if (pressed.has(" ")) {
			await studio.render(cam2);
		} else {
			await studio.render(cam1);
		}

		shadow_timer -= Date.now() - prev_time;
		if (shadow && shadow_timer <= 0) {
			shadow = 0;
			mainctl.lightColor = [1, 1, 1];
		}

		judgement_timer -= Date.now() - prev_time;
		if (judgement_timer <= 0) {
			judgement = "-";
		}

		i++;
		prev_time = Date.now();
		requestAnimationFrame(run);
	}

	function update() {
		const out = game.update();
		display_state = out;

		if (out.judgement && out.judgement !== "Nothing") {
			judgement = out.judgement;
			judgement_timer = 500;
		}

		// remove notes
		for (const [idx, [item, x, y]] of note_map) {
			if (!display_state.display.find((note) => note.idx === idx)) {
				mainctl.items = mainctl.items.filter((i) => i !== item);
				note_map.delete(idx);
			}
		}

		for (const note of display_state.display) {
			if (!note.visible_start || (note.inner.variant !== "Don" && note.inner.variant !== "Kat")) {
				continue;
			}

			if (!note_map.has(note.idx)) {
				const item = mainctl.add(sphere);
				const x = 0.2 - Math.random() * 0.4;
				const y = 0.2 - Math.random() * 0.4;
				note_map.set(note.idx, [item, x, y]);
				if (note.inner.variant === "Don") {
					item.color = [255 / 255, 174 / 255, 158 / 255];
				} else {
					item.color = [145 / 255, 205 / 255, 205 / 255];
				}
			}
			const [item, x, y] = note_map.get(note.idx)!;

			item.matrix = mat4.create();
			if (note.inner.type === "Big") {
				mat4.scale(item.matrix, item.matrix, [0.05, 0.05, 0.05]);
			} else {
				mat4.scale(item.matrix, item.matrix, [0.03, 0.03, 0.03]);
			}

			const m = mat4.create();
			const mid = (note.visible_start + note.visible_end) / 2;
			mat4.translate(m, m, [x, y, -mid]);
			mat4.multiply(item.matrix, m, item.matrix);
		}

		// handle auto mode
		if (auto) {
			const first = display_state.display[0];
			if (first && first.visible_start) {
				if (first.visible_start === first.visible_end) {
					if (Math.abs(first.visible_start - 0.1) <= auto_epsilon) {
						if (first.inner.variant === "Don") {
							don();
						} else {
							kat();
						}
					}
				} else {
					if (first.visible_start <= 0.1 && first.visible_end >= 0.1) {
						if (first.inner.variant === "Both") {
							if (Math.random() < auto_combo_sampling) {
								if (Math.random() < 0.5) {
									don();
								} else {
									kat();
								}
							}
						}
					}
				}
			}
		}
	}

	function start() {
		requestAnimationFrame(run);
	}

	function move() {
		// move
		if (pressed.has("ArrowUp")) {
			const dx = (cam1.direction.x - cam1.pos.x) * 0.02;
			const dy = (cam1.direction.y - cam1.pos.y) * 0.02;
			const dz = (cam1.direction.z - cam1.pos.z) * 0.02;
			cam1.pos.x += dx;
			cam1.pos.y += dy;
			cam1.pos.z += dz;

			const m = mat4.create();
			mat4.translate(m, m, [dx, dy, dz]);
			mat4.multiply(player.matrix, m, player.matrix);
		}
		if (pressed.has("ArrowDown")) {
			const dx = -(cam1.direction.x - cam1.pos.x) * 0.02;
			const dy = -(cam1.direction.y - cam1.pos.y) * 0.02;
			const dz = -(cam1.direction.z - cam1.pos.z) * 0.02;
			cam1.pos.x += dx;
			cam1.pos.y += dy;
			cam1.pos.z += dz;

			const m = mat4.create();
			mat4.translate(m, m, [dx, dy, dz]);
			mat4.multiply(player.matrix, m, player.matrix);
		}
	}

	function keydown(event: KeyboardEvent) {
		event.preventDefault();
		event.stopPropagation();

		pressed.add(event.key);

		if (event.key === "x") {
			disable_mirror = !disable_mirror;
		}

		if (game.engine) {
			if (event.key === "f" || event.key === "j") {
				don();
			}
			if (event.key === "d" || event.key === "k") {
				kat();
			}
		} else {
			if (event.key === "p") {
				game.play(difficulty);
			}
		}
	}

	function don() {
		game.se.play("don");
		game.actions.push(0);
		shadow = 1;
		mainctl.lightColor = [255 / 255, 174 / 255, 158 / 255];
		shadow_timer = 200;
	}

	function kat() {
		game.se.play("kat");
		game.actions.push(1);
		shadow = 2;
		mainctl.lightColor = [145 / 255, 205 / 255, 205 / 255];
		shadow_timer = 200;
	}

	function keyup(event: KeyboardEvent) {
		event.preventDefault();
		event.stopPropagation();

		pressed.delete(event.key);
	}

	function rotate(event: PointerEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (event.pointerType !== "mouse" || event.buttons & 1) {
			const dx = event.movementX;
			const dy = event.movementY;
			cam1.rotate(-dx * 0.01, -dy * 0.01);

			const m = mat4.create();
			mat4.rotateY(m, m, -dx * 0.01);
			mat4.multiply(player.matrix, player.matrix, m);

			const m2 = mat4.create();
			mat4.rotateX(m2, m2, -dy * 0.01);
			mat4.multiply(player.matrix, player.matrix, m2);
		}
	}

	function wheel(event: WheelEvent) {
		event.preventDefault();
		event.stopPropagation();
		const delta = Math.max(-5, Math.min(5, event.deltaY));
		cam1.zoom(delta);
	}
</script>

<svelte:document on:keydown={keydown} on:keyup={keyup} />

<main
	class="w-full h-full flex justify-center items-center flex-col gap-2 transition-all ease-in-out"
	class:bg-green-200={judgement === "Great"}
	class:bg-yellow-200={judgement === "Ok"}
	class:bg-red-200={judgement === "Miss"}
>
	<canvas
		bind:this={canvas}
		width="1000"
		height="1000"
		class="aspect-square max-w-full max-h-[80%] border border-black box-border shadow-lg transition-all ease-in-out"
		class:shadow-red-400={shadow === 1}
		class:shadow-blue-400={shadow === 2}
		on:click={start}
		on:pointermove={rotate}
		on:wheel={wheel}
	></canvas>

	<div class="p-2 h-32 overflow-auto">
		{#if display_state}
			<span class="font-bold italic text-lg">{judgement}</span> <br />
			Score: {display_state.score} <br />
			Combo: {display_state.current_combo} ({display_state.max_combo}) <br />
			{Math.round(display_state.gauge * 100)}% <br />
		{:else}
			Press <kbd class="kbd kbd-sm">p</kbd> to start <br />
			Use Arrow keys to move, Mouse to rotate, and Wheel to zoom <br />
			Press <kbd class="kbd kbd-sm">Space</kbd> to switch camera <br />
			Press <kbd class="kbd kbd-sm">f</kbd> or <kbd class="kbd kbd-sm">j</kbd> for Don, press
			<kbd class="kbd kbd-sm">d</kbd>
			or <kbd class="kbd kbd-sm">k</kbd> for Kat <br />
			Press <kbd class="kbd kbd-sm">x</kbd> to toggle mirror, which may improve performance. <br />
			Press <kbd class="kbd kbd-sm">n</kbd> to toggle bump mapping for wooden box. <br />
		{/if}
		{#if disable_mirror}
			<span class="italic">Mirror disabled</span>
		{/if}
	</div>
</main>
