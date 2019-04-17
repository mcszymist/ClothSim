var camera,scene,geometry,material,mesh,renderer;
var k = 1;
var g = new THREE.Vector3(0,0,0);
var Fwind = new THREE.Vector3(0,0,0);
var Fair = new THREE.Vector3(0,0,0);
var gridsize = 50;
var particleSystem;
var Nodes = [];
var Springs = [];
var KsStruct = 50.75;
var KdStruct = -0.025;
var KsShear = 50.75;
var KdShear = -0.25;
var KsBend = 50.95;
var KdBend = -0.25;
var Damping = -0.0125;
var particleCount = 100;
class StateVectorNodes {
	constructor(i) {
		this.x = new THREE.Vector3();
		this.v = new THREE.Vector3();
		this.a = new THREE.Vector3();
		this.prevX = new THREE.Vector3();
		this.prevX.copy(this.x);
		this.m = 1.0;
		this.index = i;
		this.radius = 1;
	}
}
// Sprint type are: 
// Structural = 0
// Shear = 1
// Bend = 2
class StateVectorSpring {
	constructor(node1,node2,ks,kd,tp) {
		this.strech = 2;
		this.p1 = node1;
		this.p2 = node2;
		this.Ks = ks;
		this.Kd = kd;
		this.deltaP = new THREE.Vector3();
		this.deltaP.subVectors(Nodes[node1].x,Nodes[node2].x);
		this.rest = this.deltaP.length();
		this.type = tp;
	}
}
init();
animate();
function GetVerletVelocity(node, dt ) {
	let temp = new THREE.Vector3();
	temp.subVectors(node.x,node.prevX);
	temp.divideScalar(dt);
	return temp;
}
function computeForces(dt){
	for(let i = 0;i<Nodes.length;i++){
		Nodes[i].v = new THREE.Vector3();

		let Fnet = new THREE.Vector3();
		Fnet.add(g);
		Fnet.multiplyScalar(Nodes[i].m);
		Fnet.add(Fwind);
		Fnet.add(Fair);
		
		Nodes[i].v.add(Fnet);
		Nodes[i].v.add(GetVerletVelocity(Nodes[i],dt).multiplyScalar(Damping));
	}
	for(let i = 0;i<Springs.length;i++){
		let v1 = GetVerletVelocity(Nodes[Springs[i].p1],dt);
		let v2 = GetVerletVelocity(Nodes[Springs[i].p2],dt);
		let deltaP = new THREE.Vector3();
		deltaP.subVectors(Nodes[Springs[i].p1].x,Nodes[Springs[i].p2].x);
		let deltaV = new THREE.Vector3();
		deltaV.subVectors(v1,v2);
		let dist = deltaP.length();
		if(dist == 0){
			continue;
		}
		let leftterm = Springs[i].Ks * (dist - Springs[i].rest);
		let rightterm =	Springs[i].Kd * ((deltaV.dot(deltaP))/dist);
		let springForce = deltaP.normalize();
		springForce.multiplyScalar(leftterm + rightterm);
		if(Springs[i].p1 != 0 && Springs[i].p1 != particleCount - 1){
			let temp = Nodes[Springs[i].p1];
			temp.v.add(springForce);
			Nodes[Springs[i].p1] = temp;
		}
		if(Springs[i].p2 != 0 && Springs[i].p2 != particleCount - 1 ){
			let temp = Nodes[Springs[i].p2];
			temp.v.sub(springForce);
			Nodes[Springs[i].p1] = temp;
		}
	}
}
function IntegrateVerlet(dt){
	let deltaTime2Mass = (dt*dt)/ Nodes[0].m;
	let temp = particleSystem.geometry.vertices;
	for(let i = 0; i < Nodes.length;i++){

		let oldX = new THREE.Vector3();
		oldX.copy(Nodes[i].x);
		let newX = new THREE.Vector3();
		newX.copy(Nodes[i].x);
		newX.multiplyScalar(2);
		newX.sub(Nodes[i].prevX);
		newX.add(Nodes[i].v.multiplyScalar(deltaTime2Mass));
		//stoped
		//newX = 2*Nodes[i].x - Nodes[i].prevX + deltaTime2Mass*Force;
		
		temp[i].x = newX.x;
		temp[i].y = newX.y;
		temp[i].z = newX.z
		Nodes[i].x.copy(newX);
		Nodes[i].prevX.copy(oldX);
	}
	particleSystem.geometry.verticesNeedUpdate = true;
}

