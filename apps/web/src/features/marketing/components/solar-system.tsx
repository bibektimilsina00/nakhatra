"use client";

/* ══════════════════════════════════════════════════════════════
   Solar system, ported from github.com/N3rson/Solar-System-3D.

   Sizes, orbital radii, axial tilts, rotation rates, ring radii,
   light values and bloom settings are that project's, unchanged.
   Textures are its own, served from jsDelivr. What differs is the
   framing: no GUI, no click-to-zoom, the camera drifts with the
   pointer and the scroll, it can be dragged, and each planet starts
   at its real heliocentric longitude rather than at angle zero.
   ══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";

import type { Body } from "@/features/marketing/ephemeris";
import { SIGN3 } from "@/features/marketing/ephemeris";
import { getSky } from "@/features/marketing/store/sky";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export function SolarSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !chipRef.current || !panelRef.current) return;
    const canvas = canvasRef.current;
    const chip = chipRef.current;
    const pinfo = panelRef.current;

    const cleanup: Array<() => void> = [];
    /* The demo bound straight to window; a component has to be able to
       take those listeners back off again. */
    const on = <K extends keyof WindowEventMap>(
      k: K, fn: (e: WindowEventMap[K]) => void,
    ) => {
      addEventListener(k, fn as EventListener);
      cleanup.push(() => removeEventListener(k, fn as EventListener));
    };
    const timers: number[] = [];
    const every = (fn: () => void, ms: number) => { timers.push(window.setInterval(fn, ms)); };

    // Self-hosted — the same Solar-System-3D texture set the Birth Sky uses,
    // served from public/planets instead of a third-party CDN.
    const IMG = "/planets/";
    const loadTexture = new THREE.TextureLoader();
    const T = (f: string) => loadTexture.load(IMG + f);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(-300, 195, 9);   // the source's angle, pulled back

    /* ── lighting, exactly as the source sets it ─────────────────── */
    scene.add(new THREE.AmbientLight(0x222222, 6));
    scene.add(new THREE.PointLight(0xFDFFD3, 1200, 400, 1.4));

    /* ── the Sun: emissive standard material ─────────────────────── */
    const sunSize = 697 / 40;
    const sunMat = new THREE.MeshStandardMaterial({
      emissive: 0xFFF88F,
      emissiveMap: T("sun.jpg"),
      emissiveIntensity: 1.9,
    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(sunSize, 32, 20), sunMat);
    scene.add(sun);

    /* ── Earth's day/night terminator shader ─────────────────────── */
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture:   { value: T("earth_daymap.jpg") },
        nightTexture: { value: T("earth_nightmap.jpg") },
        sunPosition:  { value: sun.position },
      },
      vertexShader: `
        varying vec3 vNormal; varying vec2 vUv; varying vec3 vSunDirection;
        uniform vec3 sunPosition;
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
          vSunDirection = normalize(sunPosition - worldPosition.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D dayTexture; uniform sampler2D nightTexture;
        varying vec3 vNormal; varying vec2 vUv; varying vec3 vSunDirection;
        void main() {
          float intensity = max(dot(vNormal, vSunDirection), 0.0);
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv) * 0.2;
          gl_FragColor = mix(nightColor, dayColor, intensity);
        }`,
    });

    /* ── the source's createPlanet, kept intact ──────────────────── */
    type Ring = { innerRadius: number; outerRadius: number; texture: string };
    function createPlanet(
      name: string, size: number, position: number, tilt: number,
      texture: string | THREE.Material, bump?: string | null,
      ring?: Ring | null, atmosphere?: string | null,
    ) {
      let material;
      if (texture instanceof THREE.Material)  material = texture;
      else if (bump) material = new THREE.MeshPhongMaterial({ map: T(texture as string), bumpMap: T(bump), bumpScale: 0.7 });
      else           material = new THREE.MeshPhongMaterial({ map: T(texture as string) });

      const planet = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 20), material);
      const planet3d = new THREE.Object3D();
      const planetSystem = new THREE.Group();
      planetSystem.add(planet);
      planet.position.x = position;
      planet.rotation.z = tilt * Math.PI / 180;

      const path = new THREE.EllipseCurve(0, 0, position, position, 0, 2 * Math.PI, false, 0);
      const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(path.getPoints(100)),
        new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.03 })
      );
      orbit.rotation.x = Math.PI / 2;
      planetSystem.add(orbit);

      let Ring, Atmosphere;
      if (ring) {
        Ring = new THREE.Mesh(
          new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 30),
          new THREE.MeshStandardMaterial({ map: T(ring.texture), side: THREE.DoubleSide })
        );
        planetSystem.add(Ring);
        Ring.position.x = position;
        Ring.rotation.x = -0.5 * Math.PI;
        Ring.rotation.y = -tilt * Math.PI / 180;
      }
      if (atmosphere) {
        Atmosphere = new THREE.Mesh(
          new THREE.SphereGeometry(size + 0.1, 32, 20),
          new THREE.MeshPhongMaterial({ map: T(atmosphere), transparent: true, opacity: 0.4, depthTest: true, depthWrite: false })
        );
        Atmosphere.rotation.z = 0.41;
        planet.add(Atmosphere);
      }

      planet3d.add(planetSystem);
      scene.add(planet3d);
      return { planet, planet3d, Atmosphere, Ring };
    }

    const mercury = createPlanet("Mercury", 2.4,    40, 0,  "mercurymap.jpg", "mercurybump.jpg");
    const venus   = createPlanet("Venus",   6.1,    65, 3,  "venusmap.jpg",   "venusbump.jpg", null, "venus_atmosphere.jpg");
    const earth   = createPlanet("Earth",   6.4,    90, 23, earthMaterial,    null,            null, "earth_atmosphere.jpg");
    const mars    = createPlanet("Mars",    3.4,   115, 25, "marsmap.jpg",    "marsbump.jpg");
    const jupiter = createPlanet("Jupiter", 69/4,  200, 3,  "jupiter.jpg");
    const saturn  = createPlanet("Saturn",  58/4,  270, 26, "saturnmap.jpg",  null, { innerRadius: 18, outerRadius: 29, texture: "saturn_ring.png" });
    const uranus  = createPlanet("Uranus",  25/4,  320, 82, "uranus.jpg",     null, { innerRadius: 6,  outerRadius: 8,  texture: "uranus_ring.png" });
    const neptune = createPlanet("Neptune", 24/4,  340, 28, "neptune.jpg");
    const pluto   = createPlanet("Pluto",   1,     350, 57, "plutomap.jpg");

    /* ── where each planet actually is, right now ────────────────────
       The source starts every planet at angle 0, so on load they sit in a
       single straight line — the one arrangement the solar system is never
       in. Seeding each orbit from its real heliocentric mean longitude
       costs one number per planet and scatters them correctly.

       L0 and the per-century rate are JPL's 1800–2050 elements (the same
       table the kundali charts use). Mean longitude only — no Kepler solve,
       because a start angle a degree or two out is invisible here. */
    const MEAN_LON: Record<string, [number, number]> = {
      mercury: [252.25032350, 149472.67411175],
      venus:   [181.97909950,  58517.81538729],
      earth:   [100.46457166,  35999.37244981],
      mars:    [ -4.55343205,  19140.30268499],
      jupiter: [ 34.39644051,   3034.74612775],
      saturn:  [ 49.95424423,   1222.49362201],
      uranus:  [313.23810451,    428.48202785],
      neptune: [-55.12002969,    218.45945325],
      pluto:   [238.93000000,    144.96000000],  // not in JPL's table; period 248 y
    };

    {
      const T = (Date.now() / 86400000 + 2440587.5 - 2451545) / 36525;
      const at = ({ planet3d }: { planet3d: THREE.Object3D }, key: keyof typeof MEAN_LON) => {
        const [L0, rate] = MEAN_LON[key];
        // Negated: rotateY carries +X toward -Z, while ecliptic longitude
        // increases the other way seen from north.
        planet3d.rotation.y = -((L0 + rate * T) % 360) * Math.PI / 180;
      };
      at(mercury, "mercury"); at(venus, "venus");   at(earth, "earth");
      at(mars,    "mars");    at(jupiter, "jupiter"); at(saturn, "saturn");
      at(uranus,  "uranus");  at(neptune, "neptune"); at(pluto, "pluto");
    }

    /* ── star background: the source's cube map ──────────────────── */
    scene.background = new THREE.CubeTextureLoader().setPath(IMG)
      .load(["3.jpg", "1.jpg", "2.jpg", "2.jpg", "4.jpg", "2.jpg"]);

    /* ── constellations, drawn faint ──────────────────────────────────
       Not decoration picked for looking pretty: every one of these carries a
       nakshatra. Krittika is the Pleiades, Rohini is Aldebaran, Mrigashira
       and Ardra are Orion's head and Betelgeuse, Magha is Regulus, Jyeshtha
       is Antares, and the Saptarishi are the seven rishis themselves.

       Positions are real J2000 right ascension and declination, in degrees.
       They are meant to be found, not noticed — the lines sit near the floor
       of what a screen can show and breathe slowly in and out of it. */
    const SKY_R = 560;                         // inside the 1000 far plane
    const OBLIQ = 23.4392911 * Math.PI / 180;

    function starVec(ra: number, dec: number) {
      const a = ra * Math.PI / 180, d = dec * Math.PI / 180;
      const X = Math.cos(d) * Math.cos(a), Y = Math.cos(d) * Math.sin(a), Z = Math.sin(d);
      // equatorial -> ecliptic, then into the scene's axes (XZ is the
      // ecliptic plane, +Y is ecliptic north).
      return new THREE.Vector3(
        X,
        -Y * Math.sin(OBLIQ) + Z * Math.cos(OBLIQ),
         Y * Math.cos(OBLIQ) + Z * Math.sin(OBLIQ),
      ).multiplyScalar(SKY_R);
    }

    type Constellation = {
      name: string; stars: Record<string, [number, number]>;
      lines: [string, string][]; bright: string[];
    };
    const CONSTELLATIONS: Constellation[] = [
      { name: "Saptarishi",                       // Ursa Major — the seven rishis
        stars: { Kratu:[165.93,61.75], Pulaha:[165.46,56.38], Pulastya:[178.46,53.69],
                 Atri:[183.86,57.03], Angiras:[193.51,55.96], Vasishtha:[200.98,54.93],
                 Marichi:[206.89,49.31] },
        lines: [["Kratu","Pulaha"],["Pulaha","Pulastya"],["Pulastya","Atri"],["Atri","Kratu"],
                ["Atri","Angiras"],["Angiras","Vasishtha"],["Vasishtha","Marichi"]],
        bright: ["Vasishtha"] },

      { name: "Mrigashira",                       // Orion — the deer's head
        stars: { Betelgeuse:[88.79,7.41], Bellatrix:[81.28,6.35], Alnitak:[85.19,-1.94],
                 Alnilam:[84.05,-1.20], Mintaka:[83.00,-0.30], Saiph:[86.94,-9.67],
                 Rigel:[78.63,-8.20], Meissa:[83.78,9.93] },
        lines: [["Betelgeuse","Bellatrix"],["Bellatrix","Mintaka"],["Mintaka","Alnilam"],
                ["Alnilam","Alnitak"],["Alnitak","Betelgeuse"],["Alnitak","Saiph"],
                ["Mintaka","Rigel"],["Saiph","Rigel"],["Betelgeuse","Meissa"],
                ["Bellatrix","Meissa"]],
        bright: ["Betelgeuse","Rigel","Meissa"] },

      { name: "Jyeshtha",                         // Scorpius — Antares at its heart
        stars: { Antares:[247.35,-26.43], beta:[241.36,-19.80], delta:[240.08,-22.62],
                 pi:[239.71,-26.11], sigma:[245.30,-25.59], tau:[248.97,-28.22],
                 eps:[252.54,-34.29], mu:[252.97,-38.05], zeta:[253.65,-42.36],
                 eta:[258.04,-43.24], theta:[264.33,-43.00], iota:[266.90,-40.13],
                 kappa:[265.62,-39.03], Shaula:[263.40,-37.10], ups:[262.69,-37.30] },
        lines: [["pi","delta"],["delta","beta"],["delta","sigma"],["sigma","Antares"],
                ["Antares","tau"],["tau","eps"],["eps","mu"],["mu","zeta"],["zeta","eta"],
                ["eta","theta"],["theta","iota"],["iota","kappa"],["kappa","Shaula"],
                ["Shaula","ups"]],
        bright: ["Antares","Shaula"] },

      { name: "Krittika",                         // Taurus — Pleiades and Rohini
        stars: { Rohini:[68.98,16.51], Krittika:[56.87,24.10], Elnath:[81.57,28.61],
                 zeta:[84.41,21.14], theta:[67.17,15.87], eps:[67.15,19.18],
                 gamma:[64.95,15.63], delta:[65.73,17.54] },
        lines: [["gamma","delta"],["delta","eps"],["eps","Rohini"],["gamma","theta"],
                ["theta","Rohini"],["Rohini","zeta"],["eps","Elnath"],["delta","Krittika"]],
        bright: ["Rohini","Krittika"] },

      { name: "Magha",                            // Leo — Regulus, the seat of kings
        stars: { Regulus:[152.09,11.97], Denebola:[177.27,14.57], Algieba:[154.99,19.84],
                 Zosma:[168.53,20.52], theta:[168.56,15.43], eps:[146.46,23.77],
                 eta:[151.83,16.76], mu:[148.19,26.01], zeta:[154.17,23.42] },
        lines: [["eps","mu"],["mu","zeta"],["zeta","Algieba"],["Algieba","eta"],
                ["eta","Regulus"],["Regulus","theta"],["theta","Zosma"],["Zosma","Algieba"],
                ["theta","Denebola"],["Zosma","Denebola"]],
        bright: ["Regulus","Denebola"] },
    ];

    const constLines: THREE.LineSegments[] = [];
    for (const c of CONSTELLATIONS) {
      const pts: THREE.Vector3[] = [], dim: THREE.Vector3[] = [], lit: THREE.Vector3[] = [];
      for (const [a, b] of c.lines) {
        pts.push(starVec(...c.stars[a]), starVec(...c.stars[b]));
      }
      for (const k in c.stars) (c.bright.includes(k) ? lit : dim).push(starVec(...c.stars[k]));

      const line = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x6E7A8C, transparent: true, opacity: 0.055,
                                      depthWrite: false })
      );
      scene.add(line);
      constLines.push(line);

      const star = (list: THREE.Vector3[], size: number, opacity: number, color: number) => {
        if (!list.length) return;
        scene.add(new THREE.Points(
          new THREE.BufferGeometry().setFromPoints(list),
          new THREE.PointsMaterial({ color, size, sizeAttenuation: false,
                                     transparent: true, opacity, depthWrite: false })
        ));
      };
      star(dim, 1.7, 0.45, 0xC9D4E6);
      star(lit, 2.8, 0.75, 0xF3C766);          // the nakshatra anchors
    }

    /* ── bloom ───────────────────────────────────────────────────── */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.75, 0.4, 0.85));

    /* ── the page-background framing ─────────────────────────────── */
    let mx = 0, my = 0, tx = 0, ty = 0, scrolled = 0;
    on("mousemove", e => {
      if (dragging) return;                       // the drag owns the camera
      tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5;
    });

    /* ── drag to look around ──────────────────────────────────────────
       The camera orbits the Sun on a sphere; a drag moves it along that
       sphere and keeps whatever angle it was let go at. Mouse only — on
       touch a drag has to stay a scroll, or the page becomes a trap. */
    const REST = { x: -300, y: 195, z: 9 };       // the framing the page opens on
    const R_CAM = Math.hypot(REST.x, REST.y, REST.z);
    let az  = Math.atan2(REST.x, REST.z),
        pol = Math.acos(REST.y / R_CAM),
        vAz = 0, vPol = 0, dragging = false, dragged = false, lastX = 0, lastY = 0;
    const clampPol = (a: number) => Math.min(Math.PI - 0.15, Math.max(0.15, a));

    on("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as HTMLElement | null)?.closest("a, button, input, .cell")) return;
      dragging = true; dragged = false;
      lastX = e.clientX; lastY = e.clientY;
      vAz = vPol = 0;
      canvas.style.cursor = "grabbing";
    });
    on("pointermove", e => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) dragged = true;
      vAz = -dx * 0.004; vPol = -dy * 0.004;
      az += vAz; pol = clampPol(pol + vPol);
    });
    on("pointerup", () => {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = "";
      // Let the click handler see that this was a drag, then forget it.
      setTimeout(() => { dragged = false; }, 0);
    });
    on("scroll", () => { scrolled = Math.min(scrollY / innerHeight, 1); });

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        renderer.setSize(w, h, false);
        composer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }

    /* ── picking a planet ────────────────────────────────────────────
       Screen-space proximity rather than a raycast: Pluto is one world unit
       across and lands on a handful of pixels, so a real ray misses it far
       more often than a person expects to miss. Comparing projected centres
       also lets the threshold grow with a planet's apparent size, so Jupiter
       is clickable across its whole disc and Pluto within a forgiving
       radius of its own. */
    const GRAHA: Record<string, [string, string | null]> = {                       // chart abbreviation, ephemeris key
      Sun:  ["Su","Sun"],  Mercury:["Me","Mercury"], Venus:["Ve","Venus"],
      Earth:["Ea",null],   Mars:   ["Ma","Mars"],    Jupiter:["Ju","Jupiter"],
      Saturn:["Sa","Saturn"], Uranus:["Ur",null], Neptune:["Ne",null], Pluto:["Pl",null],
    };

    type PickTarget = { name: string; mesh: THREE.Mesh; r: number };
    const PICK: PickTarget[] = [
      { name: "Sun", mesh: sun, r: sunSize },
      ...Object.entries({ Mercury: mercury, Venus: venus, Earth: earth, Mars: mars,
                          Jupiter: jupiter, Saturn: saturn, Uranus: uranus,
                          Neptune: neptune, Pluto: pluto })
        .map(([name, o]) => ({ name, mesh: o.planet, r: o.planet.geometry.parameters.radius })),
    ];

    const _v = new THREE.Vector3(), _e = new THREE.Vector3(), _right = new THREE.Vector3();
    function pickAt(clientX: number, clientY: number) {
      const b = canvas.getBoundingClientRect();
      if (clientY < b.top || clientY > b.bottom) return null;
      camera.matrixWorld.extractBasis(_right, _v, _v);
      let best: PickTarget | null = null, bestD = Infinity;
      for (const p of PICK) {
        p.mesh.getWorldPosition(_v);
        _e.copy(_v).addScaledVector(_right, p.r);          // a point on its limb
        _v.project(camera);
        if (_v.z > 1) continue;                            // behind the camera
        _e.project(camera);
        const sx = b.left + (_v.x + 1) / 2 * b.width;
        const sy = b.top + (1 - _v.y) / 2 * b.height;
        const px = Math.abs(_e.x - _v.x) / 2 * b.width;    // apparent radius, px
        const d = Math.hypot(sx - clientX, sy - clientY);
        if (d <= Math.max(px, 26) && d < bestD) { bestD = d; best = p; }
      }
      return best;
    }

    const panel = pinfo;
    let picked: PickTarget | null = null;   // the PICK entry, so it can be followed

    function label() {
      if (!picked) return;
      const [ab, key] = GRAHA[picked.name];
      const P = getSky();
      const lon = key && P ? P[key as Body] : null;
      chip.textContent =
        lon !== null ? `${ab} ${SIGN3[Math.floor(lon / 30)]} ${(lon % 30).toFixed(1)}°` : ab;
    }
    function showPlanet(entry: PickTarget) {
      picked = entry;
      label();
      panel.hidden = false;
      requestAnimationFrame(() => { panel.style.opacity = "1"; });
    }
    function hidePlanet() {
      picked = null;
      panel.style.opacity = "0";
      setTimeout(() => { if (!picked) panel.hidden = true; }, 200);
    }

    on("click", e => {
      if (dragged || (e.target as HTMLElement | null)?.closest("a, button, .cell")) return;
      const hit = pickAt(e.clientX, e.clientY);
      if (hit) showPlanet(hit);
      else if (picked) hidePlanet();      // anywhere outside dismisses it
    });
    on("pointermove", e => {
      if ((e.target as HTMLElement | null)?.closest("a, button, .cell")) return;
      if (dragging) return;
      canvas.style.cursor = pickAt(e.clientX, e.clientY) ? "pointer" : "grab";
    });
    every(label, 1000);             // the degree it shows is live

    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      resize();

      if (!still) {
        sun.rotateY(0.001);
        // Spin and orbit rates, taken from the source unchanged.
        mercury.planet.rotateY(0.001);   mercury.planet3d.rotateY(0.004);
        venus.planet.rotateY(0.0005);    venus.planet3d.rotateY(0.0006);
        venus.Atmosphere?.rotateY(0.0005);
        earth.planet.rotateY(0.005);     earth.planet3d.rotateY(0.001);
        earth.Atmosphere?.rotateY(0.001);
        mars.planet.rotateY(0.01);       mars.planet3d.rotateY(0.0007);
        jupiter.planet.rotateY(0.005);   jupiter.planet3d.rotateY(0.0003);
        saturn.planet.rotateY(0.01);     saturn.planet3d.rotateY(0.0002);
        uranus.planet.rotateY(0.005);    uranus.planet3d.rotateY(0.0001);
        neptune.planet.rotateY(0.005);   neptune.planet3d.rotateY(0.00008);
        pluto.planet.rotateY(0.001);     pluto.planet3d.rotateY(0.00006);

        const ms = performance.now();
        constLines.forEach((l, i) => {
          (l.material as THREE.LineBasicMaterial).opacity =
            0.035 + 0.03 * (0.5 + 0.5 * Math.sin(ms * 0.00007 + i * 1.9));
        });
        mx += (tx - mx) * .04; my += (ty - my) * .04;
      }

      // Camera and tooltip run either way: a drag is something the viewer
      // asked for, not motion done at them.
      if (!dragging && (Math.abs(vAz) > 1e-5 || Math.abs(vPol) > 1e-5)) {
        az += vAz; pol = clampPol(pol + vPol);       // let go with some spin
        vAz *= 0.93; vPol *= 0.93;
      }
      const hr = R_CAM * Math.sin(pol);
      camera.position.set(
        hr * Math.sin(az) + mx * 60,
        R_CAM * Math.cos(pol) - my * 40 + scrolled * 140,
        hr * Math.cos(az) + scrolled * 70
      );
      camera.lookAt(0, 0, 0);

      if (picked) {                                  // after the camera moved
        const b = canvas.getBoundingClientRect();
        picked.mesh.getWorldPosition(_v).project(camera);
        // Tucked away rather than left stranded when the planet rounds the
        // far side of the Sun or drifts off the edge.
        const off = _v.z > 1 || Math.abs(_v.x) > 1.05 || Math.abs(_v.y) > 1.05;
        panel.style.opacity = off ? "0" : "1";
        panel.style.left = ((_v.x + 1) / 2 * b.width) + "px";
        panel.style.top  = ((1 - _v.y) / 2 * b.height) + "px";
      }

      composer.render();
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      cleanup.forEach((f) => f());
      timers.forEach(clearInterval);
      renderer.dispose();
      composer.dispose();
    };
  }, []);

  return (
    <>
      <canvas id="sky" ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        ref={panelRef}
        hidden
        style={{ opacity: 0, transition: "opacity .2s ease" }}
        className="pointer-events-none absolute left-0 top-0 z-20 -translate-x-1/2 -translate-y-full pb-2"
      >
        <div
          ref={chipRef}
          className="whitespace-nowrap rounded-[6px] border border-white/15 bg-[#0B0E18]/90 px-2 py-1 font-mono text-[10px] leading-none text-gold backdrop-blur-md"
        />
      </div>
    </>
  );
}
