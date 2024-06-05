import type { Camera } from "./camera";
import type { Studio } from "./studio";

export abstract class Mod {
	abstract render(camera: Camera, studio: Studio): Promise<void> | void;
}
