import debug from "debug";
import { Prog } from "./prog";

const log = debug("webgl:pm");

export class ProgramManager {
	public programs: Record<string, Prog> = {};

	public load(name: string, program: Prog): this {
		if (this.programs[name]) {
			log("Replacing program: %s", name);
		}

		this.programs[name] = program;
		log("Registered program: %s", name);
		return this;
	}

	public get(name: string) {
		const program = this.programs[name];
		if (!program) {
			throw new Error("Program not found: " + name);
		}
		return program;
	}
}
