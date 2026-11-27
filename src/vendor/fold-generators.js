// FOLD generators (MESO-lab01): plant growth first, general algorithms later.
// Every generator works on the same node model and returns, per step, the nodes born and the ids that died.
// node: { id, x, y, z, parent, lineage, kind, born, age, energy }   x, z ∈ [-1, 1] timbre plane · y ∈ [-1, 1] pitch (stem axis)
export function rng(seed = 1) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (v, a = -1, b = 1) => Math.max(a, Math.min(b, v));
const gauss = r => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // 137.508°
const ST = 2 / 72; // one semitone in cube units (C1–C7)

function base(r, p) {
  let next = 1, step = 0; const nodes = new Map();
  const make = (o, parent) => { const n = { id: next++, parent: parent?.id ?? null, lineage: parent?.lineage ?? next - 1, born: step, age: 0, energy: 1, kind: 'node', ...o, x: clamp(o.x), y: clamp(o.y), z: clamp(o.z) }; nodes.set(n.id, n); return n; };
  const kill = (n, died) => { if (nodes.delete(n.id)) died.push(n.id); };
  const cap = born => { const died = []; const max = p.cap; if (nodes.size > max) { const old = [...nodes.values()].sort((a, b) => a.born - b.born).slice(0, nodes.size - max); old.forEach(n => kill(n, died)); } return died; };
  return { r, p, nodes, make, kill, cap, tick() { step++; for (const n of nodes.values()) n.age++; return step; }, get step() { return step; } };
}

// 1 · Apomictic lineage: clonal seed without recombination; somatic mutation μ, dormancy, dispersal.
function apomixis(r, p) {
  const b = base(r, p), born0 = [];
  for (let i = 0; i < p.seeds; i++) born0.push(b.make({ x: r() * 2 - 1, y: -0.6 + r() * 1.2, z: r() * 2 - 1, kind: 'seed', capsule: {lineage:i,generation:0,scale:1,stress:p.mu,flight:0}, dormancy: 1 + Math.floor(r() * 4) }));
  let first = born0;
  return { ...b, name: 'apomixis', step() {
    if (first) { const out = first; first = null; return { born: out, died: [] }; }
    b.tick(); const born = [], died = [];
    for (const n of [...b.nodes.values()]) {
      if (n.age > 0 && n.age % n.dormancy === 0 && r() < p.fertility) {
        // Detachment follows a lineage sector; no merging or cross-lineage edges.
        const generation=n.capsule.generation+1,angle=(n.capsule.lineage+1)*2.399963+n.id*.71;
        const distance=(.045+.14*r())*p.spread,spore=p.spread>2.5;
        const flight=spore?.5+distance:distance;
        const dx=Math.cos(angle)*flight,dy=(r()-.35)*flight*.65,dz=Math.sin(angle)*flight;
        born.push(b.make({ x:n.x+dx,y:n.y+dy,z:n.z+dz,kind:spore?'spore':'clone',
          capsule:{lineage:n.capsule.lineage,generation,scale:Math.max(.16,n.capsule.scale*.8),stress:p.mu,mother:[n.x,n.y,n.z],flight:.25+flight*1.5},
          dormancy:Math.max(1,n.dormancy+(r()<p.mu?(r()<.5?-1:1):0)) },n));
      }
      if (n.age > p.life) b.kill(n, died);
    }
    return { born, died: died.concat(b.cap()) };
  } };
}

// 2 · Phyllotaxis: organs along the stem (pitch), each turned by the golden angle in the timbre plane (Vogel radius).
function phyllotaxis(r, p) {
  const b = base(r, p), stems = [];
  const stem = () => ({ cx: (r() * 2 - 1) * .5, cz: (r() * 2 - 1) * .5, y: -1 + r() * .3, n: 0, top: null, internode: (1 + Math.floor(r() * 3)) * ST });
  for (let i = 0; i < p.seeds; i++) stems.push(stem());
  return { ...b, name: 'phyllotaxis', step() {
    b.tick(); const born = [], died = [];
    for (let i = 0; i < stems.length; i++) {
      const s = stems[i], a = s.n * GOLDEN, rad = Math.min(1, p.spread * Math.sqrt(s.n + 1) / 4);
      s.y += s.internode; s.n++;
      const n = b.make({ x: s.cx + rad * Math.cos(a), y: s.y, z: s.cz + rad * Math.sin(a), kind: 'leaf' }, s.top); s.top = n; born.push(n);
      if (s.y > .95) stems[i] = stem();
    }
    for (const n of [...b.nodes.values()]) if (n.age > p.life) b.kill(n, died);
    return { born, died: died.concat(b.cap()) };
  } };
}

