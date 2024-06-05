export interface Geo {
	object: string;
	groups: string[];
	material: string;
	data: {
		position: number[];
		texcoord: number[];
		normal: number[];
	};
}

export interface Obj {
	geometries: Geo[];
	materialLibs: string[];
}

export function parseOBJ(text: string): Obj {
	// because indices are base 1 let's just fill in the 0th data
	const objPositions = [[0, 0, 0]];
	const objTexcoords = [[0, 0]];
	const objNormals = [[0, 0, 0]];

	// same order as `f` indices
	const objVertexData = [objPositions, objTexcoords, objNormals];

	// same order as `f` indices
	let webglVertexData: number[][] = [
		[], // positions
		[], // texcoords
		[], // normals
	];

	const materialLibs: string[] = [];
	const geometries: Geo[] = [];
	let geometry: Geo | undefined;
	let groups = ["default"];
	let material = "default";
	let object = "default";

	const noop = () => {};

	function newGeometry() {
		// If there is an existing geometry and it's
		// not empty then start a new one.
		if (geometry && geometry.data.position.length) {
			geometry = undefined;
		}
	}

	function setGeometry() {
		if (!geometry) {
			const position: number[] = [];
			const texcoord: number[] = [];
			const normal: number[] = [];
			webglVertexData = [position, texcoord, normal];
			geometry = {
				object,
				groups,
				material,
				data: {
					position,
					texcoord,
					normal,
				},
			};
			geometries.push(geometry);
		}
	}

	function addVertex(vert: string) {
		const ptn = vert.split("/");
		ptn.forEach((objIndexStr, i) => {
			if (!objIndexStr) {
				return;
			}
			const objIndex = parseInt(objIndexStr);
			const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
			webglVertexData[i].push(...objVertexData[i][index]);
		});
	}

	const keywords: Record<string, (parts: string[], unparsedArgs: string) => void> = {
		v(parts: string[]) {
			objPositions.push(parts.map(parseFloat));
		},
		vn(parts: string[]) {
			objNormals.push(parts.map(parseFloat));
		},
		vt(parts: string[]) {
			// should check for missing v and extra w?
			objTexcoords.push(parts.map(parseFloat));
		},
		f(parts: string[]) {
			setGeometry();
			const numTriangles = parts.length - 2;
			for (let tri = 0; tri < numTriangles; ++tri) {
				addVertex(parts[0]);
				addVertex(parts[tri + 1]);
				addVertex(parts[tri + 2]);
			}
		},
		s: noop, // smoothing group
		mtllib(_parts: string[], unparsedArgs: string) {
			// the spec says there can be multiple filenames here
			// but many exist with spaces in a single filename
			materialLibs.push(unparsedArgs);
		},
		usemtl(_parts: string[], unparsedArgs: string) {
			material = unparsedArgs;
			newGeometry();
		},
		g(parts: string[]) {
			groups = parts;
			newGeometry();
		},
		o(_parts: string[], unparsedArgs: string) {
			object = unparsedArgs;
			newGeometry();
		},
	};

	const keywordRE = /(\w*)(?: )*(.*)/;
	const lines = text.split("\n");
	for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
		const line = lines[lineNo].trim();
		if (line === "" || line.startsWith("#")) {
			continue;
		}
		const m = keywordRE.exec(line);
		if (!m) {
			continue;
		}
		const [, keyword, unparsedArgs] = m;
		const parts = line.split(/\s+/).slice(1);
		const handler = keywords[keyword];
		if (!handler) {
			console.warn("unhandled keyword:", keyword); // eslint-disable-line no-console
			continue;
		}
		handler(parts, unparsedArgs);
	}

	// remove any arrays that have no entries.
	for (const geometry of geometries) {
		geometry.data = Object.fromEntries(
			Object.entries(geometry.data).filter(([, array]) => array.length > 0),
		) as Geo["data"];
	}

	return {
		geometries,
		materialLibs,
	};
}

export async function loadObj(url: string): Promise<Obj> {
	const res = await fetch(url);
	const text = await res.text();
	return parseOBJ(text);
}

export interface ObjBinding {
	position: number;
	normal: number;
	texcoord?: number;
}

export function createVAOfromObj(
	gl: WebGL2RenderingContext,
	obj: Obj,
	binding: ObjBinding,
): [WebGLVertexArrayObject, number][] {
	const vaos: [WebGLVertexArrayObject, number][] = [];
	for (const geometry of obj.geometries) {
		const vao = gl.createVertexArray();
		if (!vao) {
			throw new Error("Failed to create VAO");
		}
		gl.bindVertexArray(vao);

		const position = gl.createBuffer();
		if (!position) {
			throw new Error("Failed to create position buffer");
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, position);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.data.position), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(binding.position);
		gl.vertexAttribPointer(binding.position, 3, gl.FLOAT, false, 0, 0);

		const normal = gl.createBuffer();
		if (!normal) {
			throw new Error("Failed to create normal buffer");
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, normal);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.data.normal), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(binding.normal);
		gl.vertexAttribPointer(binding.normal, 3, gl.FLOAT, false, 0, 0);

		if (geometry.data.texcoord.length && binding.texcoord) {
			const texcoord = gl.createBuffer();
			if (!texcoord) {
				throw new Error("Failed to create texcoord buffer");
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, texcoord);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.data.texcoord), gl.STATIC_DRAW);
			gl.enableVertexAttribArray(binding.texcoord);
			gl.vertexAttribPointer(binding.texcoord, 2, gl.FLOAT, false, 0, 0);
		}

		gl.bindVertexArray(null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		vaos.push([vao, geometry.data.position.length / 3]);
	}
	return vaos;
}
