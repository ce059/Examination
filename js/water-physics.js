/* water-physics.js — animated pool water via custom GLSL ShaderMaterial */

AFRAME.registerComponent('water-physics', {
  schema: {
    color:      { type:'color',  default:'#1a8fca' },
    speed:      { type:'number', default:0.5 },
    waveHeight: { type:'number', default:0.06 },
    width:      { type:'number', default:8 },
    depth:      { type:'number', default:4 }
  },

  init: function () {
    this.time = 0;
    const d = this.data;
    const geo = new THREE.PlaneGeometry(d.width, d.depth, 60, 30);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:  { value: 0 },
        uColor: { value: new THREE.Color(d.color) },
        uSpeed: { value: d.speed },
        uWH:    { value: d.waveHeight }
      },
      vertexShader: `
        uniform float uTime, uWH;
        varying vec2 vUv; varying float vEl;
        void main(){
          vUv = uv;
          vec4 mp = modelMatrix * vec4(position,1.0);
          float w = sin(mp.x*3.0+uTime*2.2)*uWH + sin(mp.z*2.5+uTime*1.7)*uWH*.7;
          mp.y += w; vEl = w;
          gl_Position = projectionMatrix*viewMatrix*mp;
        }`,
      fragmentShader: `
        uniform float uTime, uSpeed;
        uniform vec3 uColor;
        varying vec2 vUv; varying float vEl;
        void main(){
          vec2 uv = vUv + vec2(uTime*uSpeed*.04, uTime*uSpeed*.025);
          float caustic = sin(uv.x*22.+uTime)*sin(uv.y*19.+uTime*.9)*.12+.88;
          float d = (vEl+.1)/.2;
          vec3 shallow = vec3(.45,.9,1.); 
          vec3 col = mix(uColor, shallow, clamp(d,0.,1.))*caustic;
          float foam = smoothstep(.04,.08,vEl);
          col = mix(col, vec3(.92,.98,1.), foam*.5);
          gl_FragColor = vec4(col, .85);
        }`,
      transparent:true, side:THREE.DoubleSide
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = -Math.PI/2;
    this.el.object3D.add(this.mesh);
    const def = this.el.getObject3D('mesh');
    if(def) this.el.removeObject3D('mesh');
  },

  tick: function(t,dt){
    this.time += dt/1000;
    if(this.mesh) this.mesh.material.uniforms.uTime.value = this.time;
  },

  remove: function(){ if(this.mesh) this.el.object3D.remove(this.mesh); }
});


/* ── Floating bubbles ── */
AFRAME.registerComponent('pool-bubbles', {
  schema: { count:{type:'number',default:40}, width:{type:'number',default:8}, depth:{type:'number',default:4} },
  init: function(){
    this.bs = [];
    const g = new THREE.SphereGeometry(.025,5,5);
    const m = new THREE.MeshStandardMaterial({color:0xaaddff,transparent:true,opacity:.5,emissive:0x224488,emissiveIntensity:.4});
    for(let i=0;i<this.data.count;i++){
      const mesh = new THREE.Mesh(g,m.clone());
      mesh.position.set((Math.random()-.5)*this.data.width*.9, -.8, (Math.random()-.5)*this.data.depth*.9);
      mesh._spd   = .3+Math.random()*.6;
      mesh._delay = Math.random()*5;
      mesh._sx    = mesh.position.x;
      mesh._sz    = mesh.position.z;
      this.el.object3D.add(mesh);
      this.bs.push(mesh);
    }
    this.t = 0;
  },
  tick: function(t,dt){
    this.t += dt/1000;
    this.bs.forEach(b=>{
      const age = (this.t+b._delay)%4.5;
      b.position.y = -.8+age*b._spd;
      b.material.opacity = age<4 ? .5 : (4.5-age)/0.5*.5;
      if(b.position.y>.1){ b.position.x=(Math.random()-.5)*this.data.width*.9; b.position.y=-.8; }
    });
  }
});


/* ── Ceiling fan ── */
AFRAME.registerComponent('fan-spin', {
  schema: { rpm:{type:'number',default:80} },
  tick: function(t){ this.el.object3D.rotation.y = (t/1000)*(this.data.rpm/60)*Math.PI*2; }
});


/* ── Gentle sway (for trees) ── */
AFRAME.registerComponent('sway', {
  schema: { amt:{type:'number',default:.02}, spd:{type:'number',default:.8} },
  init: function(){ this.t=0; this.base=this.el.object3D.rotation.z; },
  tick: function(t,dt){
    this.t+=dt/1000;
    this.el.object3D.rotation.z = this.base + Math.sin(this.t*this.data.spd)*this.data.amt;
  }
});


/* ── Fireflies ── */
AFRAME.registerComponent('fireflies', {
  schema:{ count:{type:'number',default:25} },
  init:function(){
    this.flies=[];
    const g=new THREE.SphereGeometry(.035,5,5);
    for(let i=0;i<this.data.count;i++){
      const m=new THREE.MeshStandardMaterial({color:0xffee88,emissive:0xffdd44,emissiveIntensity:2,transparent:true,opacity:.8});
      const mesh=new THREE.Mesh(g,m);
      mesh.position.set((Math.random()-.5)*30,1+Math.random()*3,(Math.random()-.5)*30);
      mesh._ox=mesh.position.x; mesh._oy=mesh.position.y; mesh._oz=mesh.position.z;
      mesh._ph=Math.random()*Math.PI*2; mesh._spd=.3+Math.random()*.5; mesh._amp=.5+Math.random()*.8;
      this.el.sceneEl.object3D.add(mesh);
      this.flies.push(mesh);
    }
    this.t=0;
  },
  tick:function(t,dt){
    this.t+=dt/1000;
    this.flies.forEach(f=>{
      f.position.x=f._ox+Math.sin(this.t*f._spd+f._ph)*f._amp;
      f.position.y=f._oy+Math.sin(this.t*f._spd*.7+f._ph)*.35;
      f.position.z=f._oz+Math.cos(this.t*f._spd+f._ph)*f._amp;
      f.material.opacity=.4+.5*Math.abs(Math.sin(this.t*f._spd*2+f._ph));
    });
  }
});
