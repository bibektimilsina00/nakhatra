"use client";

/* ══════════════════════════════════════════════════════════════
   The birth sky in three.js — the same engine, textures, bloom and
   drag-orbit as the landing page's solar system, but geocentric:
   a kundali describes the sky as seen from the birthplace, so the
   Earth sits at the centre and every graha stands at the sidereal
   longitude the engine computed for the birth moment. Nothing here
   calculates astrology; the scene is a rendering of chart values.

   Radii and sizes are display choices (the Moon nearest, Saturn
   outermost, nodes on the lunar band); longitudes are exact.
   ══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";

import type { Chart } from "@/features/kundali/types";
import { useTranslation } from "@/lib/i18n/language-context";
import {
  getPlanetAbbrev,
  getSignName,
  toLocalizedDigit,
} from "@/lib/i18n/vedic-translations";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export const PLANET_COLORS: Record<string, string> = {
  Sun: "#FFB347",
  Moon: "#E8ECF4",
  Mars: "#FF6B5A",
  Mercury: "#7ED957",
  Jupiter: "#F3C766",
  Venus: "#F7C8E0",
  Saturn: "#7A9CC6",
  Rahu: "#8B7BC7",
  Ketu: "#C77B58",
};

const SIGNS_EN = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/** Display shells, innermost out. Not to scale — to be readable. */
const SHELL: Record<string, { r: number; size: number }> = {
  Moon: { r: 46, size: 4.2 },
  Rahu: { r: 58, size: 2.6 },
  Ketu: { r: 58, size: 2.6 },
  Mercury: { r: 74, size: 3.0 },
  Venus: { r: 90, size: 4.4 },
  Sun: { r: 108, size: 9.5 },
  Mars: { r: 126, size: 3.6 },
  Jupiter: { r: 150, size: 7.5 },
  Saturn: { r: 174, size: 6.5 },
};

const RING_IN = 196;
const RING_OUT = 234;
const NAK_R = 186;

