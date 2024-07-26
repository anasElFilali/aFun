class Engine {
    constructor() {
        this.screenHeight = 0;
        this.screenWidth = 0;
        this.ctx = null;
        this.W3DV = [];
        this.W3DT = [];
        this.camera = {};
        this.w2DV = [];
        this.modelsV = [];
        this.modelsT = [];
        this.entities = [];
    }

    matrixVectorMultiply(M, V) {
        return [
            M[0][0] * V[0] + M[0][1] * V[1] + M[0][2] * V[2],
            M[1][0] * V[0] + M[1][1] * V[1] + M[1][2] * V[2],
            M[2][0] * V[0] + M[2][1] * V[1] + M[2][2] * V[2]
        ];
    }

    matrixMultiply(A, B) {
        const result = [];
        for (let i = 0; i < 3; i++) {
            result[i] = [];
            for (let j = 0; j < 3; j++) {
                result[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
            }
        }
        return result;
    }

    initiateScene(canvas, h, w) {
        console.log("new scene");
        canvas.height = this.screenHeight = h;
        canvas.width = this.screenWidth = w;
        this.ctx = canvas.getContext("2d");
    }

    vertix(x, y, z) {
        return { x: x, y: y, z: z };
    }

    setWorld(arrayV, arrayT) {
        this.W3DV = arrayV;
        this.W3DT = arrayT;
    }

    setCamera(x, y, z, fov, rx, ry, rz) {
        this.camera = { x: x, y: y, z: z, fov: fov, rx: rx, ry: ry, rz: rz };
    }

    rotateVertex(Vx, Vy, Vz) {
        const cosX = Math.cos(this.camera.rx), sinX = Math.sin(this.camera.rx);
        const cosY = Math.cos(this.camera.ry), sinY = Math.sin(this.camera.ry);
        const cosZ = Math.cos(this.camera.rz), sinZ = Math.sin(this.camera.rz);

        const Rx = [
            [1, 0, 0],
            [0, cosX, -sinX],
            [0, sinX, cosX]
        ];

        const Ry = [
            [cosY, 0, sinY],
            [0, 1, 0],
            [-sinY, 0, cosY]
        ];

        const Rz = [
            [cosZ, -sinZ, 0],
            [sinZ, cosZ, 0],
            [0, 0, 1]
        ];

        const R = this.matrixMultiply(this.matrixMultiply(Rx, Ry), Rz);

        const V = [Vx, Vy, Vz];
        const Vrot = this.matrixVectorMultiply(R, V);

        return { x: Vrot[0], y: Vrot[1], z: Vrot[2] };
    }

    processVertix(v) {
        let vPrime = {
            x: v.x - this.camera.x,
            y: v.y - this.camera.y,
            z: v.z - this.camera.z
        };

        const rotated = this.rotateVertex(vPrime.x, vPrime.y, vPrime.z);
        vPrime.x = rotated.x;
        vPrime.y = rotated.y;
        vPrime.z = rotated.z;

        let cameraDirection = {
            x: Math.sin(this.camera.ry) * Math.cos(this.camera.rx),
            y: -Math.sin(this.camera.rx),
            z: Math.cos(this.camera.ry) * Math.cos(this.camera.rx)
        };

        let dotProduct = vPrime.x * cameraDirection.x + vPrime.y * cameraDirection.y + vPrime.z * cameraDirection.z;

        let fovFactor = Math.tan(this.camera.fov / 2);
        let x2D = vPrime.x / (vPrime.z * fovFactor);
        let y2D = vPrime.y / (vPrime.z * fovFactor);

        let xScreen = (x2D + 1) / 2 * this.screenWidth;
        let yScreen = ((y2D + 1) / 2) * this.screenHeight;

        if (dotProduct > 0) {
            return { x: this.screenWidth - xScreen, y: this.screenHeight - yScreen };
        } else {
            return { x: xScreen, y: yScreen };
        }
    }

    render() {
        let trianglesWithDepth = [];

        for (let i = 0; i < this.W3DT.length; i++) {
            let triangle = this.W3DT[i];
            let depth = (this.W3DV[triangle[0]].z + this.W3DV[triangle[1]].z + this.W3DV[triangle[2]].z) / 3.0;
            trianglesWithDepth.push({ depth: depth, triangleIndex: i });
        }

        trianglesWithDepth.sort((a, b) => a.depth - b.depth);

        this.ctx.clearRect(0, 0, this.screenWidth, this.screenHeight);

        for (let item of trianglesWithDepth) {
            let triangleIndex = item.triangleIndex;
            let triangle = this.W3DT[triangleIndex];

            this.ctx.beginPath();
            this.ctx.moveTo(this.w2DV[triangle[0]].x, this.w2DV[triangle[0]].y);
            this.ctx.lineTo(this.w2DV[triangle[1]].x, this.w2DV[triangle[1]].y);
            this.ctx.lineTo(this.w2DV[triangle[2]].x, this.w2DV[triangle[2]].y);
            this.ctx.closePath();
            this.ctx.fillStyle = triangle[3];
            this.ctx.strokeStyle = triangle[3];
            this.ctx.stroke();
            //this.ctx.fill();
        }
    }

    addModel(v, t) {
        this.modelsV.push(v);
        this.modelsT.push(t);
    }

    setModel(i, v, t) {
        if (i >= 0 && i < this.modelsV.length) {
            this.modelsV[i] = v;
            this.modelsT[i] = t;
        }
    }

    addEntity(m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
        this.entities.push({ m: m, x: x, y: y, z: z, rx: rx, ry: ry, rz: rz, sx: sx, sy: sy, sz: sz });
    }

    changeEntity(i, x, y, z, rx = 0, ry = 0, rz = 0, sx = 0, sy = 0, sz = 0) {
        let entity = this.entities[i];
        entity.x += x;
        entity.y += y;
        entity.z += z;
        entity.rx += rx;
        entity.ry += ry;
        entity.rz += rz;
        entity.sx += sx;
        entity.sy += sy;
        entity.sz += sz;
    }

    setEntity(i, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
        let entity = this.entities[i];
        entity.x = x;
        entity.y = y;
        entity.z = z;
        entity.rx = rx;
        entity.ry = ry;
        entity.rz = rz;
        entity.sx = sx;
        entity.sy = sy;
        entity.sz = sz;
    }

    applyEntityTransform(entity, vertex) {
        let v = {
            x: vertex.x * entity.sx,
            y: vertex.y * entity.sy,
            z: vertex.z * entity.sz
        };

        const cosX = Math.cos(entity.rx), sinX = Math.sin(entity.rx);
        const cosY = Math.cos(entity.ry), sinY = Math.sin(entity.ry);
        const cosZ = Math.cos(entity.rz), sinZ = Math.sin(entity.rz);

        const Rx = [
            [1, 0, 0],
            [0, cosX, -sinX],
            [0, sinX, cosX]
        ];

        const Ry = [
            [cosY, 0, sinY],
            [0, 1, 0],
            [-sinY, 0, cosY]
        ];

        const Rz = [
            [cosZ, -sinZ, 0],
            [sinZ, cosZ, 0],
            [0, 0, 1]
        ];

        const R = this.matrixMultiply(this.matrixMultiply(Rz, Ry), Rx);
        const rotated = this.matrixVectorMultiply(R, [v.x, v.y, v.z]);

        return {
            x: rotated[0] + entity.x,
            y: rotated[1] + entity.y,
            z: rotated[2] + entity.z
        };
    }

    tick() {
        this.W3DV = [];
        this.W3DT = [];

        for (let i = 0; i < this.entities.length; i++) {
            let entity = this.entities[i];
            let modelVertices = this.modelsV[entity.m];
            let transformedVertices = modelVertices.map(v => this.applyEntityTransform(entity, v));

            let vertexOffset = this.W3DV.length;
            this.W3DV.push(...transformedVertices);

            let modelTriangles = this.modelsT[entity.m];
            let transformedTriangles = modelTriangles.map(t => [t[0] + vertexOffset, t[1] + vertexOffset, t[2] + vertexOffset, t[3]]);
            this.W3DT.push(...transformedTriangles);
        }

        this.w2DV = this.W3DV.map(v => this.processVertix(v));
        this.render();
    }
}
