/* tslint:disable */
/* eslint-disable */
/**
 * @param {string} tja
 * @returns {string}
 */
export function parse(tja: string): string;
/**
 * @param {string} tja
 * @param {number} difficulty
 * @returns {Engine}
 */
export function init(tja: string, difficulty: number): Engine;
/**
 * @param {Engine} engine
 * @param {number} time
 * @param {number | undefined} [hit]
 * @returns {string}
 */
export function update(engine: Engine, time: number, hit?: number): string;
/**
 */
export class Engine {
	free(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
	readonly memory: WebAssembly.Memory;
	readonly __wbg_engine_free: (a: number) => void;
	readonly parse: (a: number, b: number, c: number) => void;
	readonly init: (a: number, b: number, c: number) => number;
	readonly update: (a: number, b: number, c: number, d: number) => void;
	readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
	readonly __wbindgen_malloc: (a: number, b: number) => number;
	readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
	readonly __wbindgen_free: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {SyncInitInput} module
 *
 * @returns {InitOutput}
 */
export function initSync(module: SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {InitInput | Promise<InitInput>} module_or_path
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
	module_or_path?: InitInput | Promise<InitInput>,
): Promise<InitOutput>;
