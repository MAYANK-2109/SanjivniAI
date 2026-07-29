'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';

const BODY_REGIONS = [
  { id: 'head', label: 'Head', icon: '≡ƒºá', position: 'top-left' },
  { id: 'chest', label: 'Chest', icon: '≡ƒ½ü', position: 'mid-left' },
  { id: 'abdomen', label: 'Abdomen', icon: '≡ƒ½â', position: 'bot-left' },
  { id: 'arms', label: 'Arms', icon: '≡ƒÆ¬', position: 'top-right' },
  { id: 'hands', label: 'Hands', icon: '≡ƒûÉ∩╕Å', position: 'mid-right' },
  { id: 'legs', label: 'Legs', icon: '≡ƒª╡', position: 'bot-right' },
];

// Dark theme color palette
const REGION_COLOR = 0x34C98E; // Mint green for active
const BASE_COLOR   = 0x3A4A6A; // Deep slate-blue for dark mannequin
const GLOW_COLOR   = 0x4DA6D9; // Cerulean for fill light

function buildHumanBody(scene) {
  const group = new THREE.Group();

  const baseMat = () =>
    new THREE.MeshPhongMaterial({
      color: BASE_COLOR,
      emissive: 0x2A3C4D,
      emissiveIntensity: 0.1,
      shininess: 40,
      transparent: true,
      opacity: 0.9,
      side: THREE.FrontSide,
    });

  // ΓöÇΓöÇ Head ΓöÇΓöÇ
  const headGeo  = new THREE.SphereGeometry(0.52, 32, 32);
  const head     = new THREE.Mesh(headGeo, baseMat());
  head.position.set(0, 3.25, 0);
  head.userData.region = 'head';

  // ΓöÇΓöÇ Neck ΓöÇΓöÇ
  const neckGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.55, 24);
  const neck    = new THREE.Mesh(neckGeo, baseMat());
  neck.position.set(0, 2.6, 0);
  neck.userData.region = 'head';

  // ΓöÇΓöÇ Torso (upper ΓÇö chest) ΓöÇΓöÇ
  const chestGeo = new THREE.CapsuleGeometry(0.72, 1.2, 16, 32);
  const chest    = new THREE.Mesh(chestGeo, baseMat());
  chest.position.set(0, 1.5, 0);
  chest.userData.region = 'chest';

  // ΓöÇΓöÇ Torso (lower ΓÇö abdomen) ΓöÇΓöÇ
  const abdoGeo = new THREE.CapsuleGeometry(0.62, 0.9, 16, 32);
  const abdomen = new THREE.Mesh(abdoGeo, baseMat());
  abdomen.position.set(0, 0.0, 0);
  abdomen.userData.region = 'abdomen';

  // ΓöÇΓöÇ Pelvis ΓöÇΓöÇ
  const pelvisGeo = new THREE.SphereGeometry(0.55, 28, 20);
  pelvisGeo.scale(1, 0.55, 0.78);
  const pelvis = new THREE.Mesh(pelvisGeo, baseMat());
  pelvis.position.set(0, -0.72, 0);
  pelvis.userData.region = 'abdomen';

  // ΓöÇΓöÇ Upper Arms ΓöÇΓöÇ
  const makeArm = (side) => {
    const g   = new THREE.CapsuleGeometry(0.16, 0.78, 12, 24);
    const m   = new THREE.Mesh(g, baseMat());
    m.position.set(side * 1.08, 1.48, 0);
    m.rotation.z = side * 0.22;
    m.userData.region = 'arms';
    return m;
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // ΓöÇΓöÇ Forearms ΓöÇΓöÇ
  const makeForearm = (side) => {
    const g = new THREE.CapsuleGeometry(0.13, 0.72, 12, 24);
    const m = new THREE.Mesh(g, baseMat());
    m.position.set(side * 1.25, 0.6, 0);
    m.rotation.z = side * 0.35;
    m.userData.region = 'arms';
    return m;
  };
  const forearmL = makeForearm(-1);
  const forearmR = makeForearm(1);

  // ΓöÇΓöÇ Hands ΓöÇΓöÇ
  const makeHand = (side) => {
    const g = new THREE.SphereGeometry(0.16, 20, 20);
    g.scale(1.0, 0.65, 0.55);
    const m = new THREE.Mesh(g, baseMat());
    m.position.set(side * 1.42, -0.0, 0);
    m.userData.region = 'hands';
    return m;
  };
  const handL = makeHand(-1);
  const handR = makeHand(1);

  // ΓöÇΓöÇ Upper Legs (Thighs) ΓöÇΓöÇ
  const makeThigh = (side) => {
    const g = new THREE.CapsuleGeometry(0.22, 1.0, 12, 24);
    const m = new THREE.Mesh(g, baseMat());
    m.position.set(side * 0.3, -1.75, 0);
    m.userData.region = 'legs';
    return m;
  };
  const thighL = makeThigh(-1);
  const thighR = makeThigh(1);

  // ΓöÇΓöÇ Lower Legs (Calves) ΓöÇΓöÇ
  const makeCalf = (side) => {
    const g = new THREE.CapsuleGeometry(0.16, 0.95, 12, 24);
    const m = new THREE.Mesh(g, baseMat());
    m.position.set(side * 0.3, -2.95, 0);
    m.userData.region = 'legs';
    return m;
  };
  const calfL = makeCalf(-1);
  const calfR = makeCalf(1);

  // ΓöÇΓöÇ Feet ΓöÇΓöÇ
  const makeFoot = (side) => {
    const g = new THREE.SphereGeometry(0.18, 20, 14);
    g.scale(1.55, 0.55, 0.9);
    const m = new THREE.Mesh(g, baseMat());
    m.position.set(side * 0.3, -3.58, 0.12);
    m.userData.region = 'legs';
    return m;
  };
  const footL = makeFoot(-1);
  const footR = makeFoot(1);

  group.add(
    head, neck,
    chest, abdomen, pelvis,
    armL, armR, forearmL, forearmR, handL, handR,
    thighL, thighR, calfL, calfR, footL, footR,
  );

  scene.add(group);
  return group;
}

