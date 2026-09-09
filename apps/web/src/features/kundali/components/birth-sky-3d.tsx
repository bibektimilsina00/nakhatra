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

/** U+FE0E pins the glyphs to text presentation, so they take our gold tint
 *  instead of rendering as colour emoji. */
const SIGN_GLYPHS = ["\u2648\uFE0E", "\u2649\uFE0E", "\u264A\uFE0E", "\u264B\uFE0E", "\u264C\uFE0E", "\u264D\uFE0E", "\u264E\uFE0E", "\u264F\uFE0E", "\u2650\uFE0E", "\u2651\uFE0E", "\u2652\uFE0E", "\u2653\uFE0E"];

const SIGNS_EN = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

/** Display shells, innermost out. Not to scale — to be readable. */
const SHELL: Record<string, { r: number; size: number }> = {
  Moon: { r: 46, size: 5.4 },
  Rahu: { r: 58, size: 3.0 },
  Ketu: { r: 58, size: 3.0 },
  Mercury: { r: 74, size: 3.8 },
  Venus: { r: 90, size: 5.2 },
  Sun: { r: 108, size: 11 },
  Mars: { r: 126, size: 4.4 },
  Jupiter: { r: 150, size: 9 },
  Saturn: { r: 174, size: 7.8 },
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

    // Textures are the Solar-System-3D set, self-hosted from /public/planets.
    const IMG = "/planets/";
    const loader = new THREE.TextureLoader();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    // Colour pipeline deliberately mirrors the landing page's solar system —
    // no tone mapping, no texture colorSpace tagging — so the same files
    // render the same colours there and here. Tagging them sRGB and adding
    // ACES was "more correct" and made the Sun redden and every planet drift
    // from the look the rest of the site established.
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const T = (f: string) => {
      const t = loader.load(IMG + f);
      t.anisotropy = maxAniso;
      return t;
    };
    const D = T;

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
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    scene.add(new THREE.HemisphereLight(0xdddddd, 0x222222, 0.6));
    const sunLight = new THREE.PointLight(0xfdffd3, 2600, 900, 1.6);
    sunLight.position.copy(at(lonOf("Sun"), SHELL.Sun.r));
    scene.add(sunLight);

    /* ── the Earth, home of the moment ───────────────────────────── */
    // The landing page's own day/night terminator shader, unchanged, so the
    // Earth here is the Earth there.
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
          vec4 nightColor = texture2D(nightTexture, vUv) * 0.35;
          gl_FragColor = mix(nightColor, dayColor, intensity);
        }`,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(10, 96, 64), earthMat);
    earth.rotation.z = (23.44 * Math.PI) / 180;
    scene.add(earth);
    const earthAtmo = new THREE.Mesh(
      new THREE.SphereGeometry(10.18, 96, 64),
      new THREE.MeshPhongMaterial({
        map: T("earth_atmosphere.jpg"), transparent: true, opacity: 0.4,
        depthTest: true, depthWrite: false,
      }),
    );
    earth.add(earthAtmo);

    /* ── shadow-planet dressing ──────────────────────────────────── */
    const nodeFx: { shell: THREE.ShaderMaterial; glow: THREE.SpriteMaterial; phase: number }[] = [];
    function dressNode(mesh: THREE.Mesh, size: number, hex: string) {
      const color = new THREE.Color(hex);
      // rim-only fresnel shell — smoke catching light at the silhouette
      const shell = new THREE.ShaderMaterial({
        uniforms: { uColor: { value: color }, uPow: { value: 2.2 }, uGain: { value: 1.0 } },
        vertexShader: `
          varying vec3 vN; varying vec3 vV;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vN = normalize(mat3(modelMatrix) * normal);
            vV = normalize(cameraPosition - wp.xyz);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: `
          uniform vec3 uColor; uniform float uPow; uniform float uGain;
          varying vec3 vN; varying vec3 vV;
          void main() {
            float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPow);
            gl_FragColor = vec4(uColor, rim * uGain);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const rimMesh = new THREE.Mesh(new THREE.SphereGeometry(size * 1.18, 48, 32), shell);
      rimMesh.position.copy(mesh.position);
      scene.add(rimMesh);

      // soft halo behind it
      const cnv = document.createElement("canvas");
      cnv.width = cnv.height = 128;
      const g2 = cnv.getContext("2d")!;
      const grad2 = g2.createRadialGradient(64, 64, 4, 64, 64, 64);
      grad2.addColorStop(0, hex + "77");
      grad2.addColorStop(0.35, hex + "2e");
      grad2.addColorStop(1, hex + "00");
      g2.fillStyle = grad2;
      g2.fillRect(0, 0, 128, 128);
      const glow = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cnv),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        opacity: 0.85,
      });
      const sprite = new THREE.Sprite(glow);
      sprite.scale.setScalar(size * 4.2);
      sprite.position.copy(mesh.position);
      scene.add(sprite);

      nodeFx.push({ shell, glow, phase: nodeFx.length * Math.PI });
    }


    /* ── the nine grahas, each at its engine longitude ───────────── */
    type GrahaMesh = { name: string; mesh: THREE.Mesh; r: number; lon: number; label: THREE.Sprite };
    const grahas: GrahaMesh[] = [];

    const material = (name: string): THREE.Material => {
      switch (name) {
        case "Sun": {
          // Outside tone mapping, or ACES rolls the clipped core to pink.
          const sun = new THREE.MeshStandardMaterial({
            emissive: 0xffdf8a, emissiveMap: T("sun.jpg"), emissiveIntensity: 1.35,
          });
          sun.toneMapped = false;
          return sun;
        }
        case "Moon":
          return new THREE.MeshPhongMaterial({
            map: T("moonmap.jpg"), bumpMap: D("moonbump.jpg"), bumpScale: 0.6,
          });
        case "Mercury":
          return new THREE.MeshPhongMaterial({ map: T("mercurymap.jpg"), bumpMap: D("mercurybump.jpg"), bumpScale: 0.7 });
        case "Venus":
          return new THREE.MeshPhongMaterial({ map: T("venusmap.jpg"), bumpMap: D("venusbump.jpg"), bumpScale: 0.7 });
        case "Mars":
          return new THREE.MeshPhongMaterial({ map: T("marsmap.jpg"), bumpMap: D("marsbump.jpg"), bumpScale: 0.7 });
        case "Jupiter":
          return new THREE.MeshPhongMaterial({ map: T("jupiter.jpg") });
        case "Saturn":
          return new THREE.MeshPhongMaterial({ map: T("saturnmap.jpg") });
        default:
          // The nodes are chhaya grahas — shadows, not bodies. A near-black
          // core; the presence comes from the rim shader and glow added
          // after the mesh is built.
          return new THREE.MeshStandardMaterial({
            color: name === "Rahu" ? 0x141026 : 0x1c0f08,
            emissive: name === "Rahu" ? 0x2a2050 : 0x3a1c0e,
            emissiveIntensity: 0.5,
            roughness: 1.0,
          });
      }
    };

    for (const p of chart.planets) {
      const shell = SHELL[p.name];
      if (!shell) continue;
      const lon = p.sign_index * 30 + p.degree_in_sign;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(shell.size, 72, 48), material(p.name),
      );
      mesh.position.copy(at(lon, shell.r));
      scene.add(mesh);

      if (p.name === "Saturn") {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(shell.size + 1.6, shell.size + 4.6, 96),
          new THREE.MeshStandardMaterial({ map: T("saturn_ring.png"), side: THREE.DoubleSide }),
        );
        ring.position.copy(mesh.position);
        ring.rotation.x = -0.45 * Math.PI;
        scene.add(ring);
      }

      // one faint gold shell each (the nodes share the lunar band)
      if (p.name !== "Ketu") {
        const band = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(
            new THREE.EllipseCurve(0, 0, shell.r, shell.r, 0, 2 * Math.PI, false, 0).getPoints(140),
          ),
          new THREE.LineBasicMaterial({ color: 0xe5a93c, transparent: true, opacity: 0.05 }),
        );
        band.rotation.x = Math.PI / 2;
        scene.add(band);
      }

      // a name pill floating over the sphere, constant screen size
      const label = makeLabel(
        getPlanetAbbrev(p.name, language) + (p.retrograde ? " ℞" : ""),
        PLANET_COLORS[p.name] ?? "#F8FAFC", 42, { pill: true },
      );
      label.position.copy(at(lon, shell.r, shell.size + 7));
      scene.add(label);
      grahas.push({ name: p.name, mesh, r: shell.size, lon, label });

      if (p.name === "Rahu" || p.name === "Ketu") {
        dressNode(mesh, shell.size, PLANET_COLORS[p.name]);
      }
    }

    /* ── the nodal axis: Rahu and Ketu are one serpent, always opposite ──
       A faint dotted line from each node toward the Earth, stopping short of
       it — the axis reads without skewering the globe. */
    {
      const rahu = grahas.find((g) => g.name === "Rahu");
      const ketu = grahas.find((g) => g.name === "Ketu");
      for (const node of [rahu, ketu]) {
        if (!node) continue;
        const inner = node.mesh.position.clone().setLength(16);
        const outer = node.mesh.position.clone().setLength(SHELL.Rahu.r - node.r - 2);
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([inner, outer]),
          new THREE.LineDashedMaterial({
            color: new THREE.Color(PLANET_COLORS[node.name]),
            transparent: true, opacity: 0.3, dashSize: 2, gapSize: 3,
          }),
        );
        line.computeLineDistances();
        scene.add(line);
      }
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
    circle(RING_IN, 0.4);
    circle(RING_OUT, 0.4);

    // a soft glow across the ecliptic plane, so the wheel sits on light
    {
      const cnv = document.createElement("canvas");
      cnv.width = cnv.height = 512;
      const g = cnv.getContext("2d")!;
      const grad = g.createRadialGradient(256, 256, 40, 256, 256, 256);
      grad.addColorStop(0, "rgba(122,156,198,0)");
      grad.addColorStop(0.72, "rgba(229,169,60,0)");
      grad.addColorStop(0.88, "rgba(229,169,60,0.10)");
      grad.addColorStop(1, "rgba(229,169,60,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 512, 512);
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(RING_OUT + 4, 96),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(cnv), transparent: true,
          depthWrite: false, side: THREE.DoubleSide,
        }),
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = -0.5;
      scene.add(glow);
    }

    for (let i = 0; i < 12; i++) {
      // alternating sector shading, as a printed wheel alternates its signs
      const isLagnaSign = i === chart.lagna_sign_index;
      const start = (i * 30 * Math.PI) / 180;
      const sector = new THREE.Mesh(
        new THREE.RingGeometry(RING_IN, RING_OUT, 24, 1, start, Math.PI / 6),
        new THREE.MeshBasicMaterial({
          color: 0xe5a93c,
          transparent: true,
          opacity: isLagnaSign ? 0.13 : i % 2 ? 0.02 : 0.045,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      sector.rotation.x = -Math.PI / 2;
      scene.add(sector);

      const spoke = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([at(i * 30, RING_IN), at(i * 30, RING_OUT)]),
        new THREE.LineBasicMaterial({ color: 0xe5a93c, transparent: true, opacity: 0.3 }),
      );
      scene.add(spoke);

      const label = makeLabel(
        getSignName(SIGNS_EN[i], language),
        isLagnaSign ? "#F3C766" : "#E5C77A", 44,
      );
      label.position.copy(at(i * 30 + 15, (RING_IN + RING_OUT) / 2, 4));
      scene.add(label);

      const glyph = makeLabel(SIGN_GLYPHS[i], isLagnaSign ? "#F3C766" : "#E5C77A", 52);
      glyph.position.copy(at(i * 30 + 15, (RING_IN + RING_OUT) / 2, 14));
      scene.add(glyph);

      // whole-sign house number just inside the ring
      const houseNo = ((i - chart.lagna_sign_index + 12) % 12) + 1;
      const num = makeLabel(toLocalizedDigit(houseNo, language), "#8a7a55", 30);
      num.position.copy(at(i * 30 + 15, RING_IN - 14, 1));
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
      new THREE.BufferGeometry().setFromPoints([at(lagnaLon, 14), at(lagnaLon, RING_OUT + 24)]),
      new THREE.LineBasicMaterial({ color: 0xf3c766, transparent: true, opacity: 0.9 }),
    );
    scene.add(beam);
    const ascLabel = makeLabel(language === "en" ? "Asc" : "लग्न", "#F3C766", 36);
    ascLabel.position.copy(at(lagnaLon, RING_OUT + 30, 6));
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
            color: new THREE.Color(
              name === "Moon" ? "#F3C766" : PLANET_COLORS[name] ?? "#E5A93C",
            ),
            transparent: true, opacity: 0.38, dashSize: 4, gapSize: 4,
          }),
        );
        line.computeLineDistances();
        aspectGroup.add(line);
      }
    }

    /* ── bloom ───────────────────────────────────────────────────── */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.4, 0.85));

    /* ── drag-orbit camera around a movable focus ─────────────────────
       Why the landing page's planets look rich and a fixed wide shot does
       not: there Jupiter fills real screen area; from a 460-unit overview
       every graha here is a two-dozen-pixel dot, and no texture survives
       that. So the wheel zooms, and selecting a graha flies the focus to it
       until it fills the frame. */
    const HOME_DIST = 440;
    let az = Math.PI / 3.2, pol = 0.92, vAz = 0, vPol = 0;
    let dist = HOME_DIST, distTarget = HOME_DIST;
    const focus = new THREE.Vector3(0, 0, 0);
    const focusTarget = new THREE.Vector3(0, 0, 0);
    let dragging = false, dragged = false, lastX = 0, lastY = 0;
    const clampPol = (a: number) => Math.min(Math.PI - 0.2, Math.max(0.2, a));

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      distTarget = Math.min(760, Math.max(34, distTarget * (1 + e.deltaY * 0.0012)));
    };
    canvas.addEventListener("wheel", wheel, { passive: false });
    cleanup.push(() => canvas.removeEventListener("wheel", wheel));

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
      else if (selRef.current) onSelectRef.current(selRef.current); // toggle off
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
    let lastSel: string | null = null;
    function animate() {
      raf = requestAnimationFrame(animate);
      resize();

      if (!still) {
        earth.rotateY(0.0016);
        for (const g of grahas) g.mesh.rotateY(g.name === "Sun" ? 0.0008 : 0.003);
        // the shadow planets breathe — slow, out of phase with each other
        const t = performance.now() * 0.0012;
        for (const fx of nodeFx) {
          const b = 0.6 + 0.2 * Math.sin(t + fx.phase);
          fx.shell.uniforms.uGain.value = b;
          fx.glow.opacity = 0.32 + 0.18 * b;
        }
      }

      // momentum after release
      if (!dragging && (Math.abs(vAz) > 1e-5 || Math.abs(vPol) > 1e-5)) {
        az += vAz; pol = clampPol(pol + vPol);
        vAz *= 0.93; vPol *= 0.93;
      }

      // toggles + selection, from refs so React never rebuilds the scene
      nakGroup.visible = nakRef.current;
      const sel = selRef.current;

      // the camera's focus glides to the selected graha and closes in on it;
      // deselecting sends it home to the whole wheel
      const selG = sel ? grahas.find((x) => x.name === sel) : null;
      if (selG) {
        focusTarget.copy(selG.mesh.position);
        distTarget = Math.min(distTarget, Math.max(30, selG.r * 8));
      } else {
        focusTarget.set(0, 0, 0);
        if (lastSel !== null) distTarget = HOME_DIST;
      }
      if (lastSel !== (sel ?? null) && selG) distTarget = Math.max(32, selG.r * 8);
      lastSel = sel ?? null;
      focus.lerp(focusTarget, 0.06);
      dist += (distTarget - dist) * 0.06;

      const hr = dist * Math.sin(pol);
      camera.position.set(
        focus.x + hr * Math.sin(az),
        focus.y + dist * Math.cos(pol),
        focus.z + hr * Math.cos(az),
      );
      camera.lookAt(focus);
      if ((aspRef.current ? sel : null) !== aspectsFor) {
        rebuildAspects(aspRef.current ? sel : null);
      }
      const g = sel ? grahas.find((x) => x.name === sel) : null;
      for (const x of grahas) x.label.visible = x.name !== sel;
      halo.visible = !!g && dist > (g?.r ?? 1) * 14;
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
        drag to orbit · scroll to zoom · click a graha to visit it
      </p>
    </div>
  );
}

/** A text sprite from a canvas — Devanagari renders fine through fillText.
 *  sizeAttenuation is off, so every label keeps a constant on-screen size no
 *  matter where the camera orbits; `pill` bakes a dark rounded backing for
 *  the planet tags. */
function makeLabel(
  text: string, color: string, px: number,
  opts: { pill?: boolean } = {},
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = `600 ${px}px Georgia, 'Noto Serif Devanagari', serif`;
  ctx.font = font;
  const tw = Math.ceil(ctx.measureText(text).width);
  const padX = opts.pill ? 16 : 6;
  const padY = opts.pill ? 10 : 7;
  const w = tw + padX * 2;
  const h = px + padY * 2;
  canvas.width = w * 2;
  canvas.height = h * 2;
  ctx.scale(2, 2);
  if (opts.pill) {
    ctx.fillStyle = "rgba(9,10,16,0.78)";
    ctx.strokeStyle = "rgba(229,169,60,0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(1, 1, w - 2, h - 2, h / 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, padX, h / 2 + 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture, transparent: true, depthWrite: false, sizeAttenuation: false,
    }),
  );
  // With sizeAttenuation off the scale is in NDC-ish units; this constant
  // lands a 40px glyph at roughly 13px on screen, tuned by screenshot.
  const k = 0.00032;
  sprite.scale.set(w * k, h * k, 1);
  sprite.renderOrder = 10;
  return sprite;
}
