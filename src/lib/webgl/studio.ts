import debug from "debug";
import { AssetManager } from "./am";
import { Camera, XCamera } from "./camera";
import type { Mod } from "./mod";
import { ProgramManager } from "./pm";

const log = debug("webgl:studio");

export class Studio {
	public readonly gl: WebGL2RenderingContext;
	public readonly pm: ProgramManager;
	public readonly am: AssetManager;
	public readonly mods: Mod[] = [];

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;
		this.pm = new ProgramManager();
		this.am = new AssetManager();

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.depthFunc(this.gl.LEQUAL);

		this.gl.enable(this.gl.CULL_FACE);
		this.gl.cullFace(this.gl.BACK);
	}

	public async register<M extends Mod>(
		initializer: (studio: Studio) => Promise<M> | M,
	): Promise<M> {
		log("Registering module");
		const mod = await initializer(this);
		this.mods.push(mod);
		log("Registered module", mod);
		return mod;
	}

	public async render(camera: Camera): Promise<void> {
		const gl = this.gl;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

		for (const mod of this.mods) {
			log("Rendering module", mod);
			await mod.render(camera, this);
			log("Rendered module", mod);
		}
	}

	public async renderCubemap(camera: Camera): Promise<WebGLTexture> {
		const gl = this.gl;

		//camera 6 direction to render 6 cubemap faces
		const ENV_CUBE_LOOK_DIR: [number, number, number][] = [
			[1.0, 0.0, 0.0],
			[-1.0, 0.0, 0.0],
			[0.0, 1.0, 0.0],
			[0.0, -1.0, 0.0],
			[0.0, 0.0, 1.0],
			[0.0, 0.0, -1.0],
		];

		//camera 6 look up vector to render 6 cubemap faces
		const ENV_CUBE_LOOK_UP: [number, number, number][] = [
			[0.0, -1.0, 0.0],
			[0.0, -1.0, 0.0],
			[0.0, 0.0, 1.0],
			[0.0, 0.0, -1.0],
			[0.0, -1.0, 0.0],
			[0.0, -1.0, 0.0],
		];

		const fbo = gl.createFramebuffer();
		if (!fbo) {
			throw new Error("Failed to create framebuffer");
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.viewport(0, 0, 512, 512);

		const depthBuffer = gl.createRenderbuffer();
		if (!depthBuffer) {
			throw new Error("Failed to create depth buffer");
		}
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

		//create a cubemap texture
		const envCubeMap = gl.createTexture();
		if (!envCubeMap) {
			throw new Error("Failed to create cubemap texture");
		}
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubeMap);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		for (let i = 0; i < 6; i++) {
			gl.texImage2D(
				gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
				0,
				gl.RGBA,
				512,
				512,
				0,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				null,
			);
		}

		//render 6 cubemap faces
		for (let i = 0; i < 6; i++) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubeMap);
			gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
				envCubeMap,
				0,
			);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			const newCam = new XCamera(
				camera.pos.x,
				camera.pos.y,
				camera.pos.z,
				camera.pos.x + ENV_CUBE_LOOK_DIR[i][0],
				camera.pos.y + ENV_CUBE_LOOK_DIR[i][1],
				camera.pos.z + ENV_CUBE_LOOK_DIR[i][2],
				ENV_CUBE_LOOK_UP[i][0],
				ENV_CUBE_LOOK_UP[i][1],
				ENV_CUBE_LOOK_UP[i][2],
			);

			for (const mod of this.mods) {
				log("Rendering module", mod);
				await mod.render(newCam as any, this);
				log("Rendered module", mod);
			}
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);

		return envCubeMap;
	}
}
