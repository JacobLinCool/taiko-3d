import debug from "debug";
import type { Camera } from "../camera";
import { Mod } from "../mod";
import { Prog, type ProgBindingOf } from "../prog";
import type { Studio } from "../studio";

import MAIN_FRAGMENT_SHADER from "$lib/shader/main-fshader.glsl?raw";
import MAIN_VERTEX_SHADER from "$lib/shader/main-vshader.glsl?raw";
import { mat4 } from "gl-matrix";
import type { Obj } from "../parse-obj";
import { createVAOfromObj } from "../parse-obj";

const log = debug("webgl:mod:main");

export interface Item {
	vaos: [WebGLVertexArrayObject, number][];
	color: [number, number, number];
	matrix: mat4;
	skip?: boolean;
	tex?: WebGLTexture;
	cube?: WebGLTexture;
	normal?: WebGLTexture;
}

export class Main extends Mod {
	public items: Item[] = [];
	public renderTex = true;
	public lightColor: [number, number, number] = [1, 1, 1];

	constructor(
		protected mainProg: Prog<
			ProgBindingOf<{
				attributes: ["a_Position", "a_Normal", "a_TexCoord"];
				uniforms: [
					"u_MvpMatrix",
					"u_modelMatrix",
					"u_normalMatrix",
					"u_LightColor",
					"u_LightPosition",
					"u_ViewPosition",
					"u_Ka",
					"u_Kd",
					"u_Ks",
					"u_Color",
					"u_shininess",
					"u_mode",
					"u_Sampler",
					"u_CubeSampler",
					"u_NormalMap",
					"u_UseNormalMap",
				];
			}>
		>,
	) {
		super();
	}

	static async init(studio: Studio): Promise<Main> {
		const gl = studio.gl;

		const mainProg = Prog.create(gl, [MAIN_VERTEX_SHADER, MAIN_FRAGMENT_SHADER], {
			attributes: ["a_Position", "a_Normal", "a_TexCoord"],
			uniforms: [
				"u_MvpMatrix",
				"u_modelMatrix",
				"u_normalMatrix",
				"u_LightColor",
				"u_LightPosition",
				"u_ViewPosition",
				"u_Ka",
				"u_Kd",
				"u_Ks",
				"u_Color",
				"u_shininess",
				"u_mode",
				"u_Sampler",
				"u_CubeSampler",
				"u_NormalMap",
				"u_UseNormalMap",
			],
		} as const);

		log("Skybox module initialized");
		return new Main(mainProg);
	}

	public add(obj: Obj): Item {
		const vaos = createVAOfromObj(this.mainProg.gl, obj, {
			position: this.mainProg.attribute.a_Position,
			normal: this.mainProg.attribute.a_Normal,
			texcoord: this.mainProg.attribute.a_TexCoord,
		});
		const item = { vaos, matrix: mat4.create(), color: [1, 1, 1] as [number, number, number] };
		this.items.push(item);
		return item;
	}

	public async render(camera: Camera, studio: Studio): Promise<void> {
		const gl = studio.gl;

		this.mainProg.use();

		gl.uniform3f(this.mainProg.uniform.u_LightColor, ...this.lightColor);
		gl.uniform3f(this.mainProg.uniform.u_LightPosition, 0, 0.8, 0.1);
		gl.uniform3f(this.mainProg.uniform.u_ViewPosition, camera.pos.x, camera.pos.y, camera.pos.z);
		gl.uniform1f(this.mainProg.uniform.u_Ka, 0.2);
		gl.uniform1f(this.mainProg.uniform.u_Kd, 0.7);
		gl.uniform1f(this.mainProg.uniform.u_Ks, 1.0);
		gl.uniform1f(this.mainProg.uniform.u_shininess, 20.0);

		await this.drawNoneReflection(camera, studio);
	}

	public async drawNoneReflection(camera: Camera, studio: Studio): Promise<void> {
		const gl = studio.gl;

		this.mainProg.use();
		const vp = camera.vp;

		for (const item of this.items) {
			if (item.skip) {
				continue;
			}

			const mvpMatrix = mat4.create();
			mat4.multiply(mvpMatrix, vp, item.matrix);

			const normalMatrix = mat4.invert(mat4.create(), item.matrix);
			mat4.transpose(normalMatrix, normalMatrix);

			gl.uniform3f(this.mainProg.uniform.u_Color, ...item.color);

			gl.uniformMatrix4fv(this.mainProg.uniform.u_MvpMatrix, false, mvpMatrix);
			gl.uniformMatrix4fv(this.mainProg.uniform.u_modelMatrix, false, item.matrix);
			gl.uniformMatrix4fv(this.mainProg.uniform.u_normalMatrix, false, normalMatrix);

			gl.uniform1i(this.mainProg.uniform.u_Sampler, 0);
			gl.uniform1i(this.mainProg.uniform.u_CubeSampler, 1);
			if (item.tex && this.renderTex) {
				gl.uniform1i(this.mainProg.uniform.u_mode, 2);
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, item.tex);
			} else if (item.cube && this.renderTex) {
				gl.uniform1i(this.mainProg.uniform.u_mode, 3);
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, item.cube);
			} else {
				gl.uniform1i(this.mainProg.uniform.u_mode, 1);
			}

			gl.uniform1i(this.mainProg.uniform.u_NormalMap, 2);
			if (item.normal) {
				gl.uniform1i(this.mainProg.uniform.u_UseNormalMap, 1);
				gl.activeTexture(gl.TEXTURE2);
				gl.bindTexture(gl.TEXTURE_2D, item.normal);
			} else {
				gl.uniform1i(this.mainProg.uniform.u_UseNormalMap, 0);
			}

			for (const [vao, numVertices] of item.vaos) {
				gl.bindVertexArray(vao);
				gl.drawArrays(gl.TRIANGLES, 0, numVertices);
			}
		}

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
}