// 3 · Stolon / rhizome: runners wander the timbre plane at fixed pitch with inertia; ramets root and send short vertical shoots.
function stolon(r, p) {
  const b = base(r, p), runners = [];
  const runner = (x, y, z, parent) => ({ x, y, z, heading: r() * Math.PI * 2, dist: 0, last: parent || null });
  for (let i = 0; i < p.seeds; i++) runners.push(runner(r() * 2 - 1, -0.7 + r() * 1.4, r() * 2 - 1));
  const shoots = [];
  return { ...b, name: 'stolon', step() {
    b.tick(); const born = [], died = [];
    for (const s of runners) {
      s.heading += gauss(r) * (1 - p.inertia) * 1.2;
      const v = .06 * p.spread; s.x += Math.cos(s.heading) * v; s.z += Math.sin(s.heading) * v; s.dist += v;
      if (Math.abs(s.x) > 1) { s.heading = Math.PI - s.heading; s.x = clamp(s.x); }
      if (Math.abs(s.z) > 1) { s.heading = -s.heading; s.z = clamp(s.z); }
      if (s.dist > p.internodeTimbre) { s.dist = 0; const n = b.make({ x: s.x, y: s.y, z: s.z, kind: 'ramet' }, s.last); s.last = n; born.push(n); if (r() < p.fertility) shoots.push({ from: n, left: 2 + Math.floor(r() * 3) }); }
    }
    for (let i = shoots.length - 1; i >= 0; i--) { const sh = shoots[i]; const n = b.make({ x: sh.from.x + gauss(r) * .03, y: sh.from.y + (2 + Math.floor(r() * 4)) * ST, z: sh.from.z + gauss(r) * .03, kind: 'shoot' }, sh.from); sh.from = n; born.push(n); if (--sh.left <= 0 || n.y >= 1) shoots.splice(i, 1); }
    if (runners.length < p.seeds * 3 && r() < p.dispersal) { const any = [...b.nodes.values()].at(-1); if (any) runners.push(runner(any.x, any.y + (r() < .5 ? -12 : 12) * ST * (r() < .5 ? .5 : 1), any.z, any)); }
    for (const n of [...b.nodes.values()]) if (n.age > p.life) b.kill(n, died);
    return { born, died: died.concat(b.cap()) };
  } };
}

// 4 · Apical dominance: the apex climbs the stem and inhibits lateral buds within a radius; when it dies, buds are released.
function apical(r, p) {
  const b = base(r, p), apices = [], buds = [];
  const apex = (x, y, z, parent, dir) => ({ x, y, z, last: parent || null, dx: dir?.[0] ?? 0, dz: dir?.[1] ?? 0, life: p.life * (.5 + r()) });
  for (let i = 0; i < p.seeds; i++) apices.push(apex((r() * 2 - 1) * .6, -0.95, (r() * 2 - 1) * .6));
  return { ...b, name: 'apical', step() {
    b.tick(); const born = [], died = [];
    for (let i = apices.length - 1; i >= 0; i--) {
      const a = apices[i];
      a.x += a.dx * .05 + gauss(r) * .02 * p.mu * 4; a.z += a.dz * .05 + gauss(r) * .02 * p.mu * 4; a.y += (1 + Math.floor(r() * 2)) * ST;
      const n = b.make({ x: a.x, y: a.y, z: a.z, kind: 'apex', energy: 1 }, a.last); a.last = n; born.push(n);
      if (r() < p.fertility) { const ang = r() * Math.PI * 2; buds.push({ node: n, dir: [Math.cos(ang), Math.sin(ang)] }); }
      a.life--; if (a.life <= 0 || a.y >= 1) apices.splice(i, 1);
    }
    for (let i = buds.length - 1; i >= 0; i--) {
      const bud = buds[i], inhibited = apices.some(a => Math.hypot(a.x - bud.node.x, a.z - bud.node.z, (a.y - bud.node.y) * 1.5) < p.dominance);
      if (!inhibited && apices.length < p.seeds * 4) { apices.push(apex(bud.node.x, bud.node.y, bud.node.z, bud.node, bud.dir)); buds.splice(i, 1); }
    }
    if (!apices.length) apices.push(apex((r() * 2 - 1) * .6, -0.95, (r() * 2 - 1) * .6));
    for (const n of [...b.nodes.values()]) if (n.age > p.life * 3) b.kill(n, died);
    return { born, died: died.concat(b.cap()) };
  } };
}

