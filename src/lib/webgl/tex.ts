import debug from "debug";

const log = debug("webgl:tex");

export interface TexCubeSpec {
	posx: string;
	negx: string;
	posy: string;
	negy: string;
	posz: string;
	negz: string;
}

export class Tex {
	public readonly texture: WebGLTexture;
	public readonly gl: WebGL2RenderingContext;
	public readonly type:
		| WebGL2RenderingContext["TEXTURE_CUBE_MAP"]
		| WebGL2RenderingContext["TEXTURE_2D"];

	constructor(
		gl: WebGL2RenderingContext,
		texture: WebGLTexture,
		type: WebGL2RenderingContext["TEXTURE_CUBE_MAP"] | WebGL2RenderingContext["TEXTURE_2D"],
	) {
		this.gl = gl;
		this.texture = texture;
		this.type = type;
	}

	public activate(unit = 0) {
		this.gl.activeTexture(this.gl.TEXTURE0 + unit);
	}

	public bind() {
		log("Binding", this.type === this.gl.TEXTURE_2D ? "2D" : "Cube", this);
		this.gl.bindTexture(this.type, this.texture);
	}

	static async cubemap(gl: WebGL2RenderingContext, spec: TexCubeSpec): Promise<Tex> {
		log("Loading cubemap", spec);

		const texture = gl.createTexture();
		if (!texture) {
			throw new Error("Failed to create texture");
		}

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

		const faces: [number, string][] = [
			[gl.TEXTURE_CUBE_MAP_POSITIVE_X, spec.posx],
			[gl.TEXTURE_CUBE_MAP_NEGATIVE_X, spec.negx],
			[gl.TEXTURE_CUBE_MAP_POSITIVE_Y, spec.posy],
			[gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, spec.negy],
			[gl.TEXTURE_CUBE_MAP_POSITIVE_Z, spec.posz],
			[gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, spec.negz],
		];

		await Promise.all(
			faces.map(async ([face, src]) => {
				const image = new Image();
				image.src = src;
				await new Promise((resolve) => {
					image.onload = resolve;
				});
				gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			}),
		);

		gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

		log("Cubemap loaded", texture);
		return new Tex(gl, texture, gl.TEXTURE_CUBE_MAP);
	}

	static async load2d(gl: WebGL2RenderingContext, src: string): Promise<Tex> {
		log("Loading 2D", src);

		const texture = gl.createTexture();
		if (!texture) {
			throw new Error("Failed to create texture");
		}

		const image = new Image();
		image.src = src;
		await new Promise((resolve) => {
			image.onload = resolve;
		});

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.generateMipmap(gl.TEXTURE_2D);

		log("2D loaded", texture);
		return new Tex(gl, texture, gl.TEXTURE_2D);
	}
}
