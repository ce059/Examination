/**
 * main.js — Custom A-Frame Components & Scene Logic
 * Dream Villa VR Experience
 */

// ─────────────────────────────────────────────────
// Component: floating-decoration
// Makes small decorative items bob up and down
// ─────────────────────────────────────────────────
AFRAME.registerComponent('floating-decoration', {
  schema: {
    amplitude: { type: 'number', default: 0.05 },
    speed:     { type: 'number', default: 1.5 }
  },
  init() {
    this.originY = this.el.object3D.position.y;
    this.t = Math.random() * Math.PI * 2; // random phase
  },
  tick(time, delta) {
    this.t += (delta / 1000) * this.data.speed;
    this.el.object3D.position.y =
      this.originY + Math.sin(this.t) * this.data.amplitude;
  }
});

// ─────────────────────────────────────────────────
// Component: gentle-sway
// Sways vegetation (trees, bushes)
// ─────────────────────────────────────────────────
AFRAME.registerComponent('gentle-sway', {
  schema: {
    maxAngle: { type: 'number', default: 2 },
    speed:    { type: 'number', default: 0.8 }
  },
  init() {
    this.baseRot = { ...this.el.object3D.rotation };
    this.t = Math.random() * Math.PI * 2;
  },
  tick(time, delta) {
    this.t += (delta / 1000) * this.data.speed;
    const sway = Math.sin(this.t) * this.data.maxAngle * (Math.PI / 180);
    this.el.object3D.rotation.z = this.baseRot.z + sway;
    this.el.object3D.rotation.x = this.baseRot.x + sway * 0.4;
  }
});

// ─────────────────────────────────────────────────
// Component: pool-shimmer
// Animates pool water UV offset for shimmer effect
// ─────────────────────────────────────────────────
AFRAME.registerComponent('pool-shimmer', {
  schema: {
    speed: { type: 'number', default: 0.5 }
  },
  init() {
    this.t = 0;
    this.mesh = null;
    this.el.addEventListener('object3dset', () => {
      this.mesh = this.el.getObject3D('mesh');
    });
  },
  tick(time, delta) {
    this.t += (delta / 1000) * this.data.speed;
    if (!this.mesh) {
      this.mesh = this.el.getObject3D('mesh');
      return;
    }
    // Subtle hue shift
    const hue = 0.55 + Math.sin(this.t * 0.7) * 0.04;
    const sat = 0.75 + Math.sin(this.t * 1.1) * 0.1;
    const lig = 0.45 + Math.sin(this.t * 0.9) * 0.06;
    this.mesh.traverse(node => {
      if (node.isMesh && node.material) {
        node.material.color.setHSL(hue, sat, lig);
      }
    });
  }
});

// ─────────────────────────────────────────────────
// Component: room-proximity-label
// Shows label when player is near a room
// ─────────────────────────────────────────────────
AFRAME.registerComponent('room-proximity-label', {
  schema: {
    label:    { type: 'string', default: 'Room' },
    radius:   { type: 'number', default: 4 }
  },
  init() {
    this.labelEl = document.getElementById('room-label');
    this.player  = document.getElementById('player');
    this.inside  = false;
  },
  tick() {
    if (!this.player) return;
    const myPos = this.el.object3D.position;
    const plPos = this.player.object3D.position;
    const dx = myPos.x - plPos.x;
    const dz = myPos.z - plPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < this.data.radius && !this.inside) {
      this.inside = true;
      this.labelEl.textContent = this.data.label;
      this.labelEl.style.opacity = '1';
    } else if (dist >= this.data.radius && this.inside) {
      this.inside = false;
      this.labelEl.style.opacity = '0';
    }
  }
});

// ─────────────────────────────────────────────────
// Scene-level initialisation (runs after DOM ready)
// ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Attach proximity labels to room anchor entities
  const roomAnchors = [
    { id: 'villa-body', label: 'Living Room · Main Hall', x: 0,  z: 1  },
    { id: null,         label: 'Master Bedroom',          x: -7, z: -8 },
    { id: null,         label: 'Kitchen',                 x: 6,  z: -4 },
    { id: 'pool-water', label: 'Swimming Pool',           x: 14, z: -2 },
  ];

  // Keyboard shortcut: [N] toggles night mode
  window.addEventListener('keydown', e => {
    if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey) {
      toggleNightMode();
    }
  });

  console.log(
    '%c🏡 Dream Villa VR Experience loaded',
    'color:#e8d5a3;background:#0a0a20;padding:6px 12px;border-radius:4px;font-size:14px'
  );
  console.log('Controls: WASD to move · Mouse to look · N = Night mode');
  console.log('UI buttons teleport you to each room.');
});

// ─────────────────────────────────────────────────
// Day / Night toggle
// ─────────────────────────────────────────────────
let isNight = false;
function toggleNightMode() {
  isNight = !isNight;
  const sky   = document.querySelector('a-sky');
  const sun   = document.querySelector('a-light[type="directional"]');
  const amb   = document.querySelector('a-light[type="ambient"]');

  if (isNight) {
    sky.setAttribute('color', '#050510');
    if (sun) sun.setAttribute('intensity', '0.1');
    if (amb) { amb.setAttribute('color', '#1a2040'); amb.setAttribute('intensity', '0.2'); }
  } else {
    sky.setAttribute('color', '#87CEEB');
    if (sun) sun.setAttribute('intensity', '1.8');
    if (amb) { amb.setAttribute('color', '#c8d8f0'); amb.setAttribute('intensity', '0.55'); }
  }
}
