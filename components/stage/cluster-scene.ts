import type * as ThreeNS from "three";
import type { SentinelLine } from "@/lib/bus";

/**
 * The cluster: the one object this page is built around.
 *
 * A backend engineer's work is invisible — it is what happens between a click
 * and a response. So the page draws the system Obadah's CV describes, and
 * sends real-looking traffic through it: a gateway, four API instances, a
 * BullMQ queue with workers, one adapter in front of three OTP providers, four
 * Redis instances under three Sentinels, and Postgres split by tenant.
 *
 * Hard-surface, so it earns WebGL (signature-design §3): machined steel
 * modules with chamfered edges and a Damascus-steel grain — folded layers, for
 * an engineer from Damascus who builds layered systems — reflecting a painted
 * machine-room environment. Nothing is downloaded: every texture is painted
 * here, on a canvas.
 *
 * Driven, not animated: the page decides where the camera is and what the
 * traffic should emphasise (`SceneInput`); this file eases toward it, framerate
 * independent. Scrolling faster sends more requests, so a fast scroll fills the
 * queue and you watch back-pressure hold the overflow at the API instances.
 *
 * r186 notes (omni-channel `threejs` skill, version-traps.md): colours from hex
 * strings (sRGB), CanvasTexture colorSpace set on colour maps only, no
 * THREE.Clock, PointsMaterial size is not world units — the packet shader
 * sizes points itself, dividing by tan(fov/2). `Object3D.dispose()` frees
 * nothing, so dispose() walks the scene.
 */

export interface SceneInput {
  /** Camera position and the point it looks at. */
  px: number;
  py: number;
  pz: number;
  lx: number;
  ly: number;
  lz: number;
  /** Shift of the projection centre, as a fraction of the viewport. */
  offX: number;
  offY: number;
  /** -1 hero, 0..3 the system chapters, 4 reading, 5 the response. */
  chapter: number;
  /** Requests per second added by the visitor's own scrolling. */
  traffic: number;
  /** 0..1 — tenants coloured apart. */
  tenancy: number;
  /** 0..1 — everything answered, everything green. */
  finale: number;
}

export interface Anchor {
  id: string;
  text: string;
  tone: "" | "ok" | "fail" | "copper";
  x: number;
  y: number;
  show: boolean;
}

export interface ClusterScene {
  frame(dt: number, t: number, input: SceneInput): void;
  resize(w: number, h: number): void;
  kill(): void;
  anchors: Anchor[];
  dispose(): void;
}

export interface FailoverEvents {
  onLine(line: SentinelLine): void;
  onBusy(busy: boolean, primary: number): void;
}

/* ---- palette (sRGB hex; three converts) -------------------------------- */
const C = {
  void: "#090b0c",
  bone: "#ece7de",
  copper: "#e08a4f",
  amber: "#f2b35c",
  ok: "#6fe3a8",
  fail: "#ff5d52",
  tenantA: "#e08a4f",
  tenantB: "#9db7c8",
  tenantC: "#ece7de",
};

/* ---- where everything stands (model units ≈ metres) ------------------- */
const API_Z = [-3, -1, 1, 3];
const API_X = -5.6;
const GATE_X = -10;
const Q_TAIL = -1.8;
const Q_HEAD = 4.6;
const Q_SLOTS = 34;
const WORKER_X = 6.9;
const WORKER_Z = [-1.4, 1.4];
const WORKER_CONCURRENCY = 3;
const ADAPTER_X = 9.3;
const PROV_X = 12.3;
const PROV_Z = [-2.6, 0, 2.6];
const REDIS_X = [-1.6, 0.2, 2.0, 3.8];
const REDIS_Z = -6.6;
const SENT_X = [-0.7, 1.1, 2.9];
const PG = { x: 1.2, z: 6.8 };
const PG_Y = [0.45, 1.4, 2.35];
const DLQ = { x: 4.0, z: 1.75 };

type Stage =
  | "in" | "lb" | "hold" | "toQ" | "queued" | "toW" | "work" | "toP" | "call"
  | "retry" | "dlq" | "toR" | "holdR" | "toDB" | "flash" | "dead";

interface Packet {
  stage: Stage;
  curve: ThreeNS.Curve<ThreeNS.Vector3> | null;
  len: number;
  t: number;
  speed: number;
  timer: number;
  api: number;
  worker: number;
  prov: number;
  /** 0 through the queue · 1 a Redis read · 2 a tenant's database. */
  route: number;
  /** The Redis node this packet was sent to. */
  target: number;
  tenant: number;
  attempts: number;
  jx: number;
  jy: number;
  jz: number;
  /** Colour override while flashing: 0 copper/tenant, 1 ok, 2 fail, 3 amber. */
  tone: number;
  x: number;
  y: number;
  z: number;
  alpha: number;
  size: number;
}