export default function HumanBody3D({ selectedRegion, onRegionSelect }) {
  const mountRef  = useRef(null);
  const stateRef  = useRef({});
  const [hoveredCard, setHoveredCard] = useState(null);

  // ΓöÇΓöÇ Three.js scene setup ΓöÇΓöÇ
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0, 14);

    // ΓöÇΓöÇ Lighting (adjusted for light theme) ΓöÇΓöÇ
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(3, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x4DA6D9, 0.8);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(GLOW_COLOR, 0.8, 20);
    fillLight.position.set(0, 2, 5);
    scene.add(fillLight);

    // ΓöÇΓöÇ Glow halo behind body ΓöÇΓöÇ
    const haloGeo = new THREE.PlaneGeometry(5, 8);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x34C98E,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 0, -0.5);
    scene.add(halo);

    // ΓöÇΓöÇ Body ΓöÇΓöÇ
    const bodyGroup = buildHumanBody(scene);
    bodyGroup.position.set(0, 0.2, 0);

    stateRef.current = {
      renderer, scene, camera, bodyGroup,
      frameId: null, elapsed: 0,
      selectedRegion: null,
    };

    // ΓöÇΓöÇ Resize ΓöÇΓöÇ
    function onResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    // ΓöÇΓöÇ Animate ΓöÇΓöÇ
    let last = performance.now();
    function animate(now) {
      const s = stateRef.current;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      s.elapsed += dt;

      // Smooth, symmetric Y-axis rotation (vertical axis through head ΓåÆ belly)
      bodyGroup.rotation.y += dt * 0.55;

      // Gentle breathing bob
      bodyGroup.position.y = 0.2 + Math.sin(s.elapsed * 1.1) * 0.04;

      // Soft color pulse for selected/hovered region meshes
      bodyGroup.children.forEach((mesh) => {
        if (!mesh.material) return;
        const region = mesh.userData.region;
        const isSelected = region === s.selectedRegion;
        const target = isSelected ? REGION_COLOR : BASE_COLOR;
        mesh.material.color.lerp(new THREE.Color(target), 0.08);
        mesh.material.emissiveIntensity = isSelected
          ? 0.35 + Math.sin(s.elapsed * 3) * 0.1
          : 0.1;
      });

      s.frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    stateRef.current.frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(stateRef.current.frameId);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.selectedRegion = selectedRegion;
    }
  }, [selectedRegion]);

  const cardPositions = {
    'top-left':  { top: '8%',  left: '2%' },
    'mid-left':  { top: '38%', left: '0%' },
    'bot-left':  { top: '66%', left: '2%' },
    'top-right': { top: '8%',  right: '2%' },
    'mid-right': { top: '38%', right: '0%' },
    'bot-right': { top: '66%', right: '2%' },
  };

  return (
    <div className="relative w-full h-full select-none">
      {/* Three.js canvas */}
      <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />

      {/* Ambient glow rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="body-glow-ring" />
      </div>

      {/* Floating region cards */}
      {BODY_REGIONS.map((region) => {
        const isActive = selectedRegion === region.id;
        const isHovered = hoveredCard === region.id;
        const pos = cardPositions[region.position];
        const isLeft = region.position.includes('left');

        return (
          <motion.button
            key={region.id}
            onClick={() => onRegionSelect?.(region.id === selectedRegion ? null : region.id)}
            onMouseEnter={() => setHoveredCard(region.id)}
            onMouseLeave={() => setHoveredCard(null)}
            initial={{ opacity: 0, x: isLeft ? -16 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * BODY_REGIONS.indexOf(region), duration: 0.5, ease: 'easeOut' }}
            style={{ position: 'absolute', ...pos }}
            className={`
              region-card group z-20 flex flex-col items-center gap-1 rounded-xl border px-3 py-2
              font-sans text-xs font-medium transition-all duration-200 shadow-sm
              ${isActive
                ? 'border-mint-500 bg-mint-50 text-mint-600 shadow-[0_0_16px_rgba(52,201,142,0.15)]'
                : 'border-slate-200 bg-white/70 text-slate-600 hover:border-mint-300 hover:bg-mint-50/50 hover:text-mint-600'
              }
            `}
          >
            <span className="text-base leading-none">{region.icon}</span>
            <span className="whitespace-nowrap tracking-wide">{region.label}</span>
            {isActive && (
              <motion.span
                layoutId="active-dot"
                className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-mint-500"
              />
            )}
          </motion.button>
        );
      })}

      {/* Connector line hint (decorative) */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full opacity-30"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34C98E" stopOpacity="0" />
            <stop offset="50%" stopColor="#34C98E" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#34C98E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="28%" y1="15%" x2="42%" y2="22%" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1="28%" y1="45%" x2="38%" y2="45%" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1="28%" y1="72%" x2="42%" y2="62%" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1="72%" y1="15%" x2="58%" y2="22%" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1="72%" y1="45%" x2="62%" y2="45%" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1="72%" y1="72%" x2="58%" y2="62%" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4 2" />
      </svg>
    </div>
  );
}
