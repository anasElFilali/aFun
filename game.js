class Engine {
    constructor() {
        this.screenHeight = 0;
        this.screenWidth = 0;
        this.ctx = null;
        this.W3DV = [];
        this.W3DT = [];
        this.camera = {};
        this.w2DV = [];
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

    // Function to rotate a vertex
    rotateVertex(Vx, Vy, Vz) {
        const cosX = Math.cos(this.camera.rx), sinX = Math.sin(this.camera.rx);
        const cosY = Math.cos(this.camera.ry), sinY = Math.sin(this.camera.ry);
        const cosZ = Math.cos(this.camera.rz), sinZ = Math.sin(this.camera.rz);

        // Rotation matrices
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

        // Combined rotation matrix R = Rz * Ry * Rx
        const R = this.matrixMultiply(this.matrixMultiply(Rz, Ry), Rx);

        // Apply rotation to vertex
        const V = [Vx, Vy, Vz];
        const Vrot = this.matrixVectorMultiply(R, V);

        return { x: Vrot[0], y: Vrot[1], z: Vrot[2] };
    }

    processVertix(v) {
        // Translate vertex relative to camera position
        let vPrime = {
            x: v.x - this.camera.x,
            y: v.y - this.camera.y,
            z: v.z - this.camera.z
        };

        // Apply camera rotation
        const rotated = this.rotateVertex(vPrime.x, vPrime.y, vPrime.z);
        vPrime.x = rotated.x;
        vPrime.y = rotated.y;
        vPrime.z = rotated.z;

        // Calculate dot product with camera direction to determine if vertex is behind camera
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
            return { x: this.screenWidth - xScreen, y: this.screenHeight - yScreen }
        }else{
            return { x: xScreen, y: yScreen }
        }

    }

    render() {
        // Create a list to store depth and index of each triangle
        let trianglesWithDepth = [];

        // Calculate depth for each triangle and store it
        for (let i = 0; i < this.W3DT.length; i++) {
            let triangle = this.W3DT[i];
            // Calculate average depth of triangle vertices
            let depth = (this.W3DV[triangle[0]].z + this.W3DV[triangle[1]].z + this.W3DV[triangle[2]].z) / 3.0;
            trianglesWithDepth.push({ depth: depth, triangleIndex: i });
        }

        // Sort triangles based on depth (from nearest to farthest)
        trianglesWithDepth.sort((a, b) => a.depth - b.depth);

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.screenWidth, this.screenHeight);

        // Render triangles in sorted order
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
            this.ctx.fill();
        }
    }

    
    tick() {
        this.w2DV = [];

        for (let v in this.W3DV) {
            this.w2DV.push(this.processVertix(this.W3DV[v]));
        }

        this.render();
    }
}




















document.body.onload = ()=>{

    engine = new Engine();

    engine.initiateScene(document.getElementById("canvas"),1000,1000);

    engine.setCamera(0, 2, -10, Math.PI / 4, 0, 0, 0);

    engine.addModel([
        {x:0, y:0, z:0},
        {x:0, y:50, z:0},
        {x:-50, y:0, z:0},
        {x:-50, y:50, z:0},
        {x:0, y:0, z:-50},
        {x:0, y:50, z:-50},
        {x:-50, y:0, z:-50},
        {x:-50, y:50, z:-50}
    ],[
        [0,1,2,"#f00"],
        [3,1,2,"#f00"],
        [4,5,6,"#00f"],
        [7,5,6,"#00f"],
        [3,2,6,"#0f0"],
        [3,6,7,"#0f0"],
        [5,3,7,"#0ff"],
        [5,3,1,"#0ff"],
        [4,5,1,"#0f0"],
        [0,1,4,"#0f0"],
        [0,4,2,"#ff0"],
        [4,2,6,"#ff0"]
        
    ])
    engine.addEntity(0,0,0,0);
    engine.addEntity(0,100,0,0);
    engine.addEntity(0,50,-50,0);
    engine.addEntity(0,50,50,0);
    engine.addEntity(0,50,0,50);
    engine.addEntity(0,50,0,-50);
    
    engine.tick();
    
};





document.body.onload = ()=>{

    engine = new Engine();
    
    engine.initiateScene(document.getElementById("canvas"),1000,1000);
    
    engine.setCamera(0, 2, 10, Math.PI / 4, 0, 0, 0);
    
    animatedModel = [
        {x:0, y:0, z:0, d:0},
        {x:0, y:1, z:0, d:1},
        {x:0, y:2, z:0, d:2},
        {x:0, y:3, z:0, d:3},
        {x:0, y:4, z:0, d:2.5},
        {x:0, y:5, z:0, d:1.7},
        {x:0, y:6, z:0, d:0.9},
        {x:0, y:7, z:0, d:0.2},
        {x:0, y:8, z:0, d:-0.3},
        {x:0, y:9, z:0, d:-0.9},
        {x:0, y:10, z:0, d:1},
        {x:0, y:11, z:0, d:0.03},
        {x:0, y:12, z:0, d:0.15},
        {x:0, y:13, z:0, d:-0.12},
        {x:0, y:14, z:0, d:-0.02},
        {x:0, y:15, z:0, d:0.1}
    
    ]
    
    engine.addModel(animatedModel,[
        [0,1,2,"#e00"],
        [2,1,3,"#e55"],
        [2,3,1,"#ee0"],
        [4,3,2,"#5e5"],
        [4,5,2,"#0ee"],
        [6,5,2,"#05e"],
        [6,7,2,"#50e"],
        [8,7,2,"#e00"],
        [8,9,2,"#e55"],
        [10,9,2,"#ee0"],
        [10,11,2,"#5e5"],
        [12,11,2,"#0ee"],
        [12,13,2,"#05e"],
        [14,13,2,"#50e"],
        [14,15,2,"#e00"]
    ])
    
    engine.addEntity(0,0,0,0);
    
    engine.tick();
    
    tick = 0
    sin = 0
    
    
    setInterval(()=>{
    
        tick += 0.01;
        sin = (Math.sin(tick * 10) + Math.cos(tick * 3) - Math.sin(tick * 2)) /3 
        
        for(i=0;i<animatedModel.length;i++){
            if(i === 15){
                animatedModel[i].x = sin;
                animatedModel[i].z = sin;
            }else{
                animatedModel[i].x += (animatedModel[i+1].x - animatedModel[i].x ) / 5;
                animatedModel[i].y += (animatedModel[i+1].y - animatedModel[i].y - 1) / 5;
                animatedModel[i].z += (animatedModel[i+1].z - animatedModel[i].z ) / 5;
            }
    
        }
    
        engine.setModel(0,animatedModel,[
            [0,1,2,"#e00"],
            [2,1,3,"#e55"],
            [2,3,1,"#ee0"],
            [4,3,2,"#5e5"],
            [4,5,2,"#0ee"],
            [6,5,2,"#05e"],
            [6,7,2,"#50e"],
            [8,7,2,"#e00"],
            [8,9,2,"#e55"],
            [10,9,2,"#ee0"],
            [10,11,2,"#5e5"],
            [12,11,2,"#0ee"],
            [12,13,2,"#05e"],
            [14,13,2,"#50e"],
            [14,15,2,"#e00"]
        ])
    
    
    
        engine.tick();
        
    },50)
    
    };