export function createClusterScene(
  THREE: typeof ThreeNS,
  renderer: ThreeNS.WebGLRenderer,
  opts: { packets: number; pixelRatio: number; events: FailoverEvents },
): { scene: ThreeNS.Scene; camera: ThreeNS.PerspectiveCamera; api: ClusterScene } {
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C.void, 24, 52);
  const FOV = 34;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(-4, 10, 20);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  /* ---- environment: a machine room — overhead softbox, copper window ---- */
  {
    const env = document.createElement("canvas");
    env.width = 1024;
    env.height = 512;
    const g = env.getContext("2d")!;
    const sky = g.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, "#0e1316");
    sky.addColorStop(0.44, "#141a1e");
    sky.addColorStop(0.5, "#c9d3d8");
    sky.addColorStop(0.53, "#1a2125");
    sky.addColorStop(1, "#050607");
    g.fillStyle = sky;
    g.fillRect(0, 0, 1024, 512);
    // the long overhead softbox that draws a line down every top face
    const box = g.createLinearGradient(0, 40, 0, 110);
    box.addColorStop(0, "rgba(235,240,242,0)");
    box.addColorStop(0.5, "rgba(235,240,242,0.95)");
    box.addColorStop(1, "rgba(235,240,242,0)");
    g.fillStyle = box;
    g.fillRect(260, 40, 520, 70);
    const blob = (x: number, y: number, r: number, c: string) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, c);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rg;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    };
    blob(800, 220, 150, "rgba(224,138,79,0.6)"); // copper window
    blob(120, 210, 110, "rgba(200,215,225,0.55)"); // cool fill
    blob(520, 300, 90, "rgba(111,227,168,0.18)"); // a little status green
    const envTex = new THREE.CanvasTexture(env);
    envTex.colorSpace = THREE.SRGBColorSpace;
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = keep(pmrem.fromEquirectangular(envTex));
    scene.environment = envRT.texture;
    envTex.dispose();
    pmrem.dispose();
  }

  const key = new THREE.DirectionalLight("#dfe7ec", 2.0);
  key.position.set(-6, 10, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(C.copper, 1.6);
  rim.position.set(8, 3, -9);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight("#2a3338", "#050607", 0.6));

  /* ---- Damascus steel: folded layers, painted, tiling ---------------------- */
  const damascus = (() => {
    const S = 512;
    const col = document.createElement("canvas");
    const rough = document.createElement("canvas");
    col.width = col.height = rough.width = rough.height = S;
    const cg = col.getContext("2d")!;
    const rgx = rough.getContext("2d")!;
    const ci = cg.createImageData(S, S);
    const ri = rgx.createImageData(S, S);
    const dark = [0x7c, 0x84, 0x89];
    const light = [0xb6, 0xbd, 0xc1];
    for (let y = 0; y < S; y++) {
      const v = (y / S) * Math.PI * 2;
      for (let x = 0; x < S; x++) {
        const u = (x / S) * Math.PI * 2;
        // integer frequencies in u and v, so the pattern tiles without a seam
        const warp = Math.sin(u * 2 + Math.sin(v * 3) * 1.3) * 0.9 + Math.sin(v * 5 + u) * 0.45 + Math.sin(u * 7 - v * 2) * 0.18;
        const band = Math.sin(v * 9 + warp * 3.2) + Math.sin(v * 31 + warp * 7) * 0.35;
        const k = 0.5 + 0.5 * Math.tanh(band * 2.2);
        const i = (y * S + x) * 4;
        ci.data[i] = dark[0] + (light[0] - dark[0]) * k;
        ci.data[i + 1] = dark[1] + (light[1] - dark[1]) * k;
        ci.data[i + 2] = dark[2] + (light[2] - dark[2]) * k;
        ci.data[i + 3] = 255;
        const r = 0.44 - 0.1 * k; // the bright layers are the polished ones
        ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = r * 255;
        ri.data[i + 3] = 255;
      }
    }
    cg.putImageData(ci, 0, 0);
    rgx.putImageData(ri, 0, 0);
    const map = keep(new THREE.CanvasTexture(col));
    map.colorSpace = THREE.SRGBColorSpace; // a colour map
    const roughMap = keep(new THREE.CanvasTexture(rough)); // data: stays NoColorSpace
    for (const t of [map, roughMap]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(0.42, 0.42);
      t.anisotropy = 4;
    }
    return { map, roughMap };
  })();

  const steel = keep(
    new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      map: damascus.map,
      roughnessMap: damascus.roughMap,
      roughness: 1,
      metalness: 1,
      clearcoat: 0.35,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.25,
    }),
  );
  const darkSteel = keep(
    new THREE.MeshStandardMaterial({ color: "#2a3135", metalness: 0.9, roughness: 0.55, envMapIntensity: 0.8 }),
  );

  /** A machined slab: rounded rectangle in XY, extruded along Z, chamfered. */
  const slabGeo = (w: number, h: number, d: number, r = 0.08) => {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    const b = Math.min(0.035, d * 0.15);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: d - 2 * b,
      bevelEnabled: true,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 3,
      curveSegments: 5,
    });
    geo.translate(0, 0, -(d - 2 * b) / 2);
    geo.computeVertexNormals();
    return keep(geo);
  };

  /** A puck: a lathed cylinder with chamfered rims. */
  const puckGeo = (r: number, h: number) => {
    const c = 0.05;
    const pts = [
      [0, -h / 2], [r - c, -h / 2], [r, -h / 2 + c], [r, h / 2 - c], [r - c, h / 2], [r * 0.82, h / 2], [r * 0.8, h / 2 - 0.03], [0, h / 2 - 0.03],
    ].map(([a, b]) => new THREE.Vector2(a, b));
    const geo = new THREE.LatheGeometry(pts, 72);
    geo.computeVertexNormals();
    return keep(geo);
  };

  /* ---- glow: one painted sprite, used for every LED halo ----------------- */
  const haloTex = (() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, "rgba(255,255,255,1)");
    rg.addColorStop(0.2, "rgba(255,255,255,0.55)");
    rg.addColorStop(0.55, "rgba(255,255,255,0.12)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 128, 128);
    const t = keep(new THREE.CanvasTexture(cv));
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  interface Led {
    mat: ThreeNS.MeshBasicMaterial;
    halo: ThreeNS.SpriteMaterial;
    sprite: ThreeNS.Sprite;
    base: ThreeNS.Color;
    want: ThreeNS.Color;
    glow: number;
  }
  const leds: Led[] = [];
  const led = (parent: ThreeNS.Object3D, w: number, h: number, d: number, at: ThreeNS.Vector3, color: string, haloSize = 0.9) => {
    const mat = keep(new THREE.MeshBasicMaterial({ color, toneMapped: false }));
    const m = new THREE.Mesh(keep(new THREE.BoxGeometry(w, h, d)), mat);
    m.position.copy(at);
    parent.add(m);
    const halo = keep(
      new THREE.SpriteMaterial({ map: haloTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, opacity: 0.55 }),
    );
    const sprite = new THREE.Sprite(halo);
    sprite.position.copy(at);
    sprite.scale.setScalar(haloSize);
    parent.add(sprite);
    const l: Led = { mat, halo, sprite, base: new THREE.Color(color), want: new THREE.Color(color), glow: 1 };
    leds.push(l);
    return l;
  };

  const world = new THREE.Group();
  scene.add(world);

  /* ---- floor: a drafting grid that fades into the page, no horizon -------- */
  {
    const S = 2048;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S;
    const g = cv.getContext("2d")!;
    const units = 80;
    const px = S / units;
    for (let i = 0; i <= units; i++) {
      const major = i % 5 === 0;
      g.strokeStyle = major ? "rgba(236,231,222,0.16)" : "rgba(236,231,222,0.07)";
      g.lineWidth = major ? 2 : 1;
      g.beginPath();
      g.moveTo(i * px, 0);
      g.lineTo(i * px, S);
      g.stroke();
      g.beginPath();
      g.moveTo(0, i * px);
      g.lineTo(S, i * px);
      g.stroke();
    }
    // fade to nothing toward the edges: the grid has no end you can see
    g.globalCompositeOperation = "destination-in";
    const fade = g.createRadialGradient(S / 2, S / 2, S * 0.05, S / 2, S / 2, S * 0.36);
    fade.addColorStop(0, "rgba(0,0,0,1)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = fade;
    g.fillRect(0, 0, S, S);
    const tex = keep(new THREE.CanvasTexture(cv));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const floor = new THREE.Mesh(
      keep(new THREE.PlaneGeometry(units, units)),
      keep(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.9 })),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0.5, 0, 0);
    world.add(floor);
  }

  /* ---- light pools: warm under the traffic, cool under the data ---------- */
  {
    const pool = (color: string, x: number, z: number, r: number, opacity: number) => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 256;
      const g = cv.getContext("2d")!;
      const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
      rg.addColorStop(0, "rgba(255,255,255,1)");
      rg.addColorStop(0.35, "rgba(255,255,255,0.35)");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, 256, 256);
      const tex = keep(new THREE.CanvasTexture(cv));
      tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(
        keep(new THREE.PlaneGeometry(r * 2, r * 2)),
        keep(new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })),
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.01, z);
      world.add(m);
    };
    pool(C.copper, 1.5, 0, 9, 0.16);
    pool("#9db7c8", 1.2, -6.6, 5, 0.1);
    pool(C.copper, 1.2, 6.8, 4.5, 0.12);
  }

  /* ---- the machines ------------------------------------------------------- */
  const gate = new THREE.Mesh(slabGeo(1.2, 0.9, 5.4), steel);
  gate.position.set(GATE_X, 0.47, 0);
  world.add(gate);
  const gateLed = led(world, 0.06, 0.03, 4.6, V(GATE_X + 0.42, 0.93, 0), C.ok, 0.6);

  const apiLeds: Led[] = [];
  for (const z of API_Z) {
    const blade = new THREE.Mesh(slabGeo(1.7, 2.4, 0.42), steel);
    blade.position.set(API_X, 1.22, z);
    world.add(blade);
    // drive bays: a few grooves on the face that catches the key light
    for (let i = 0; i < 5; i++) {
      const groove = new THREE.Mesh(keep(new THREE.BoxGeometry(1.25, 0.025, 0.02)), darkSteel);
      groove.position.set(API_X, 0.55 + i * 0.32, z + 0.215);
      world.add(groove);
    }
    apiLeds.push(led(world, 1.15, 0.03, 0.06, V(API_X, 2.44, z + 0.1), C.ok, 0.7));
  }

  // the queue: a channel packets wait in, head toward the workers
  {
    const len = Q_HEAD - Q_TAIL + 0.8;
    const cx = (Q_HEAD + Q_TAIL) / 2;
    for (const z of [-0.46, 0.46]) {
      const rail = new THREE.Mesh(slabGeo(len, 0.16, 0.1, 0.04), steel);
      rail.position.set(cx, 0.1, z);
      world.add(rail);
    }
    const bed = new THREE.Mesh(keep(new THREE.BoxGeometry(len, 0.02, 0.82)), darkSteel);
    bed.position.set(cx, 0.02, 0);
    world.add(bed);
    for (const z of [-0.42, 0.42]) {
      const post = new THREE.Mesh(slabGeo(0.14, 1.1, 0.14, 0.04), steel);
      post.position.set(Q_HEAD + 0.5, 0.55, z);
      world.add(post);
    }
    const bar = new THREE.Mesh(slabGeo(0.14, 0.12, 1.0, 0.04), steel);
    bar.position.set(Q_HEAD + 0.5, 1.1, 0);
    world.add(bar);
  }
  const queueLed = led(world, 0.08, 0.04, 0.6, V(Q_HEAD + 0.5, 1.19, 0), C.copper, 0.8);

  const workerLeds: Led[] = [];
  for (const z of WORKER_Z) {
    const w = new THREE.Mesh(slabGeo(1.1, 1.1, 1.1), steel);
    w.position.set(WORKER_X, 0.56, z);
    world.add(w);
    workerLeds.push(led(world, 0.7, 0.03, 0.06, V(WORKER_X, 1.12, z + 0.3), C.ok, 0.6));
  }

  const adapter = new THREE.Mesh(slabGeo(0.24, 1.9, 4.4), steel);
  adapter.position.set(ADAPTER_X, 0.96, 0);
  world.add(adapter);
  led(world, 0.06, 0.03, 3.8, V(ADAPTER_X, 1.92, 0), C.copper, 0.5);

  const provLeds: Led[] = [];
  for (const z of PROV_Z) {
    const p = new THREE.Mesh(slabGeo(1.0, 1.4, 1.0), darkSteel);
    p.position.set(PROV_X, 0.71, z);
    world.add(p);
    provLeds.push(led(world, 0.6, 0.03, 0.06, V(PROV_X, 1.42, z + 0.3), C.bone, 0.5));
  }

  const dlq = new THREE.Mesh(slabGeo(0.9, 0.36, 0.7), darkSteel);
  dlq.position.set(DLQ.x, 0.19, DLQ.z);
  world.add(dlq);

  // Redis: four pucks, a status ring each, and the primary's copper crown
  const redisLeds: Led[] = [];
  const redisMeshes: ThreeNS.Mesh[] = [];
  for (const x of REDIS_X) {
    const m = new THREE.Mesh(puckGeo(0.62, 1.3), keep(steel.clone()));
    m.position.set(x, 0.66, REDIS_Z);
    world.add(m);
    redisMeshes.push(m);
    const ringMat = keep(new THREE.MeshBasicMaterial({ color: C.ok, toneMapped: false }));
    const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(0.6, 0.022, 10, 80)), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 1.3, REDIS_Z);
    world.add(ring);
    const halo = keep(
      new THREE.SpriteMaterial({ map: haloTex, color: C.ok, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, opacity: 0.4 }),
    );
    const sprite = new THREE.Sprite(halo);
    sprite.position.set(x, 1.32, REDIS_Z);
    sprite.scale.setScalar(1.7);
    world.add(sprite);
    redisLeds.push({ mat: ringMat, halo, sprite, base: new THREE.Color(C.ok), want: new THREE.Color(C.ok), glow: 1 });
  }
  const crownMat = keep(new THREE.MeshBasicMaterial({ color: C.copper, toneMapped: false }));
  const crown = new THREE.Mesh(keep(new THREE.TorusGeometry(0.82, 0.03, 10, 96)), crownMat);
  crown.rotation.x = Math.PI / 2;
  crown.position.set(REDIS_X[0], 2.0, REDIS_Z);
  world.add(crown);
  const crownHalo = new THREE.Sprite(
    keep(new THREE.SpriteMaterial({ map: haloTex, color: C.copper, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, opacity: 0.35 })),
  );
  crownHalo.scale.setScalar(2.4);
  world.add(crownHalo);

  // Sentinels: three watchers above and behind
  const sentinelLeds: Led[] = [];
  for (const x of SENT_X) {
    const s = new THREE.Mesh(keep(new THREE.OctahedronGeometry(0.26, 0)), steel);
    s.position.set(x, 3.3, REDIS_Z - 1.5);
    world.add(s);
    sentinelLeds.push(led(world, 0.09, 0.09, 0.09, V(x, 3.3, REDIS_Z - 1.18), C.bone, 0.9));
  }

  // Postgres: three discs, one per tenant, each with its own band
  const tenantColor = [new THREE.Color(C.tenantA), new THREE.Color(C.tenantB), new THREE.Color(C.tenantC)];
  const pgLeds: Led[] = [];
  PG_Y.forEach((y, i) => {
    const m = new THREE.Mesh(puckGeo(1.25, 0.86), steel);
    m.position.set(PG.x, y, PG.z);
    world.add(m);
    const bandMat = keep(new THREE.MeshBasicMaterial({ color: tenantColor[i].clone(), toneMapped: false }));
    const band = new THREE.Mesh(keep(new THREE.TorusGeometry(1.255, 0.026, 10, 120)), bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(PG.x, y + 0.3, PG.z);
    world.add(band);
    const halo = keep(
      new THREE.SpriteMaterial({ map: haloTex, color: tenantColor[i].clone(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, opacity: 0.25 }),
    );
    const sprite = new THREE.Sprite(halo);
    sprite.position.set(PG.x + 1.1, y + 0.3, PG.z + 0.6);
    sprite.scale.setScalar(1.2);
    world.add(sprite);
    pgLeds.push({ mat: bandMat, halo, sprite, base: tenantColor[i].clone(), want: tenantColor[i].clone(), glow: 0.4 });
  });

  const allLeds = leds.concat(redisLeds, pgLeds);

  /* ---- routes: the curves packets travel, and the faint fibres along them -- */
  const fibreMat = keep(new THREE.LineBasicMaterial({ color: C.bone, transparent: true, opacity: 0.13, depthWrite: false }));
  const fibre = (curve: ThreeNS.Curve<ThreeNS.Vector3>, n = 32, mat: ThreeNS.Material = fibreMat) => {
    const geo = keep(new THREE.BufferGeometry().setFromPoints(curve.getPoints(n)));
    const line = new THREE.Line(geo, mat);
    world.add(line);
    return line;
  };
  const bez = (a: ThreeNS.Vector3, c: ThreeNS.Vector3, b: ThreeNS.Vector3) => new THREE.QuadraticBezierCurve3(a, c, b);

  const qTail = V(Q_TAIL, 0.3, 0);
  const qHead = V(Q_HEAD, 0.3, 0);
  const lbCurves = API_Z.map((z) => bez(V(GATE_X + 0.65, 0.6, 0), V(GATE_X + 2.4, 0.7, z * 0.9), V(API_X - 0.9, 1.0, z)));
  const toQCurves = API_Z.map((z) => bez(V(API_X + 0.9, 1.0, z), V(API_X + 3.2, 0.6, z * 0.35), qTail));
  const toWCurves = WORKER_Z.map((z) => bez(qHead, V(Q_HEAD + 1.4, 0.5, z * 0.6), V(WORKER_X - 0.6, 0.6, z)));
  const toPCurves = WORKER_Z.map((wz) =>
    PROV_Z.map((pz) => new THREE.CatmullRomCurve3([V(WORKER_X + 0.6, 0.65, wz), V(ADAPTER_X, 1.0, (wz + pz) * 0.3), V(PROV_X - 0.55, 0.75, pz)])),
  );
  const retryCurves = PROV_Z.map(
    (z) => new THREE.CatmullRomCurve3([V(PROV_X - 0.5, 1.0, z), V(9, 3.4, z * 0.5), V(3, 3.8, -0.4), V(Q_TAIL - 0.4, 1.6, -0.2), qTail]),
  );
  const dlqCurves = PROV_Z.map((z) => new THREE.CatmullRomCurve3([V(PROV_X - 0.5, 1.0, z), V(8, 2.4, 1.6), V(DLQ.x + 0.3, 1.2, DLQ.z), V(DLQ.x, 0.32, DLQ.z)]));
  const redisCurve = (api: number, r: number) =>
    bez(V(API_X + 0.3, 2.45, API_Z[api]), V((API_X + REDIS_X[r]) / 2, 3.6, (API_Z[api] + REDIS_Z) / 2), V(REDIS_X[r], 1.4, REDIS_Z + 0.2));
  const dbCurve = (api: number, tenant: number) =>
    bez(V(API_X + 0.3, 1.6, API_Z[api]), V((API_X + PG.x) / 2, PG_Y[tenant] + 2.2, (API_Z[api] + PG.z) / 2), V(PG.x - 1.1, PG_Y[tenant] + 0.1, PG.z - 0.4));
  const inCurve = () => {
    const z = (Math.random() - 0.5) * 9;
    return new THREE.LineCurve3(V(GATE_X - 7, 0.6, z), V(GATE_X - 0.65, 0.6, THREE.MathUtils.clamp(z, -2.4, 2.4)));
  };

  lbCurves.forEach((c) => fibre(c));
  toQCurves.forEach((c) => fibre(c));
  toWCurves.forEach((c) => fibre(c));
  toPCurves.flat().forEach((c) => fibre(c));
  for (let a = 0; a < 4; a++) for (let t = 0; t < 3; t++) if ((a + t) % 2 === 0) fibre(dbCurve(a, t));
  fibre(new THREE.LineCurve3(V(GATE_X - 9, 0.6, 0), V(GATE_X - 0.65, 0.6, 0)), 2);

  // API → current primary: rebuilt when a replica is promoted
  const primaryLines = API_Z.map((_, a) => fibre(redisCurve(a, 0)));
  const setPrimaryLines = (r: number) => {
    primaryLines.forEach((line, a) => {
      line.geometry.setFromPoints(redisCurve(a, r).getPoints(32));
      line.geometry.attributes.position.needsUpdate = true;
    });
  };

  // Replication: primary → replicas, and sentinels watching every node
  const replMat = keep(new THREE.LineDashedMaterial({ color: C.copper, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.45 }));
  const replGeo = keep(new THREE.BufferGeometry());
  replGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 2 * 3), 3));
  const repl = new THREE.LineSegments(replGeo, replMat);
  world.add(repl);
  const watchMat = keep(new THREE.LineDashedMaterial({ color: C.bone, dashSize: 0.06, gapSize: 0.12, transparent: true, opacity: 0.18 }));
  {
    const pts: ThreeNS.Vector3[] = [];
    for (const sx of SENT_X) for (const rx of REDIS_X) pts.push(V(sx, 3.15, REDIS_Z - 1.4), V(rx, 1.35, REDIS_Z));
    const watch = new THREE.LineSegments(keep(new THREE.BufferGeometry().setFromPoints(pts)), watchMat);
    watch.computeLineDistances();
    world.add(watch);
  }

  /* ---- packets ------------------------------------------------------------- */
  const N = opts.packets;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const alp = new Float32Array(N);
  const siz = new Float32Array(N);
  const geo = keep(new THREE.BufferGeometry());
  const attr = (a: Float32Array, n: number) => {
    const b = new THREE.BufferAttribute(a, n);
    b.setUsage(THREE.DynamicDrawUsage);
    return b;
  };
  geo.setAttribute("position", attr(pos, 3));
  geo.setAttribute("aColor", attr(col, 3));
  geo.setAttribute("aAlpha", attr(alp, 1));
  geo.setAttribute("aSize", attr(siz, 1));
  const packetMat = keep(
    new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute vec3 aColor; attribute float aAlpha; attribute float aSize;
        uniform float uScale;
        varying vec3 vColor; varying float vAlpha;
        void main() {
          vColor = aColor; vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          // world-size points: px = size * viewportHeightPx / (2 tan(fov/2) depth)
          gl_PointSize = aAlpha > 0.0 ? aSize * uScale / -mv.z : 0.0;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor; varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c) * 2.0;
          if (d > 1.0) discard;
          float core = smoothstep(0.42, 0.0, d);
          float glow = pow(1.0 - d, 3.0) * 0.55;
          vec3 col = mix(vColor, vec3(1.0), core * 0.55);
          gl_FragColor = vec4(col, (core + glow) * vAlpha);
          #include <colorspace_fragment>
        }`,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
    }),
  );
  const points = new THREE.Points(geo, packetMat);
  points.frustumCulled = false;
  world.add(points);

  const packets: Packet[] = Array.from({ length: N }, () => ({
    stage: "dead" as Stage, curve: null, len: 1, t: 0, speed: 0, timer: 0, api: 0, worker: 0, prov: 0, route: 0, target: 0,
    tenant: 0, attempts: 0, jx: 0, jy: 0, jz: 0, tone: 0, x: 0, y: -50, z: 0, alpha: 0, size: 0.09,
  }));
  const free: number[] = [];
  for (let i = N - 1; i >= 0; i--) free.push(i);
  const queue: number[] = [];
  const held: number[] = []; // back-pressure: waiting at the API instances
  const heldR: number[] = []; // waiting for a primary during failover
  const workerLoad = [0, 0];
  let inflightToQ = 0;
  let rr = 0;

  const go = (p: Packet, stage: Stage, curve: ThreeNS.Curve<ThreeNS.Vector3>, speed: number) => {
    p.stage = stage;
    p.curve = curve;
    p.len = Math.max(0.1, curve.getLength());
    p.t = 0;
    p.speed = speed;
  };
  const jitter = (p: Packet, s: number) => {
    p.jx = (Math.random() - 0.5) * s;
    p.jy = (Math.random() - 0.5) * s * 0.5;
    p.jz = (Math.random() - 0.5) * s;
  };

  const spawn = (weights: [number, number, number]) => {
    const i = free.pop();
    if (i === undefined) return;
    const p = packets[i];
    const roll = Math.random() * (weights[0] + weights[1] + weights[2]);
    p.route = roll < weights[0] ? 0 : roll < weights[0] + weights[1] ? 1 : 2;
    p.tenant = Math.floor(Math.random() * 3);
    p.attempts = 0;
    p.tone = 0;
    p.alpha = 0;
    p.size = 0.15 + Math.random() * 0.07;
    p.api = rr++ % 4;
    jitter(p, 0.12);
    go(p, "in", inCurve(), 7 + Math.random() * 2);
  };

  /* ---- failover: Sentinel, scripted from what it really prints ------------- */
  let primary = 0;
  let downNode = -1;
  let candidate = -1;
  let fo = -1; // seconds since the kill, -1 when healthy
  let foStep = 0;
  const redisName = (r: number) => `redis-${r + 1}`;
  const steps: { at: number; run: () => void }[] = [
    { at: 0, run: () => opts.events.onLine({ ms: 0, text: `+sdown master ${redisName(downNode)}`, tone: "fail" }) },
    { at: 0.41, run: () => opts.events.onLine({ ms: 410, text: `+odown master ${redisName(downNode)} #quorum 3/2`, tone: "fail" }) },
    { at: 0.62, run: () => opts.events.onLine({ ms: 620, text: `+try-failover master ${redisName(downNode)}` }) },
    { at: 0.81, run: () => opts.events.onLine({ ms: 810, text: "+elected-leader sentinel-2", tone: "copper" }) },
    {
      at: 1.02,
      run: () => {
        candidate = (downNode + 1) % 4;
        opts.events.onLine({ ms: 1020, text: `+selected-slave ${redisName(candidate)}` });
      },
    },
    { at: 1.64, run: () => opts.events.onLine({ ms: 1640, text: `+promoted-slave ${redisName(candidate)}`, tone: "copper" }) },
    {
      at: 1.7,
      run: () => {
        primary = candidate;
        candidate = -1;
        setPrimaryLines(primary);
        opts.events.onLine({ ms: 1700, text: `+switch-master ${redisName(downNode)} → ${redisName(primary)}`, tone: "ok" });
        // everything that waited for a primary goes now
        while (heldR.length) {
          const p = packets[heldR.shift()!];
          p.target = primary;
          go(p, "toR", redisCurve(p.api, primary), 5.5 + Math.random() * 1.5);
        }
      },
    },
    {
      at: 4.8,
      run: () => {
        opts.events.onLine({ ms: 4800, text: `-sdown slave ${redisName(downNode)} · back as a replica`, tone: "ok" });
        downNode = -1;
        fo = -1;
        opts.events.onBusy(false, primary);
      },
    },
  ];
  const kill = () => {
    if (fo >= 0) return;
    downNode = primary;
    fo = 0;
    foStep = 0;
    opts.events.onBusy(true, primary);
  };

  /* ---- labels: where the page should pin a name, if it wants to ----------- */
  const L = (id: string, text: string, at: ThreeNS.Vector3, show: number[]) => ({ id, text, at, show, tone: "" as Anchor["tone"] });
  const labelDefs = [
    L("clients", "clients", V(GATE_X - 6.5, 0.9, 3.4), [0]),
    L("gateway", "gateway · load balancer", V(GATE_X, 1.25, 2.9), [-1, 0]),
    ...API_Z.map((z, i) => L(`api-${i}`, `api-${i + 1}`, V(API_X, 2.85, z), [0])),
    L("queue", "queue · bullmq", V((Q_TAIL + Q_HEAD) / 2, 0.75, -0.9), [-1, 1]),
    ...WORKER_Z.map((z, i) => L(`worker-${i}`, `worker-${i + 1} · ×${WORKER_CONCURRENCY}`, V(WORKER_X, 1.5, z), [1])),
    L("adapter", "provider adapter", V(ADAPTER_X, 2.3, -1.6), [1]),
    ...PROV_Z.map((z, i) => L(`prov-${i}`, `otp provider ${"abc"[i]}`, V(PROV_X, 1.85, z), [1])),
    L("dlq", "dead-letter", V(DLQ.x, 0.7, DLQ.z + 0.6), [1]),
    L("redis-all", "redis × 4 · sentinel", V(1.1, 2.6, REDIS_Z), [-1]),
    ...REDIS_X.map((x, i) => L(`redis-${i}`, "", V(x, 2.55, REDIS_Z + 0.3), [2])),
    L("sentinels", "sentinel × 3", V(SENT_X[1], 4.0, REDIS_Z - 1.5), [2]),
    L("pg", "postgres", V(PG.x, 3.35, PG.z), [-1]),
    ...PG_Y.map((y, i) => L(`tenant-${i}`, `tenant ${"abc"[i]}`, V(PG.x + 1.55, y + 0.3, PG.z + 0.4), [3])),
  ];
  const anchors: Anchor[] = labelDefs.map((d) => ({ id: d.id, text: d.text, tone: "", x: 0, y: 0, show: false }));
  const proj = new THREE.Vector3();

  /* ---- the camera, eased toward where the page wants it ------------------- */
  const cam = { px: -4, py: 10, pz: 20, lx: 0, ly: 0, lz: 0, offX: 0, offY: 0 };
  let w = 1;
  let h = 1;
  let first = true;
  const look = new THREE.Vector3();
  let spawnCarry = 0;
  let answered = 0;
  const tmpC = new THREE.Color();
  const okC = new THREE.Color(C.ok);
  const failC = new THREE.Color(C.fail);
  const amberC = new THREE.Color(C.amber);
  const copperC = new THREE.Color(C.copper);
  const boneC = new THREE.Color(C.bone);
  const sample = new THREE.Vector3();

  const api: ClusterScene = {
    anchors,
    kill,

    resize(nw, nh) {
      w = nw;
      h = nh;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      packetMat.uniforms.uScale.value = (h * opts.pixelRatio) / (2 * tanHalf);
    },

    frame(dt, t, input) {
      const D = THREE.MathUtils.damp;
      const k = first ? 1 : 0;
      first = false;
      for (const key of ["px", "py", "pz", "lx", "ly", "lz"] as const) cam[key] = k ? input[key] : D(cam[key], input[key], 2.6, dt);
      cam.offX = k ? input.offX : D(cam.offX, input.offX, 3, dt);
      cam.offY = k ? input.offY : D(cam.offY, input.offY, 3, dt);
      // a slow breath, so a held pose is never a still
      camera.position.set(cam.px + Math.sin(t * 0.13) * 0.35, cam.py + Math.sin(t * 0.21) * 0.15, cam.pz + Math.cos(t * 0.11) * 0.3);
      look.set(cam.lx, cam.ly, cam.lz);
      camera.lookAt(look);
      camera.setViewOffset(w, h, -cam.offX * w, cam.offY * h, w, h);

      const finale = input.finale;
      const tenancy = input.tenancy;
      answered = finale;

      /* -- failover script -- */
      if (fo >= 0) {
        fo += dt;
        while (foStep < steps.length && fo >= steps[foStep].at) steps[foStep++].run();
      }

      /* -- traffic -- */
      const ch = Math.round(input.chapter);
      const weights: [number, number, number] =
        ch === 1 ? [0.8, 0.1, 0.1] : ch === 2 ? [0.32, 0.58, 0.1] : ch === 3 ? [0.18, 0.12, 0.7] : [0.55, 0.25, 0.2];
      const rate = 6 + Math.min(input.traffic, 48);
      spawnCarry += rate * dt;
      while (spawnCarry >= 1) {
        spawn(weights);
        spawnCarry -= 1;
      }

      // workers pull from the head of the queue
      for (let wk = 0; wk < 2; wk++) {
        while (workerLoad[wk] < WORKER_CONCURRENCY && queue.length) {
          const p = packets[queue.shift()!];
          workerLoad[wk]++;
          p.worker = wk;
          go(p, "toW", toWCurves[wk], 5);
        }
      }
      // back-pressure: a held packet enters only when the queue has room
      while (held.length && queue.length + inflightToQ < Q_SLOTS) {
        const p = packets[held.shift()!];
        inflightToQ++;
        go(p, "toQ", toQCurves[p.api], 5.5);
      }

      /* -- move every packet -- */
      for (let i = 0; i < N; i++) {
        const p = packets[i];
        if (p.stage === "dead") {
          alp[i] = 0;
          continue;
        }
        if (p.curve) {
          p.t += (p.speed * dt) / p.len;
          const tt = Math.min(1, p.t);
          p.curve.getPointAt(tt, sample);
          const s = Math.sin(tt * Math.PI);
          p.x = sample.x + p.jx * s;
          p.y = sample.y + p.jy * s;
          p.z = sample.z + p.jz * s;
          if (p.t >= 1) arrive(p, i);
        } else if (p.stage === "queued") {
          const slot = queue.indexOf(i);
          const tx = Q_HEAD - slot * ((Q_HEAD - Q_TAIL) / Q_SLOTS);
          p.x = D(p.x, tx, 6, dt);
          p.y = D(p.y, 0.3, 6, dt);
          p.z = D(p.z, 0, 6, dt);
        } else if (p.stage === "hold") {
          const slot = held.indexOf(i);
          const row = API_Z[p.api];
          p.x = D(p.x, API_X + 1.0 + (slot % 3) * 0.16, 5, dt);
          p.y = D(p.y, 0.4 + Math.floor(slot / 12) * 0.16, 5, dt);
          p.z = D(p.z, row + ((Math.floor(slot / 3) % 4) - 1.5) * 0.14, 5, dt);
        } else if (p.stage === "holdR") {
          const slot = heldR.indexOf(i);
          p.x = D(p.x, API_X + 0.3 + (slot % 4) * 0.14 - 0.2, 5, dt);
          p.y = D(p.y, 2.75 + Math.floor(slot / 4) * 0.14, 5, dt);
          p.z = D(p.z, API_Z[p.api], 5, dt);
        } else {
          p.timer -= dt;
          if (p.timer <= 0) expire(p, i);
        }

        // colour: copper by default, tenants apart in the tenancy chapter
        if (p.tone === 1) tmpC.copy(okC);
        else if (p.tone === 2) tmpC.copy(failC);
        else if (p.tone === 3) tmpC.copy(amberC);
        else tmpC.copy(copperC).lerp(tenantColor[p.tenant], tenancy);
        if (finale > 0 && p.tone !== 2) tmpC.lerp(okC, finale * 0.8);

        // fade in on arrival from the edge, fade out on a flash
        if (p.stage === "flash" || p.stage === "work" || p.stage === "call") {
          const life = Math.max(0, p.timer);
          p.alpha = p.stage === "flash" ? Math.min(1, life * 2.5) : 0.55;
        } else {
          p.alpha = Math.min(1, p.alpha + dt * 3);
        }
        const j = i * 3;
        pos[j] = p.x;
        pos[j + 1] = p.y;
        pos[j + 2] = p.z;
        col[j] = tmpC.r;
        col[j + 1] = tmpC.g;
        col[j + 2] = tmpC.b;
        alp[i] = p.alpha;
        siz[i] = p.stage === "flash" ? p.size * (1 + (0.4 - Math.min(0.4, p.timer)) * 2.5) : p.size;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aColor.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;

      /* -- lights on the machines -- */
      const busyQ = queue.length / Q_SLOTS;
      queueLed.want.copy(copperC).lerp(failC, Math.max(0, busyQ - 0.7) * 2.5);
      queueLed.glow = 0.6 + busyQ;
      apiLeds.forEach((l, a) => {
        const waiting = held.some((x) => packets[x].api === a) || (fo >= 0 && fo < 1.7 && heldR.some((x) => packets[x].api === a));
        l.want.copy(waiting ? amberC : okC);
      });
      gateLed.want.copy(okC);
      workerLeds.forEach((l, wk) => {
        l.want.copy(okC).lerp(copperC, workerLoad[wk] / WORKER_CONCURRENCY);
      });
      provLeds.forEach((l) => l.want.copy(boneC).lerp(okC, finale));
      sentinelLeds.forEach((l, s) => {
        const electing = fo >= 0.41 && fo < 1.7;
        const leader = s === 1 && fo >= 0.81 && fo < 1.7;
        l.want.copy(leader ? copperC : electing ? amberC : boneC);
        l.glow = electing ? 0.8 + 0.6 * Math.abs(Math.sin(t * 9 + s)) : 0.7;
      });
      redisLeds.forEach((l, r) => {
        if (r === downNode) {
          l.want.copy(failC);
          l.glow = 0.6 + 0.4 * Math.abs(Math.sin(t * 6));
        } else if (r === candidate) {
          l.want.copy(copperC);
          l.glow = 0.7 + 0.5 * Math.abs(Math.sin(t * 12));
        } else {
          l.want.copy(okC);
          l.glow = r === primary ? 1.1 : 0.75;
        }
      });
      pgLeds.forEach((l, i) => {
        l.want.copy(tenantColor[i]).lerp(copperC, 1 - tenancy).lerp(okC, finale * 0.8);
        l.glow = 0.35 + tenancy * 0.9;
      });
      for (const l of allLeds) {
        l.mat.color.lerp(l.want, 1 - Math.pow(0.001, dt));
        l.halo.color.copy(l.mat.color);
        l.halo.opacity = 0.45 * l.glow;
      }
      // a dead node goes dark, not just red
      redisMeshes.forEach((m, r) => {
        const mat = m.material as ThreeNS.MeshPhysicalMaterial;
        const lit = D(mat.color.r, r === downNode ? 0.22 : 1, 4, dt);
        mat.color.setRGB(lit, lit, lit);
      });
      // the crown follows the primary
      crown.position.x = D(crown.position.x, REDIS_X[primary], 3.5, dt);
      crown.position.y = 2.0 + Math.sin(t * 1.6) * 0.06 + (fo >= 0 && fo < 1.7 ? 0.5 : 0);
      crown.rotation.z += dt * 0.6;
      crownMat.color.copy(fo >= 0 && fo < 1.7 ? failC : copperC);
      crownHalo.position.copy(crown.position);
      // replication lines from the primary to every live replica
      {
        const a = replGeo.attributes.position as ThreeNS.BufferAttribute;
        let n = 0;
        for (let r = 0; r < 4; r++) {
          if (r === primary) continue;
          const on = r !== downNode && downNode !== primary;
          a.setXYZ(n++, crown.position.x, 1.35, REDIS_Z);
          a.setXYZ(n++, on ? REDIS_X[r] : crown.position.x, 1.35, REDIS_Z);
        }
        a.needsUpdate = true;
        repl.computeLineDistances();
        replMat.opacity = downNode === primary ? 0.1 : 0.45;
      }

      /* -- labels -- */
      for (let n = 0; n < labelDefs.length; n++) {
        const d = labelDefs[n];
        const a = anchors[n];
        if (d.id.startsWith("redis-") && d.id !== "redis-all") {
          const r = Number(d.id.slice(6));
          const role = r === downNode ? "down" : r === candidate ? "promoting…" : r === primary ? "primary" : "replica";
          a.text = `${redisName(r)} · ${role}`;
          a.tone = r === downNode ? "fail" : r === primary ? "copper" : "";
        } else {
          a.text = d.text;
        }
        proj.copy(d.at).project(camera);
        a.x = (proj.x * 0.5 + 0.5) * w;
        a.y = (-proj.y * 0.5 + 0.5) * h;
        a.show = d.show.includes(ch) && proj.z < 1 && a.x > 8 && a.x < w - 8 && a.y > 60 && a.y < h - 8;
      }
    },

    dispose() {
      for (const d of disposables) d.dispose();
      scene.traverse((o) => {
        const m = o as ThreeNS.Mesh;
        m.geometry?.dispose();
      });
    },
  };

  function arrive(p: Packet, i: number) {
    p.curve = null;
    switch (p.stage) {
      case "in":
        go(p, "lb", lbCurves[p.api], 6);
        break;
      case "lb":
        if (p.route === 0) {
          if (queue.length + inflightToQ < Q_SLOTS && held.length === 0) {
            inflightToQ++;
            go(p, "toQ", toQCurves[p.api], 5.5);
          } else {
            p.stage = "hold";
            held.push(i);
          }
        } else if (p.route === 1) {
          if (fo >= 0 && fo < 1.7) {
            p.stage = "holdR";
            heldR.push(i);
          } else {
            p.target = primary;
            go(p, "toR", redisCurve(p.api, primary), 5.5);
          }
        } else {
          go(p, "toDB", dbCurve(p.api, p.tenant), 5.5);
        }
        break;
      case "toQ":
      case "retry":
        if (p.stage === "toQ") inflightToQ--;
        p.stage = "queued";
        queue.push(i);
        p.tone = p.attempts > 0 ? 3 : 0;
        break;
      case "toW":
        p.stage = "work";
        p.timer = 0.18 + Math.random() * 0.15;
        break;
      case "toP":
        p.stage = "call";
        // provider b is the slow one — it is always provider b
        p.timer = p.prov === 1 ? 0.9 + Math.random() * 1.2 : 0.15 + Math.random() * 0.35;
        break;
      case "toR":
        flash(p, p.target === downNode ? 2 : 1);
        break;
      case "toDB":
        flash(p, 0);
        break;
      case "dlq":
        flash(p, 2);
        break;
      default:
        flash(p, 0);
    }
  }

  function expire(p: Packet, i: number) {
    switch (p.stage) {
      case "work":
        p.prov = Math.floor(Math.random() * 3);
        go(p, "toP", toPCurves[p.worker][p.prov], 6);
        break;
      case "call": {
        workerLoad[p.worker] = Math.max(0, workerLoad[p.worker] - 1);
        const r = Math.random();
        if (r < 0.84 || answered > 0.5) flash(p, 1);
        else if (p.attempts < 2) {
          p.attempts++;
          p.tone = 3;
          go(p, "retry", retryCurves[p.prov], 7);
        } else {
          p.tone = 2;
          go(p, "dlq", dlqCurves[p.prov], 5);
        }
        break;
      }
      case "flash":
        p.stage = "dead";
        p.alpha = 0;
        free.push(i);
        break;
    }
  }

  function flash(p: Packet, tone: number) {
    p.stage = "flash";
    p.curve = null;
    p.tone = tone;
    p.timer = 0.4;
  }

  if (process.env.NODE_ENV !== "production") {
    Object.assign(window, { __cluster: { packets, queue, held, heldR, free, workerLoad } });
  }

  return { scene, camera, api };
}
