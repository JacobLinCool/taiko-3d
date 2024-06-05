import debug from "debug";
import { mat4 } from "gl-matrix";
import type { Camera } from "../camera";
import { Mod } from "../mod";
import { Prog, type ProgBindingOf } from "../prog";
import type { Studio } from "../studio";
import type { TexCubeSpec } from "../tex";
import { Tex } from "../tex";

import SKYBOX_FRAGMENT_SHADER from "$lib/shader/skybox-fshader.glsl?raw";
import SKYBOX_VERTEX_SHADER from "$lib/shader/skybox-vshader.glsl?raw";

const log = debug("webgl:mod:skybox");

export class Skybox extends Mod {
	constructor(
		protected vao: WebGLVertexArrayObject,
		protected prog: Prog<
			ProgBindingOf<{
				attributes: ["a_position"];
				uniforms: ["u_skybox", "u_viewDirectionProjectionInverse"];
			}>
		>,
		protected tex: Tex,
	) {
		super();
	}

	static async init(studio: Studio, cube: TexCubeSpec): Promise<Skybox> {
		const gl = studio.gl;

		const prog = Prog.create(gl, [SKYBOX_VERTEX_SHADER, SKYBOX_FRAGMENT_SHADER], {
			attributes: ["a_position"],
			uniforms: ["u_skybox", "u_viewDirectionProjectionInverse"],
		});

		const tex = await Tex.cubemap(gl, cube);

		const vao = gl.createVertexArray();
		if (!vao) {
			throw new Error("Failed to create vertex array for skybox");
		}
		gl.bindVertexArray(vao);

		const vbo = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			gl.STATIC_DRAW,
		);

		gl.enableVertexAttribArray(prog.attribute.a_position);
		gl.vertexAttribPointer(prog.attribute.a_position, 2, gl.FLOAT, false, 0, 0);

		gl.bindVertexArray(null);

		log("Skybox module initialized");
		return new Skybox(vao, prog, tex);
	}

	async render(camera: Camera, studio: Studio): Promise<void> {
		const pos = camera.pos;
		camera.pos = { x: 0, y: 0, z: 0 };
		const vpi = mat4.invert(mat4.create(), camera.vp);
		camera.pos = pos;

		this.prog.use();

		this.tex.activate();
		this.tex.bind();

		const gl = studio.gl;
		gl.bindVertexArray(this.vao);
		gl.uniform1i(this.prog.uniform.u_skybox, 0);
		gl.uniformMatrix4fv(this.prog.uniform.u_viewDirectionProjectionInverse, false, vpi);

		gl.drawArrays(gl.TRIANGLES, 0, 6);

		gl.bindVertexArray(null);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	}
}
