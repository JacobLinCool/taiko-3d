import debug from "debug";

const log = debug("webgl:prog");

export interface ProgBindingSpec {
	attributes: string[];
	uniforms: string[];
}

export interface ProgBinding {
	attribute: Record<string, number>;
	uniform: Record<string, WebGLUniformLocation>;
}

export type ProgBindingOf<Spec extends ProgBindingSpec> = {
	attribute: Record<Spec["attributes"][number], number>;
	uniform: Record<Spec["uniforms"][number], WebGLUniformLocation>;
};

export class Prog<Binding extends ProgBinding = ProgBinding> {
	public readonly program: WebGLProgram;
	public readonly attribute: Binding["attribute"];
	public readonly uniform: Binding["uniform"];
	public readonly gl: WebGL2RenderingContext;
	public readonly code: { vertex: string; fragment: string };

	/**
	 * Please use `Prog.create` to create a new program!
	 */
	constructor(
		program: WebGLProgram,
		binding: Binding,
		gl: WebGL2RenderingContext,
		[vertex, fragment]: [string, string],
	) {
		this.program = program;
		this.attribute = binding.attribute;
		this.uniform = binding.uniform;
		this.gl = gl;
		this.code = { vertex, fragment };
	}

	public use() {
		log("Using program", this);
		this.gl.useProgram(this.program);
	}

	static create<Spec extends ProgBindingSpec>(
		gl: WebGL2RenderingContext,
		[vertex, fragment]: [string, string],
		spec: Spec,
	): Prog<ProgBindingOf<Spec>> {
		log("Creating program", { vertex, fragment, spec });

		const vshader = gl.createShader(gl.VERTEX_SHADER);
		if (!vshader) {
			throw new Error("Failed to create vertex shader");
		}
		gl.shaderSource(vshader, vertex);
		gl.compileShader(vshader);
		if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
			throw new Error("Failed to compile vertex shader: " + gl.getShaderInfoLog(vshader));
		}

		const fshader = gl.createShader(gl.FRAGMENT_SHADER);
		if (!fshader) {
			throw new Error("Failed to create fragment shader");
		}
		gl.shaderSource(fshader, fragment);
		gl.compileShader(fshader);
		if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
			throw new Error("Failed to compile fragment shader: " + gl.getShaderInfoLog(fshader));
		}

		const program = gl.createProgram();
		if (!program) {
			throw new Error("Failed to create program");
		}
		gl.attachShader(program, vshader);
		gl.attachShader(program, fshader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error("Failed to link program: " + gl.getProgramInfoLog(program));
		}

		gl.deleteShader(vshader);
		gl.deleteShader(fshader);

		const attribute = spec.attributes.reduce(
			(acc, name) => {
				const location = gl.getAttribLocation(program, name);
				if (location === -1) {
					throw new Error("Failed to get attribute location: " + name);
				}
				// @ts-expect-error
				acc[name] = location;
				return acc;
			},
			{} as Record<Spec["attributes"][number], number>,
		);

		const uniform = spec.uniforms.reduce(
			(acc, name) => {
				const location = gl.getUniformLocation(program, name);
				if (!location) {
					throw new Error("Failed to get uniform location: " + name);
				}
				// @ts-expect-error
				acc[name] = location;
				return acc;
			},
			{} as Record<Spec["uniforms"][number], WebGLUniformLocation>,
		);

		log("Program created", { program, attribute, uniform });
		return new Prog(program, { attribute, uniform }, gl, [vertex, fragment]);
	}
}
