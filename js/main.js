/* main.js */

const ROOMS = {
  exterior: { pos:'0 1.6 28',   rot:'0 180 0' },
  living:   { pos:'0 1.6 -3',   rot:'0 0 0'   },
  kitchen:  { pos:'-13 1.6 -3', rot:'0 0 0'   },
  bedroom:  { pos:'13 1.6 -3',  rot:'0 0 0'   },
  pool:     { pos:'0 1.6 19',   rot:'0 180 0' }
};

function teleport(room) {
  const w = ROOMS[room]; if(!w) return;
  const rig = document.getElementById('rig');
  rig.setAttribute('position', w.pos);
  rig.setAttribute('rotation', w.rot);
  document.querySelectorAll('.rbtn').forEach(b=>b.classList.toggle('active', b.dataset.room===room));
}

function initLoader(){
  const scene  = document.querySelector('a-scene');
  const loader = document.getElementById('loader');
  const fill   = document.getElementById('bar-fill');
  const pct    = document.getElementById('bar-pct');
  let p = 0;
  const iv = setInterval(()=>{ p=Math.min(p+Math.random()*7,88); fill.style.width=p+'%'; pct.textContent=Math.floor(p)+'%'; },180);
  scene.addEventListener('loaded',()=>{
    clearInterval(iv); fill.style.width='100%'; pct.textContent='100%';
    setTimeout(()=>loader.classList.add('out'),600);
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  initLoader();
  document.querySelectorAll('.rbtn').forEach(b=>b.addEventListener('click',()=>teleport(b.dataset.room)));
  document.querySelector('[data-room="exterior"]')?.classList.add('active');
});