export function BirthSky3D({
  chart,
  selected,
  onSelect,
  showNakshatras,
  showAspects,
}: {
  chart: Chart;
  selected: string | null;
  onSelect: (name: string) => void;
  showNakshatras: boolean;
  showAspects: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { language } = useTranslation();

  // Live prop mirrors, read inside the frame loop without rebuilding the scene.
  const selRef = useRef(selected);
  const nakRef = useRef(showNakshatras);
  const aspRef = useRef(showAspects);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { selRef.current = selected; }, [selected]);
  useEffect(() => { nakRef.current = showNakshatras; }, [showNakshatras]);
  useEffect(() => { aspRef.current = showAspects; }, [showAspects]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!canvasRef.current || !chipRef.current || !panelRef.current) return;
    const canvas = canvasRef.current;
    const chip = chipRef.current;
    const panel = panelRef.current;

    const cleanup: Array<() => void> = [];
    const on = <K extends keyof WindowEventMap>(
      target: Window | HTMLElement, k: K, fn: (e: WindowEventMap[K]) => void,
    ) => {
      target.addEventListener(k, fn as EventListener);
      cleanup.push(() => target.removeEventListener(k, fn as EventListener));
    };

    const IMG = "https://cdn.jsdelivr.net/gh/N3rson/Solar-System-3D@main/src/images/";
    const loader = new THREE.TextureLoader();
    const T = (f: string) => loader.load(IMG + f);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.CubeTextureLoader().setPath(IMG)
      .load(["3.jpg", "1.jpg", "2.jpg", "2.jpg", "4.jpg", "2.jpg"]);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);

    /** Sidereal longitude → scene position on the ecliptic (XZ) plane,
     *  increasing anticlockwise seen from ecliptic north (+Y). */
    const at = (lon: number, r: number, y = 0) => {
      const a = (lon * Math.PI) / 180;
      return new THREE.Vector3(r * Math.cos(a), y, -r * Math.sin(a));
    };

    const lonOf = (name: string) => {
      const p = chart.planets.find((x) => x.name === name);
      return p ? p.sign_index * 30 + p.degree_in_sign : 0;
    };
    const lagnaLon = chart.lagna_sign_index * 30 + chart.lagna_degree;

    /* ── light comes from where the Sun actually stood ───────────── */
    scene.add(new THREE.AmbientLight(0x222233, 5));
    const sunLight = new THREE.PointLight(0xfdffd3, 2600, 900, 1.6);
    sunLight.position.copy(at(lonOf("Sun"), SHELL.Sun.r));
    scene.add(sunLight);

    /* ── the Earth, home of the moment ───────────────────────────── */
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: T("earth_daymap.jpg") },
        nightTexture: { value: T("earth_nightmap.jpg") },
        sunPosition: { value: sunLight.position },
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
          vec4 nightColor = texture2D(nightTexture, vUv) * 0.25;
          gl_FragColor = mix(nightColor, dayColor, intensity);
        }`,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(8, 48, 32), earthMat);
    earth.rotation.z = (23.44 * Math.PI) / 180;
    scene.add(earth);
    const earthAtmo = new THREE.Mesh(
      new THREE.SphereGeometry(8.15, 48, 32),
      new THREE.MeshPhongMaterial({
        map: T("earth_atmosphere.jpg"), transparent: true, opacity: 0.4,
        depthTest: true, depthWrite: false,
      }),
    );
    earth.add(earthAtmo);

    /* ── the nine grahas, each at its engine longitude ───────────── */
    type GrahaMesh = { name: string; mesh: THREE.Mesh; r: number; lon: number };
    const grahas: GrahaMesh[] = [];

    const material = (name: string): THREE.Material => {
      switch (name) {
        case "Sun":
          return new THREE.MeshStandardMaterial({
            emissive: 0xfff88f, emissiveMap: T("sun.jpg"), emissiveIntensity: 1.9,
          });
        case "Moon":
          return new THREE.MeshPhongMaterial({
            map: T("moonmap.jpg"), bumpMap: T("moonbump.jpg"), bumpScale: 0.6,
          });
        case "Mercury":
          return new THREE.MeshPhongMaterial({ map: T("mercurymap.jpg"), bumpMap: T("mercurybump.jpg"), bumpScale: 0.7 });
        case "Venus":
          return new THREE.MeshPhongMaterial({ map: T("venusmap.jpg"), bumpMap: T("venusbump.jpg"), bumpScale: 0.7 });
        case "Mars":
          return new THREE.MeshPhongMaterial({ map: T("marsmap.jpg"), bumpMap: T("marsbump.jpg"), bumpScale: 0.7 });
        case "Jupiter":
          return new THREE.MeshPhongMaterial({ map: T("jupiter.jpg") });
        case "Saturn":
          return new THREE.MeshPhongMaterial({ map: T("saturnmap.jpg") });
        default:
          // The nodes are points, not bodies — smoky, faintly self-lit.
          return new THREE.MeshStandardMaterial({
            color: name === "Rahu" ? 0x4b3f78 : 0x6e4630,
            emissive: name === "Rahu" ? 0x8b7bc7 : 0xc77b58,
            emissiveIntensity: 0.35,
            roughness: 0.9,
          });
      }
    };

    for (const p of chart.planets) {
      const shell = SHELL[p.name];
      if (!shell) continue;
      const lon = p.sign_index * 30 + p.degree_in_sign;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(shell.size, 32, 20), material(p.name),
      );
      mesh.position.copy(at(lon, shell.r));
      scene.add(mesh);
      grahas.push({ name: p.name, mesh, r: shell.size, lon });

      if (p.name === "Saturn") {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(shell.size + 1.6, shell.size + 4.6, 40),
          new THREE.MeshStandardMaterial({ map: T("saturn_ring.png"), side: THREE.DoubleSide }),
        );
        ring.position.copy(mesh.position);
        ring.rotation.x = -0.45 * Math.PI;
        scene.add(ring);
      }

      // orbit band, faint — a display shell, not an orbit claim
      const band = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          new THREE.EllipseCurve(0, 0, shell.r, shell.r, 0, 2 * Math.PI, false, 0).getPoints(120),
        ),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.035 }),
      );
      band.rotation.x = Math.PI / 2;
      scene.add(band);

      // label sprite over the sphere
      const label = makeLabel(
        getPlanetAbbrev(p.name, language) + (p.retrograde ? " ℞" : ""),
        PLANET_COLORS[p.name] ?? "#F8FAFC", 40,
      );
      label.position.copy(at(lon, shell.r, shell.size + 6));
      scene.add(label);
    }

    /* ── the zodiac ring ─────────────────────────────────────────── */
    const flat = (obj: THREE.Object3D) => { obj.rotation.x = Math.PI / 2; scene.add(obj); };
    const circle = (r: number, opacity: number, color = 0xe5a93c) => {
      const c = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          new THREE.EllipseCurve(0, 0, r, r, 0, 2 * Math.PI, false, 0).getPoints(180),
        ),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
      );
      flat(c);
      return c;
    };
    circle(RING_IN, 0.35);
    circle(RING_OUT, 0.35);

    for (let i = 0; i < 12; i++) {
      const spoke = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([at(i * 30, RING_IN), at(i * 30, RING_OUT)]),
        new THREE.LineBasicMaterial({ color: 0xe5a93c, transparent: true, opacity: 0.35 }),
      );
      scene.add(spoke);
      const isLagnaSign = i === chart.lagna_sign_index;
      const label = makeLabel(
        getSignName(SIGNS_EN[i], language),
        isLagnaSign ? "#F3C766" : "#C9D4E6", 34,
      );
      label.position.copy(at(i * 30 + 15, (RING_IN + RING_OUT) / 2, 3));
      scene.add(label);

      // whole-sign house number just inside the ring
      const houseNo = ((i - chart.lagna_sign_index + 12) % 12) + 1;
      const num = makeLabel(toLocalizedDigit(houseNo, language), "#6E7A8C", 26);
      num.position.copy(at(i * 30 + 15, RING_IN - 12, 1));
      scene.add(num);
    }

    /* ── nakshatra ring (toggleable) ─────────────────────────────── */
    const nakGroup = new THREE.Group();
    {
      const c = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          new THREE.EllipseCurve(0, 0, NAK_R, NAK_R, 0, 2 * Math.PI, false, 0).getPoints(216),
        ),
        new THREE.LineBasicMaterial({ color: 0x7a9cc6, transparent: true, opacity: 0.25 }),
      );
      c.rotation.x = Math.PI / 2;
      nakGroup.add(c);
      for (let i = 0; i < 27; i++) {
        const lon = i * (360 / 27);
        const tick = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([at(lon, NAK_R - 4), at(lon, NAK_R + 4)]),
          new THREE.LineBasicMaterial({ color: 0x7a9cc6, transparent: true, opacity: 0.3 }),
        );
        nakGroup.add(tick);
      }
    }
    scene.add(nakGroup);

    /* ── the lagna beam ──────────────────────────────────────────── */
    const beam = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([at(lagnaLon, 14), at(lagnaLon, RING_OUT + 6)]),
      new THREE.LineBasicMaterial({ color: 0xf3c766, transparent: true, opacity: 0.9 }),
    );
    scene.add(beam);
    const ascLabel = makeLabel(language === "en" ? "Asc" : "लग्न", "#F3C766", 36);
    ascLabel.position.copy(at(lagnaLon, RING_OUT + 18, 2));
    scene.add(ascLabel);

    /* ── selection halo + aspect lines, driven from refs per frame ── */
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(6, 0.35, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0xf3c766, transparent: true, opacity: 0.9 }),
    );
    halo.visible = false;
    scene.add(halo);

    const aspectGroup = new THREE.Group();
    scene.add(aspectGroup);
    let aspectsFor: string | null = null;
    function rebuildAspects(name: string | null) {
      aspectsFor = name;
      aspectGroup.clear();
      if (!name) return;
      const p = chart.planets.find((x) => x.name === name);
      const g = grahas.find((x) => x.name === name);
      if (!p?.aspects_houses || !g) return;
      for (const h of p.aspects_houses) {
        const target = ((chart.lagna_sign_index + h - 1) % 12) * 30 + 15;
        const geo = new THREE.BufferGeometry().setFromPoints([
          g.mesh.position.clone(), at(target, RING_IN - 4),
        ]);
        const line = new THREE.Line(
          geo,
          new THREE.LineDashedMaterial({
            color: new THREE.Color(PLANET_COLORS[name] ?? "#E5A93C"),
            transparent: true, opacity: 0.5, dashSize: 4, gapSize: 3,
          }),
        );
        line.computeLineDistances();
        aspectGroup.add(line);
      }
    }

    /* ── bloom ───────────────────────────────────────────────────── */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.7, 0.4, 0.85));

    /* ── drag-orbit camera, as on the landing page ───────────────── */
    const R_CAM = 380;
    let az = Math.PI / 3.2, pol = 1.05, vAz = 0, vPol = 0;
    let dragging = false, dragged = false, lastX = 0, lastY = 0;
    const clampPol = (a: number) => Math.min(Math.PI - 0.2, Math.max(0.2, a));

    on(canvas, "pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true; dragged = false;
      lastX = e.clientX; lastY = e.clientY;
      vAz = vPol = 0;
      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(e.pointerId);
    });
    on(canvas, "pointermove", (e) => {
      if (!dragging) {
        canvas.style.cursor = pickAt(e.clientX, e.clientY) ? "pointer" : "grab";
        return;
      }
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) dragged = true;
      vAz = -dx * 0.005; vPol = -dy * 0.005;
      az += vAz; pol = clampPol(pol + vPol);
    });
    on(canvas, "pointerup", () => {
      dragging = false;
      canvas.style.cursor = "grab";
      setTimeout(() => { dragged = false; }, 0);
    });

    /* ── screen-space picking, as on the landing page ────────────── */
    const _v = new THREE.Vector3(), _e = new THREE.Vector3(), _right = new THREE.Vector3();
    function pickAt(clientX: number, clientY: number): GrahaMesh | null {
      const b = canvas.getBoundingClientRect();
      camera.matrixWorld.extractBasis(_right, _v, _v);
      let best: GrahaMesh | null = null, bestD = Infinity;
      for (const g of grahas) {
        g.mesh.getWorldPosition(_v);
        _e.copy(_v).addScaledVector(_right, g.r);
        _v.project(camera);
        if (_v.z > 1) continue;
        _e.project(camera);
        const sx = b.left + ((_v.x + 1) / 2) * b.width;
        const sy = b.top + ((1 - _v.y) / 2) * b.height;
        const px = (Math.abs(_e.x - _v.x) / 2) * b.width;
        const d = Math.hypot(sx - clientX, sy - clientY);
        if (d <= Math.max(px, 24) && d < bestD) { bestD = d; best = g; }
      }
      return best;
    }

    on(canvas, "click", (e) => {
      if (dragged) return;
      const hit = pickAt(e.clientX, e.clientY);
      if (hit) onSelectRef.current(hit.name);
    });

    /* ── the chip that follows the selected graha ────────────────── */
    const grahaChip = (name: string): string => {
      const p = chart.planets.find((x) => x.name === name);
      if (!p) return name;
      const deg = `${Math.floor(p.degree_in_sign)}°${String(
        Math.floor((p.degree_in_sign % 1) * 60),
      ).padStart(2, "0")}'`;
      return `${getPlanetAbbrev(p.name, language)} · ${getSignName(p.sign, language)} ${toLocalizedDigit(deg, language)}`;
    };

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

    let raf = 0;
    function animate() {
      raf = requestAnimationFrame(animate);
      resize();

      if (!still) {
        earth.rotateY(0.0016);
        for (const g of grahas) g.mesh.rotateY(g.name === "Sun" ? 0.0008 : 0.003);
      }

      // momentum after release
      if (!dragging && (Math.abs(vAz) > 1e-5 || Math.abs(vPol) > 1e-5)) {
        az += vAz; pol = clampPol(pol + vPol);
        vAz *= 0.93; vPol *= 0.93;
      }
      const hr = R_CAM * Math.sin(pol);
      camera.position.set(hr * Math.sin(az), R_CAM * Math.cos(pol), hr * Math.cos(az));
      camera.lookAt(0, 0, 0);

      // toggles + selection, from refs so React never rebuilds the scene
      nakGroup.visible = nakRef.current;
      const sel = selRef.current;
      if ((aspRef.current ? sel : null) !== aspectsFor) {
        rebuildAspects(aspRef.current ? sel : null);
      }
      const g = sel ? grahas.find((x) => x.name === sel) : null;
      halo.visible = !!g;
      if (g) {
        halo.position.copy(g.mesh.position);
        halo.scale.setScalar((g.r + 2.5) / 6);
        halo.lookAt(camera.position);
        // chip follows it on screen
        const b = canvas.getBoundingClientRect();
        g.mesh.getWorldPosition(_v).project(camera);
        const off = _v.z > 1 || Math.abs(_v.x) > 1.05 || Math.abs(_v.y) > 1.05;
        panel.style.opacity = off ? "0" : "1";
        panel.hidden = false;
        panel.style.left = ((_v.x + 1) / 2) * b.width + "px";
        panel.style.top = ((1 - _v.y) / 2) * b.height - (g.r + 10) + "px";
        chip.textContent = grahaChip(g.name);
      } else {
        panel.style.opacity = "0";
      }

      composer.render();
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      cleanup.forEach((f) => f());
      renderer.dispose();
      composer.dispose();
    };
    // The scene is built once per chart and language; toggles and selection
    // flow through refs above rather than rebuilding WebGL state.
  }, [chart, language]);

  return (
    <div className="relative h-[62vh] min-h-[420px] w-full overflow-hidden rounded-[10px] sm:h-[70vh]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-grab" />
      <div
        ref={panelRef}
        hidden
        style={{ opacity: 0, transition: "opacity .2s ease" }}
        className="pointer-events-none absolute left-0 top-0 z-20 -translate-x-1/2 -translate-y-full pb-1"
      >
        <div
          ref={chipRef}
          className="whitespace-nowrap rounded-[6px] border border-white/15 bg-[#0B0E18]/90 px-2 py-1 font-mono text-[10px] leading-none text-[#F3C766] backdrop-blur-md"
        />
      </div>
      <p className="pointer-events-none absolute bottom-2 right-3 z-10 text-[10px] text-white/40">
        drag to orbit · click a graha
      </p>
    </div>
  );
}

/** A text sprite from a canvas — Devanagari renders fine through fillText. */
function makeLabel(text: string, color: string, px: number): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `600 ${px}px Georgia, 'Noto Serif Devanagari', serif`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 12;
  const h = px + 14;
  canvas.width = w * 2;
  canvas.height = h * 2;
  ctx.scale(2, 2);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 6, h / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  const scale = 0.24;
  sprite.scale.set(w * scale, h * scale, 1);
  return sprite;
}
