let wasm;
export function __wbg_set_wasm(val) {
	wasm = val;
}

const lTextDecoder =
	typeof TextDecoder === "undefined" ? (0, module.require)("util").TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder("utf-8", { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = null;

function getUint8Memory0() {
	if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
		cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
	}
	return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
	ptr = ptr >>> 0;
	return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder =
	typeof TextEncoder === "undefined" ? (0, module.require)("util").TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder("utf-8");

const encodeString =
	typeof cachedTextEncoder.encodeInto === "function"
		? function (arg, view) {
				return cachedTextEncoder.encodeInto(arg, view);
			}
		: function (arg, view) {
				const buf = cachedTextEncoder.encode(arg);
				view.set(buf);
				return {
					read: arg.length,
					written: buf.length,
				};
			};

function passStringToWasm0(arg, malloc, realloc) {
	if (realloc === undefined) {
		const buf = cachedTextEncoder.encode(arg);
		const ptr = malloc(buf.length, 1) >>> 0;
		getUint8Memory0()
			.subarray(ptr, ptr + buf.length)
			.set(buf);
		WASM_VECTOR_LEN = buf.length;
		return ptr;
	}

	let len = arg.length;
	let ptr = malloc(len, 1) >>> 0;

	const mem = getUint8Memory0();

	let offset = 0;

	for (; offset < len; offset++) {
		const code = arg.charCodeAt(offset);
		if (code > 0x7f) break;
		mem[ptr + offset] = code;
	}

	if (offset !== len) {
		if (offset !== 0) {
			arg = arg.slice(offset);
		}
		ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0;
		const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
		const ret = encodeString(arg, view);

		offset += ret.written;
		ptr = realloc(ptr, len, offset, 1) >>> 0;
	}

	WASM_VECTOR_LEN = offset;
	return ptr;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
	if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
		cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
	}
	return cachedInt32Memory0;
}
/**
 * @param {string} tja
 * @returns {string}
 */
export function parse(tja) {
	let deferred2_0;
	let deferred2_1;
	try {
		const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
		const ptr0 = passStringToWasm0(tja, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len0 = WASM_VECTOR_LEN;
		wasm.parse(retptr, ptr0, len0);
		var r0 = getInt32Memory0()[retptr / 4 + 0];
		var r1 = getInt32Memory0()[retptr / 4 + 1];
		deferred2_0 = r0;
		deferred2_1 = r1;
		return getStringFromWasm0(r0, r1);
	} finally {
		wasm.__wbindgen_add_to_stack_pointer(16);
		wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
	}
}

/**
 * @param {string} tja
 * @param {number} difficulty
 * @returns {Engine}
 */
export function init(tja, difficulty) {
	const ptr0 = passStringToWasm0(tja, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
	const len0 = WASM_VECTOR_LEN;
	const ret = wasm.init(ptr0, len0, difficulty);
	return Engine.__wrap(ret);
}

function _assertClass(instance, klass) {
	if (!(instance instanceof klass)) {
		throw new Error(`expected instance of ${klass.name}`);
	}
	return instance.ptr;
}

function isLikeNone(x) {
	return x === undefined || x === null;
}
/**
 * @param {Engine} engine
 * @param {number} time
 * @param {number | undefined} [hit]
 * @returns {string}
 */
export function update(engine, time, hit) {
	let deferred1_0;
	let deferred1_1;
	try {
		const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
		_assertClass(engine, Engine);
		wasm.update(retptr, engine.__wbg_ptr, time, isLikeNone(hit) ? 0xffffff : hit);
		var r0 = getInt32Memory0()[retptr / 4 + 0];
		var r1 = getInt32Memory0()[retptr / 4 + 1];
		deferred1_0 = r0;
		deferred1_1 = r1;
		return getStringFromWasm0(r0, r1);
	} finally {
		wasm.__wbindgen_add_to_stack_pointer(16);
		wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
	}
}

const EngineFinalization =
	typeof FinalizationRegistry === "undefined"
		? { register: () => {}, unregister: () => {} }
		: new FinalizationRegistry((ptr) => wasm.__wbg_engine_free(ptr >>> 0));
/**
 */
export class Engine {
	static __wrap(ptr) {
		ptr = ptr >>> 0;
		const obj = Object.create(Engine.prototype);
		obj.__wbg_ptr = ptr;
		EngineFinalization.register(obj, obj.__wbg_ptr, obj);
		return obj;
	}

	__destroy_into_raw() {
		const ptr = this.__wbg_ptr;
		this.__wbg_ptr = 0;
		EngineFinalization.unregister(this);
		return ptr;
	}

	free() {
		const ptr = this.__destroy_into_raw();
		wasm.__wbg_engine_free(ptr);
	}
}

export function __wbindgen_throw(arg0, arg1) {
	throw new Error(getStringFromWasm0(arg0, arg1));
}
