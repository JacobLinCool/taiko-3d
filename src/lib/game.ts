import initWasm, { Engine, init, parse, update } from "$lib/taiko";
import wasmUrl from "$lib/taiko/taiko_wasm_bg.wasm?url";
import debug from "debug";
import { SoundEffect } from "./se";

const log = debug("game");

export class Game {
	public readonly se = new SoundEffect();
	public tja?: any;
	public engine?: Engine;
	public audio?: HTMLAudioElement;
	public actions: number[] = [];
	protected _last_update: number = 0;

	async init() {
		await initWasm(wasmUrl);
		await Promise.all([
			this.se.load("don", "/sound/don.wav"),
			this.se.load("kat", "/sound/kat.wav"),
		]);
		log("Game initialized");
	}

	async load(audio: string, tja: string) {
		const res = await fetch(tja);
		const text = await res.text();
		const data = parse(text);
		this.tja = JSON.parse(data);

		this.audio = new Audio(audio);
		this.audio.preload = "auto";
		this.audio.loop = false;
		this.audio.load();

		log("Game loaded");
	}

	async play(course: number) {
		if (!this.tja || !this.audio) {
			throw new Error("Game not loaded");
		}

		try {
			log("Game starting", this.tja, course);
			this.engine = init(JSON.stringify(this.tja), course);
			await this.audio.play();
			log("Game started");
		} catch (e) {
			alert(e);
		}
	}

	update(): OutState {
		if (!this.engine || !this.audio) {
			throw new Error("Game not loaded");
		}

		this._last_update = Date.now();

		const time = this.audio.currentTime + this.tja.header.offset;
		const action = this.actions.shift();
		const state = update(this.engine, time, action);
		const out = JSON.parse(state);

		if (action !== undefined) {
			log("Latency %d, Action: %d, State: %O", this.latency, action, out);
		}

		return out;
	}

	free() {
		if (this.engine) {
			this.engine.free();
		}
	}

	get latency() {
		return Date.now() - this._last_update;
	}
}

export interface OutState {
	current_combo: number;
	display: Display[];
	finished: boolean;
	gauge: number;
	judgement: any;
	max_combo: number;
	score: number;
}

export interface Display {
	idx: number;
	inner: Inner;
	visible_end: number;
	visible_start: number;
}

export interface Inner {
	duration: number;
	speed: number;
	start: number;
	type: string;
	variant: string;
	volume: number;
}