// 5 · Tropism: tips grow toward a moving light (attractor) in the cube; growth rate falls with distance.
function tropism(r, p) {
  const b = base(r, p), tips = [];
  for (let i = 0; i < p.seeds; i++) tips.push({ x: r() * 2 - 1, y: -0.9, z: r() * 2 - 1, last: null });
  const light = { x: 0, y: .5, z: 0 };
  return { ...b, name: 'tropism', light, step() {
    const s = b.tick(), t = s * .02; light.x = Math.sin(t * 1.3) * .8; light.z = Math.sin(t * .7 + 1) * .8; light.y = Math.sin(t * .4) * .7;
    const born = [], died = [];
    for (const tip of tips) {
      const dx = light.x - tip.x, dy = light.y - tip.y, dz = light.z - tip.z, d = Math.hypot(dx, dy, dz) || 1, v = .05 * p.spread;
      tip.x += dx / d * v + gauss(r) * p.mu * .1; tip.y += dy / d * v + gauss(r) * p.mu * .03; tip.z += dz / d * v + gauss(r) * p.mu * .1;
      const n = b.make({ x: tip.x, y: tip.y, z: tip.z, kind: 'tip', energy: 1 / (1 + d) }, tip.last); tip.last = n; born.push(n);
    }
    for (const n of [...b.nodes.values()]) if (n.age > p.life) b.kill(n, died);
    return { born, died: died.concat(b.cap()) };
  } };
}

// 6 · Space colonisation (Runions et al. 2007): auxin markers attract the nearest branch tips; reached markers vanish; ties branch.
function colonisation(r, p) {
  const b = base(r, p); let markers = [];
  const sow = () => { markers = Array.from({ length: p.markers }, () => ({ x: r() * 2 - 1, y: r() * 2 - 1, z: r() * 2 - 1 })); };
  sow();
  for (let i = 0; i < p.seeds; i++) b.make({ x: (r() * 2 - 1) * .3, y: -1, z: (r() * 2 - 1) * .3, kind: 'root' });
  let first = true;
  return { ...b, name: 'colonisation', markers: () => markers, step() {
    if (first) { first = false; return { born: [...b.nodes.values()], died: [] }; }
    b.tick(); const born = [], died = [], pull = new Map(), list = [...b.nodes.values()];
    for (const m of markers) {
      let best = null, d = p.influence;
      for (const n of list) { const e = Math.hypot(n.x - m.x, n.y - m.y, n.z - m.z); if (e < d) { d = e; best = n; } }
      if (best) { const v = pull.get(best) || [0, 0, 0, 0]; v[0] += (m.x - best.x) / d; v[1] += (m.y - best.y) / d; v[2] += (m.z - best.z) / d; v[3]++; pull.set(best, v); }
    }
    let grown = 0;
    for (const [n, v] of pull) { if (grown >= p.perStep) break; const l = Math.hypot(v[0], v[1], v[2]) || 1, s = .045 * p.spread; born.push(b.make({ x: n.x + v[0] / l * s, y: n.y + v[1] / l * s, z: n.z + v[2] / l * s, kind: 'branch', energy: Math.min(1, v[3] / 6) }, n)); grown++; }
    markers = markers.filter(m => !born.some(n => Math.hypot(n.x - m.x, n.y - m.y, n.z - m.z) < p.kill));
    if (markers.length < p.markers * .1 || !born.length) sow();
    for (const n of [...b.nodes.values()]) if (n.age > p.life * 2) b.kill(n, died);
    return { born, died: died.concat(b.cap()) };
  } };
}

export const GENERATORS = Object.freeze({
  apomixis: { make: apomixis, label: 'APOMIXIS · clonal lineage', help: 'Clonal seed without recombination; somatic mutation μ, dormancy, dispersal by fifths and octaves.' },
  phyllotaxis: { make: phyllotaxis, label: 'PHYLLOTAXIS · golden angle', help: 'Stem = pitch. Each new organ turns 137.5° in the timbre plane: a golden Klangfarbenmelodie.' },
  stolon: { make: stolon, label: 'STOLON · rhizome', help: 'Runners travel the timbre plane at fixed pitch with inertia; ramets send short shoots upward.' },
  apical: { make: apical, label: 'APICAL DOMINANCE', help: 'Apices climb; lateral buds stay dormant inside the dominance radius until the apex dies.' },
  tropism: { make: tropism, label: 'TROPISM · light', help: 'Tips grow toward a moving light in the cube (pitch and timbre attractor).' },
  colonisation: { make: colonisation, label: 'SPACE COLONISATION', help: 'Runions et al. 2007: auxin markers pull the nearest tips; reached markers vanish.' }
});
export const DEFAULTS = Object.freeze({ seeds: 3, mu: .08, fertility: .45, dispersal: .08, life: 48, cap: 600, spread: 1, inertia: .8, internodeTimbre: .18, dominance: .35, markers: 220, influence: .45, kill: .08, perStep: 6 });
export function createGenerator(name, params = {}, seed = 1931) { const g = GENERATORS[name] || GENERATORS.apomixis; return g.make(rng(seed), { ...DEFAULTS, ...params }); }
