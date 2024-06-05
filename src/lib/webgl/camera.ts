import { mat4, vec3 } from "gl-matrix";

export class Camera {
	public pos = { x: 0, y: 0, z: 0 };
	public direction = { x: 0, y: 0, z: -1 };
	public up: [number, number, number] = [0, 1, 0];
	public fov = 90;
	public aspect = 1;
	public near = 0.1;
	public far = 100.0;

	public rotate(dx: number, dy: number) {
		const rotation = mat4.create();
		mat4.rotateY(rotation, rotation, dx);
		mat4.rotateX(rotation, rotation, dy);

		const direction = vec3.transformMat4(
			vec3.create(),
			[this.direction.x, this.direction.y, this.direction.z],
			rotation,
		);

		this.direction = {
			x: direction[0],
			y: direction[1],
			z: direction[2],
		};
	}

	public zoom(delta: number) {
		this.fov += delta;
		this.fov = Math.min(120, Math.max(30, this.fov));
	}

	get projection() {
		return mat4.perspective(
			mat4.create(),
			this.fov * (Math.PI / 180),
			this.aspect,
			this.near,
			this.far,
		);
	}

	get view() {
		return mat4.lookAt(
			mat4.create(),
			[this.pos.x, this.pos.y, this.pos.z],
			[this.pos.x + this.direction.x, this.pos.y + this.direction.y, this.pos.z + this.direction.z],
			this.up,
		);
	}

	get vp() {
		return mat4.multiply(mat4.create(), this.projection, this.view);
	}
}

export class XCamera {
	public pos: { x: number; y: number; z: number };
	constructor(
		public x: number,
		public y: number,
		public z: number,
		public a: number,
		public b: number,
		public c: number,
		public d: number,
		public e: number,
		public f: number,
	) {
		this.pos = { x: this.x, y: this.y, z: this.z };
	}

	get projection() {
		return mat4.perspective(mat4.create(), 90 * (Math.PI / 180), 1, 0.1, 100);
	}

	get view() {
		return mat4.lookAt(
			mat4.create(),
			[this.x, this.y, this.z],
			[this.a, this.b, this.c],
			[this.d, this.e, this.f],
		);
	}

	get vp() {
		return mat4.multiply(mat4.create(), this.projection, this.view);
	}
}
