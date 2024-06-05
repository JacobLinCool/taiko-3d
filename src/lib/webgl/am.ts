import debug from "debug";
import type { Tex } from "./tex";

const log = debug("webgl:am");

export class AssetManager {
	public textures: Record<string, Tex> = {};

	public load(name: string, tex: Tex) {
		if (this.textures[name]) {
			log("Replacing texture: %s", name);
		}

		this.textures[name] = tex;
		log("Registered texture: %s", name);
		return this;
	}

	public get(name: string) {
		const texture = this.textures[name];
		if (!texture) {
			throw new Error("Texture not found: " + name);
		}
		return texture;
	}
}
