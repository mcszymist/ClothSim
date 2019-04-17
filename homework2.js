

function accum(a, b, bscale) {
    a.x += b.x * bscale;
    a.y += b.y * bscale;
    a.z += b.z * bscale;
}

class StateVector {
    constructor() {
        this.x = Vector3.make();
        this.v = Vector3.make();
        this.a = Vector3.make();
        this.m = 1.0;
		this.gravityToggle = true;
    }
}

class Simulation {
    constructor() {
        this.objects = [];
    }

    reset() {
        this.objects = [];
		for(let y = 0; y < 80; y++){
		    for (let i = 0; i < 90; i++) {
		        let sv = new StateVector();
		        sv.x.x = -3 + i*0.05;
		        sv.x.y = 2 - y*0.05;
		        sv.v.y = 5
		        sv.a.y = -1;
		        this.objects.push(sv);
		    }
		}
    }

    update(dt) {
		//Loop though all sv objects
		//To apply gravity and collison collison is broke and dont know why vectors dont apply right I think so i did a move right to try and move out of the collision
		for (let i = 0;i < this.objects.length; i++) {
			let sv = this.objects[i];
			for (let j = i+1;j < this.objects.length; j++){			
				let obj = this.objects[j];
				let dx = sv.x.x - obj.x.x;
				let dy = sv.x.y - obj.x.y;
				let distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < 0.05) {
					let nx = (obj.x.x - sv.x.x)/2

					let ny = (obj.x.y - sv.x.y)/2
					let p = 2 *(sv.v.x * nx + sv.v.y * ny - obj.v.x * nx - obj.v.y * ny)/(sv.x.m+obj.x.m);
					let vx1 = sv.v.x - p * sv.x.m *nx;
					let vy1 = sv.v.y - p * sv.x.m *ny;
					let vx2 = obj.v.x + p * obj.x.m *nx;
					let vy2 = obj.v.y + p * obj.x.m *ny;
					//sv.v = Vector3.make(vx1,vy1,0.0);
					//obj.v =  Vector3.make(vx2,vy2,0.0);
					sv.x.x = sv.x.x + 0.03
				}
				
			}

            if (sv.x.y < -2) {
                sv.x.y = 2;
            } else if (sv.x.y > 2){
				sv.x.y = -2;
			}

            if (sv.x.x < -2.79) {
                sv.x.x = 2.79;
            } else if (sv.x.x > 2.79) {
                sv.x.x = -2.79;
            }
        }
    }
}

class App {
    constructor() {
        this.xor = new LibXOR("project");
        this.sim = new Simulation();

        let p = document.getElementById('desc');
        p.innerHTML = `This is demonstrating collision with lots of entities unoptimised. its coculates all the vectors but doesnt apply them as my vector code isnt working right, so instead I just move them over a small amount. This program will endlessly loop`;
    }

    init() {
        hflog.logElement = "log";
        this.xor.graphics.setVideoMode(1.5 * 384, 384);
        this.xor.input.init();
        let gl = this.xor.graphics.gl;

        let rc = this.xor.renderconfigs.load('default', 'basic.vert', 'basic.frag');
        rc.useDepthTest = false;

        let pal = this.xor.palette;

        let rect = this.xor.meshes.load('sphere', 'circle.obj');
        let bg = this.xor.meshes.create('bg');
        bg.color3(pal.getColor(pal.BLACK));
        bg.rect(-3, -3, -2.9, 3);
		bg.color3(pal.getColor(pal.BLACK));
        bg.rect(3, -3, 2.9, 3);
        this.sim.reset();
    }

    start() {
        this.mainloop();
    }

    update(dt) {
        let xor = this.xor;
        let resetSim = false;
        if (xor.input.checkKeys([" ", "Space"])) {
            resetSim = true;
        }

        if (resetSim) {
            this.sim.reset();
        }

        this.sim.update(dt);
    }

    render() {
        let xor = this.xor;
        xor.graphics.clear(xor.palette.AZURE);

        let pmatrix = Matrix4.makePerspectiveY(45.0, 1.5, 1.0, 100.0);
        let cmatrix = Matrix4.makeOrbit(-90, 0, 5.0);
        let rc = xor.renderconfigs.use('default');
        if (rc) {
            rc.uniformMatrix4f('ProjectionMatrix', pmatrix);
            rc.uniformMatrix4f('CameraMatrix', cmatrix);

            rc.uniformMatrix4f('WorldMatrix', Matrix4.makeIdentity());
            xor.meshes.render('bg', rc);

            for (let sv of this.sim.objects) {
                rc.uniformMatrix4f('WorldMatrix', Matrix4.makeTranslation3(sv.x));
                xor.meshes.render('sphere', rc);
            }
        }
        xor.renderconfigs.use(null);
    }

    mainloop() {
        let self = this;
        window.requestAnimationFrame((t) => {
            self.xor.startFrame(t);
            self.update(self.xor.dt);
            self.render();
            self.mainloop();
        });
    }
}

let app = new App();
app.init();
app.start();