function init() {

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	camera.position.z = 2;
	geometry = [];
	mesh = [];
	scene = new THREE.Scene();
	material = new THREE.MeshNormalMaterial();
	particles = new THREE.Geometry(),
	pMaterial = new THREE.PointsMaterial({
		color: 0xFFFFFF,
		size: 0.01
	});

	// now create the individual particles
	for (var p = 0; p < particleCount; p++) {
		for(var j = 0; j < particleCount; j++){
			// create a particle with random
			// position values, -250 -> 250
			var particle = new THREE.Vector3(p/gridsize -1, j/gridsize - .5, 0);
		  var sv = new StateVectorNodes();
			sv.x = Vector3.make(p/gridsize - 1, j/gridsize - .5, 0);
			sv.prevX = sv.x;
			

			// add it to the geometry
			particles.vertices.push(particle);
			Nodes.push(sv);
		}
	}
	makeSprings(particleCount);
	// create the particle system
	particleSystem = new THREE.Points(
	particles,
	pMaterial);

	// add it to the scene
	scene.add(particleSystem);
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
}

function makeSprings(particleCount){
	let pv;
	//horizontal
	for(let i = 0;i < particleCount; i++){
		for(let j = 1; j < particleCount; j++){
			pv = new StateVectorSpring(i*particleCount+j-1,i*particleCount+j,KsStruct,KdStruct,0);
			Springs.push(pv);
		}
	}
	//vertical
	for(let i = 1;i < particleCount; i++){
		for(let j = 0; j < particleCount; j++){
			pv = new StateVectorSpring(i*particleCount+j,(i-1)*particleCount+j,KsStruct,KdStruct,0);
			Springs.push(pv);
		}
	}
	for (let l1 = 0; l1 < (particleCount - 1); l1++)
		for (let l2 = 0; l2 < (particleCount - 1); l2++) {
			pv = new StateVectorSpring((l1 * particleCount) + l2,((l1 + 1) * particleCount) + l2 + 1,KsShear,KdShear,1);
			Springs.push(pv);
			pv = new StateVectorSpring(((l1 + 1) * particleCount) + l2,(l1 * particleCount) + l2 + 1,KsShear,KdShear,1);
			Springs.push(pv);
		}


	// Bend Springs
	for (let l1 = 0; l1 < (particleCount); l1++) {
		for (let l2 = 0; l2 < (particleCount - 2); l2++) {
			pv = new StateVectorSpring((l1 * particleCount) + l2,(l1 * particleCount) + l2 + 2,KsBend,KdBend,2);
			Springs.push(pv);
		}
		pv = new StateVectorSpring((l1 * particleCount) + (particleCount - 3),(l1 * particleCount) + (particleCount - 1),KsBend,KdBend,2);
		Springs.push(pv);
	}
	for (let l1 = 0; l1 < (particleCount); l1++) {
		for (let l2 = 0; l2 < (particleCount - 2); l2++) {
			pv = new StateVectorSpring((l2 * particleCount) + l1,((l2 + 2) * particleCount) + l1,KsBend,KdBend,2);
			Springs.push(pv);
		}
		pv = new StateVectorSpring(((particleCount - 3) * particleCount) + l1,((particleCount - 1) * particleCount) + l1,KsBend,KdBend,2);
		Springs.push(pv);
	}
}

function computeCollisions(){
	for(let i = 0; i < Nodes.length();i++){
		Nodes[i]
	}
}
function animate() {
	
	requestAnimationFrame( animate );
	let dt = 1/60;
	computeForces(dt);
	IntegrateVerlet(dt);
	renderer.render( scene, camera );

}
