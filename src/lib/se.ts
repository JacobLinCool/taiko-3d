export class SoundEffect {
	private ctx: AudioContext;
	private buffers: Record<string, AudioBuffer>;

	constructor() {
		this.ctx = new window.AudioContext();
		this.buffers = {};
	}

	public async load(name: string, src: string) {
		const response = await fetch(src);
		const arrayBuffer = await response.arrayBuffer();
		const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
		this.buffers[name] = audioBuffer;
	}

	public play(name: string) {
		const buffer = this.buffers[name];
		if (!buffer) {
			console.error(`Sound ${name} has not been loaded yet.`);
			return;
		}

		const source = this.ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(this.ctx.destination);
		source.start(0);
	}
}
