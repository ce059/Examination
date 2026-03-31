/**
 * water-physics.js — Animated Pool Water System
 * Dream Villa VR Experience
 *
 * Uses a custom A-Frame component to drive realistic-looking
 * water animation with ripple propagation, colour cycling,
 * and foam-like opacity pulses — all via THREE.js shader uniforms.
 */

// ─────────────────────────────────────────────────
// Component: water-surface
// Apply to the pool water plane. Cycles colour and
// vertically displaces the mesh to fake wave motion.
// ─────────────────────────────────────────────────
AFRAME.registerComponent('water-surface', {
  schema: {
    waveHeight:    { type: 'number', default: 0.04 },   // vertical amplitude (m)
    waveFrequency: { type: 'number', default: 0.9 },    // waves per second
    colorA:        { type: 'color',  default: '#00aadd' },
    colorB:        { type: 'color',  default: '#0077bb' },
    rippleSpeed:   { type: 'number', default: 0.6 }
  },

  init() {
    this.t       = 0;
    this.colA    = new THREE.Color(this.data.colorA);
    this.colB    = new THREE.Color(this.data.colorB);
    this.colMix  = new THREE.Color();
    this.originY = this.el.object3D.position.y;

    // Collect ripple entities spawned by water-ripples component
    this.ripples = [];
  },

  tick(time, delta) {
    const dt = delta / 1000;
    this.t += dt;

    const t = this.t;

    // ── Vertical bob (wave) ──
    const wave = Math.sin(t * Math.PI * 2 * this.data.waveFrequency)
               * this.data.waveHeight;
    this.el.object3D.position.y = this.originY + wave;

    // ── Colour blend ──
    const mix = (Math.sin(t * this.data.rippleSpeed) + 1) * 0.5;
    this.colMix.lerpColors(this.colA, this.colB, mix);

    const mesh = this.el.getObject3D('mesh');
    if (mesh) {
      mesh.traverse(node => {
        if (node.isMesh && node.material) {
          node.material.color.copy(this.colMix);
          // Pulse opacity slightly for foam illusion
          node.material.opacity =
            0.72 + Math.sin(t * 1.3 + 0.5) * 0.08;
          node.material.needsUpdate = true;
        }
      });
    }

    // ── Scale ripple to fake surface distortion ──
    const scl = 1 + Math.sin(t * 2.7) * 0.008;
    this.el.object3D.scale.set(scl, 1, scl);
  }
});

// ─────────────────────────────────────────────────
// Component: water-ripples
// Manages a pool of expanding torus rings that
// appear at random positions inside the pool bounds.
// ─────────────────────────────────────────────────
AFRAME.registerComponent('water-ripples', {
  schema: {
    count:     { type: 'int',    default: 4 },
    poolCx:    { type: 'number', default: 14 },   // pool centre X
    poolCz:    { type: 'number', default: -2 },   // pool centre Z
    halfW:     { type: 'number', default: 4.5 },  // half-width
    halfD:     { type: 'number', default: 3.5 },  // half-depth
    waterY:    { type: 'number', default: 0.225 },
    minPeriod: { type: 'number', default: 2000 }, // ms
    maxPeriod: { type: 'number', default: 4500 }
  },

  init() {
    this.rings = [];
    for (let i = 0; i < this.data.count; i++) {
      this._spawnRing(i * (this.data.maxPeriod / this.data.count));
    }
  },

  _spawnRing(delay) {
    const d = this.data;
    const scene = this.el.sceneEl;

    const ring = document.createElement('a-torus');
    const rx = d.poolCx + (Math.random() * 2 - 1) * d.halfW * 0.8;
    const rz = d.poolCz + (Math.random() * 2 - 1) * d.halfD * 0.8;

    ring.setAttribute('position', `${rx} ${d.waterY} ${rz}`);
    ring.setAttribute('rotation', '-90 0 0');
    ring.setAttribute('radius', '0.1');
    ring.setAttribute('radius-tubular', '0.015');
    ring.setAttribute('segments-radial', '24');
    ring.setAttribute('material',
      'color: #ffffff; transparent: true; opacity: 0.5; side: double');

    const period = d.minPeriod + Math.random() * (d.maxPeriod - d.minPeriod);

    ring.setAttribute('animation__radius',
      `property: geometry.radius; from: 0.1; to: 2.2;
       dur: ${period}; loop: true; delay: ${delay};
       easing: easeOutCubic`);

    ring.setAttribute('animation__opacity',
      `property: components.material.material.opacity;
       from: 0.55; to: 0;
       dur: ${period}; loop: true; delay: ${delay};
       easing: easeOutCubic`);

    scene.appendChild(ring);
    this.rings.push(ring);
  },

  remove() {
    this.rings.forEach(r => r.parentNode && r.parentNode.removeChild(r));
    this.rings = [];
  }
});

// ─────────────────────────────────────────────────
// Attach components to pool elements once scene loads
// ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  if (!sceneEl) return;

  sceneEl.addEventListener('loaded', () => {
    // Attach water-surface to the pool water box
    const poolWater = document.getElementById('pool-water');
    if (poolWater) {
      poolWater.setAttribute('water-surface', '');
    }

    // Inject the ripple manager as a scene-level component
    sceneEl.setAttribute('water-ripples', '');

    console.log('[water-physics] Pool animation systems active.');
  });
});
