import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';

// Conditional class joiner
const cx = (...classes) => classes.filter(Boolean).join(' ');

// =========================================================
// 1. NATIVE WEB AUDIO SYNTHESIZER ENGINE (Zero-dependency, Instant Sound)
// =========================================================
const useSoundEffects = (isMuted) => {
  const audioCtxRef = useRef(null);

  const getContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  // Crisp mechanical coder keyclick + harmonic blip
  const playClick = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.045); // A5
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }, [isMuted, getContext]);

  // Cyber ascending arpeggio fanfare on submission & RSVP
  const playSuccess = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        gain.gain.setValueAtTime(0.16, now + idx * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.3);
      });
    } catch (e) {}
  }, [isMuted, getContext]);

  // High crystal chime for bookmarking & pet interaction
  const playBookmark = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.09); // E6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }, [isMuted, getContext]);

  return { playClick, playSuccess, playBookmark };
};

// =========================================================
// 2. SLEEK PIXEL MATRIX + 3D CONSTELLATION BACKGROUND
// =========================================================
const BackgroundAnimation = ({ theme }) => {
  const pixelCanvasRef = useRef(null);
  const threeMountRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, normX: 0, normY: 0 });

  // 2A. Interactive 2D Pixel Grid Canvas (Glowing Cyber Voxels & Cursor Trail)
  useEffect(() => {
    const canvas = pixelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Floating digital firefly pixels
    const pixelNodes = Array.from({ length: 65 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      size: Math.random() > 0.5 ? 4 : 3,
      phase: Math.random() * Math.PI * 2,
      colorType: Math.random() > 0.78 ? 'pink' : Math.random() > 0.5 ? 'cyan' : 'green',
    }));

    const handleMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.normX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.normY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMove);

    let tick = 0;
    const renderPixels = () => {
      tick += 0.025;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = theme === 'dark';
      const gridSpacing = 36;

      // Draw interactive pixel matrix around mouse and subtle ambient grid dots
      for (let gx = 0; gx < canvas.width; gx += gridSpacing) {
        for (let gy = 0; gy < canvas.height; gy += gridSpacing) {
          const dx = gx - mouseRef.current.x;
          const dy = gy - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 170) {
            const intensity = (1 - dist / 170) * (isDark ? 0.65 : 0.4);
            ctx.fillStyle = isDark
              ? `rgba(0, 255, 157, ${intensity.toFixed(3)})`
              : `rgba(5, 150, 105, ${intensity.toFixed(3)})`;
            const s = dist < 75 ? 5 : 3;
            ctx.fillRect(gx - s / 2, gy - s / 2, s, s);
          } else if ((gx + gy) % 72 === 0) {
            ctx.fillStyle = isDark ? 'rgba(48, 54, 61, 0.35)' : 'rgba(148, 163, 184, 0.28)';
            ctx.fillRect(gx, gy, 2, 2);
          }
        }
      }

      // Draw floating neon pixel blocks
      pixelNodes.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Gentle repulsion/attraction to mouse
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 140 && d > 5) {
          p.x -= (dx / d) * 0.8;
          p.y -= (dy / d) * 0.8;
        }

        const alpha = (Math.sin(tick + p.phase) * 0.35 + 0.55) * (isDark ? 0.85 : 0.55);
        if (p.colorType === 'pink') {
          ctx.fillStyle = `rgba(244, 63, 94, ${alpha})`;
        } else if (p.colorType === 'cyan') {
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
        } else {
          ctx.fillStyle = isDark ? `rgba(0, 255, 157, ${alpha})` : `rgba(16, 185, 129, ${alpha})`;
        }
        // Snap to 2px crisp pixel coordinates
        const snapX = Math.round(p.x / 2) * 2;
        const snapY = Math.round(p.y / 2) * 2;
        ctx.fillRect(snapX, snapY, p.size, p.size);
      });

      animId = requestAnimationFrame(renderPixels);
    };
    renderPixels();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [theme]);

  // 2B. Three.js 3D Wireframe Polyhedron & Starfield
  useEffect(() => {
    if (typeof window === 'undefined' || !threeMountRef.current) return;
    const container = threeMountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4.6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const particleCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 14;
      positions[i + 1] = (Math.random() - 0.5) * 14;
      positions[i + 2] = (Math.random() - 0.5) * 9;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const isDark = theme === 'dark';
    const material = new THREE.PointsMaterial({
      size: 0.025,
      color: isDark ? 0x00ff9d : 0x0f766e,
      transparent: true,
      opacity: isDark ? 0.65 : 0.35,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const icosaGeo = new THREE.IcosahedronGeometry(2.2, 1);
    const wireGeo = new THREE.WireframeGeometry(icosaGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x00ff9d : 0x059669,
      transparent: true,
      opacity: isDark ? 0.13 : 0.07,
    });
    const wireframe = new THREE.LineSegments(wireGeo, lineMat);
    scene.add(wireframe);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const mx = mouseRef.current.normX;
      const my = mouseRef.current.normY;

      points.rotation.y = t * 0.035 + mx * 0.18;
      points.rotation.x = t * 0.02 - my * 0.18;

      wireframe.rotation.y = -t * 0.045 + mx * 0.25;
      wireframe.rotation.x = t * 0.03 + my * 0.25;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      icosaGeo.dispose();
      lineMat.dispose();
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={pixelCanvasRef} className="absolute inset-0 w-full h-full" />
      <div ref={threeMountRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

// =========================================================
// 3. INTERACTIVE PIXEL ANIMAL COMPANION (Follows Mouse, Walks & Reacts)
// =========================================================
const MASCOT_SPECIES = {
  home: {
    name: 'Schrödinger’s Pixel Cat',
    role: 'Quantum Guardian',
    color: '#00ff9d',
    accent: '#f43f5e',
    ears: 'cat',
    quips: [
      'Meow! Both |Alive⟩ & |Curious⟩!',
      'Click any talk to inspect slides!',
      'Try moving your cursor around me!',
      '>>> ob.ignite_curiosity() == True',
    ],
  },
  about: {
    name: 'Euler’s Night Owl',
    role: 'Keeper of Theorems',
    color: '#38bdf8',
    accent: '#eab308',
    ears: 'owl',
    quips: [
      'Hoot! Breaking academic silos since 2025!',
      'e^(iπ) + 1 = 0 ... pure elegance!',
      'Meet our founding coordinators!',
    ],
  },
  archive: {
    name: 'Maxwell’s Cyber Fox',
    role: 'Entropy Sorter',
    color: '#f43f5e',
    accent: '#00ff9d',
    ears: 'fox',
    quips: [
      'Sorting low-entropy knowledge!',
      '14 peer-reviewed student talks archived!',
      'Filter by Physics, Math, CS, or Bio!',
    ],
  },
  gallery: {
    name: 'Fibonacci Bunny',
    role: 'Visual Archivist',
    color: '#a855f7',
    accent: '#00ff9d',
    ears: 'bunny',
    quips: [
      '1, 1, 2, 3, 5, 8... Hop through L-8 photos!',
      'Click any blackboard photo to zoom in!',
      'Real chalk, real derivations!',
    ],
  },
  events: {
    name: 'Lorenz’s Chaos Frog',
    role: 'Strange Attractor',
    color: '#10b981',
    accent: '#fde047',
    ears: 'frog',
    quips: [
      'Ribbit! Small hops → huge breakthroughs!',
      'See you in Room L-8, LHC at 18:00 IST!',
      'Add our next talk to your Google Calendar!',
    ],
  },
  submit: {
    name: 'Darwin’s Carrier Pigeon',
    role: 'Proposal Dispatcher',
    color: '#eab308',
    accent: '#00ff9d',
    ears: 'bird',
    quips: [
      'Coo! Fill the form to draft your proposal to openboardinitiative@gmail.com!',
      'Every submission gets a unique #OB-2026 serial tag!',
      'Review your formatted email draft and hit send!',
    ],
  },
  contact: {
    name: 'Turing’s Red Panda',
    role: 'Protocol Operator',
    color: '#f97316',
    accent: '#00ff9d',
    ears: 'fox',
    quips: [
      'Fill out the suggestion form to draft a clean email to openboardinitiative@gmail.com!',
      'State machine ready for your feedback or suggestion!',
      'Room L-8, Lecture Hall Complex!',
    ],
  },
};

const PixelCompanion = ({ activeTab, onPetSound }) => {
  const species = MASCOT_SPECIES[activeTab] || MASCOT_SPECIES.home;
  const [pos, setPos] = useState({ x: 140, y: 180 });
  const targetRef = useRef({ x: 140, y: 180 });
  const posRef = useRef({ x: 140, y: 180 });
  const [facingLeft, setFacingLeft] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [stepFrame, setStepFrame] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [speechIndex, setSpeechIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(true);
  const [hearts, setHearts] = useState([]);

  // Track mouse movement so the pixel animal gently walks/floats near the cursor
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Offset slightly from cursor so it never blocks clicks
      const offsetX = e.clientX > window.innerWidth - 160 ? e.clientX - 95 : e.clientX + 55;
      const offsetY = Math.max(85, Math.min(window.innerHeight - 95, e.clientY + 35));
      targetRef.current = { x: offsetX, y: offsetY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smooth physics loop for walking & floating along the page
  useEffect(() => {
    let animId;
    let frameCounter = 0;

    const updatePhysics = () => {
      frameCounter++;
      const dx = targetRef.current.x - posRef.current.x;
      const dy = targetRef.current.y - posRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 8) {
        posRef.current.x += dx * 0.045;
        posRef.current.y += dy * 0.045;
        if (Math.abs(dx) > 2) {
          setFacingLeft(dx < 0);
        }
        setIsWalking(true);
        if (frameCounter % 8 === 0) {
          setStepFrame((s) => (s + 1) % 2);
        }
      } else {
        setIsWalking(false);
      }

      setPos({
        x: Math.round(posRef.current.x),
        y: Math.round(posRef.current.y + Math.sin(frameCounter * 0.07) * 4),
      });

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Periodic blinking & quip rotation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3400);

    return () => clearInterval(blinkInterval);
  }, []);

  // Show new quip when changing page tabs
  useEffect(() => {
    setSpeechIndex(0);
    setShowBubble(true);
    const timer = setTimeout(() => setShowBubble(false), 6500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handlePetMascot = () => {
    if (onPetSound) onPetSound();
    setSpeechIndex((prev) => (prev + 1) % species.quips.length);
    setShowBubble(true);
    const id = Date.now();
    setHearts((prev) => [...prev, id]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h !== id));
    }, 1000);
  };

  return (
    <div
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      }}
      className="fixed top-0 left-0 z-30 pointer-events-none select-none transition-transform duration-75 ease-out hidden sm:block"
    >
      {/* Floating Speech Bubble */}
      {showBubble && (
        <div
          className="mb-2 -ml-16 max-w-[230px] px-3 py-1.5 rounded-xl bg-[#0d1117]/95 border border-[#00ff9d]/50 text-[10px] font-mono text-[#e6edf3] shadow-[0_0_20px_rgba(0,255,157,0.2)] animate-bounce"
          style={{ animationDuration: '2.8s' }}
        >
          <div className="flex items-center justify-between gap-2 text-[9px] text-[#00ff9d] font-bold mb-0.5">
            <span>❖ {species.name}</span>
          </div>
          <p className="leading-snug text-zinc-200">{species.quips[speechIndex]}</p>
        </div>
      )}

      {/* Floating Pixel Hearts when clicked */}
      {hearts.map((h) => (
        <div
          key={h}
          className="absolute -top-6 left-4 text-xs font-mono text-[#f43f5e] font-bold animate-ping"
        >
          ♥ +1
        </div>
      ))}

      {/* Clickable Pixel Animal Avatar SVG */}
      <div
        onClick={handlePetMascot}
        title={`Click to pet ${species.name}!`}
        className="pointer-events-auto cursor-pointer group relative inline-block"
      >
        {/* Neon Aura Under Pet */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2.5 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: species.color }}
        />

        <svg
          width="54"
          height="54"
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          style={{
            transform: `${facingLeft ? 'scaleX(-1)' : 'scaleX(1)'} ${
              isWalking ? (stepFrame === 0 ? 'rotate(-5deg) translateY(-2px)' : 'rotate(5deg)') : ''
            }`,
            transition: 'transform 0.12s ease',
          }}
          className="drop-shadow-[0_0_8px_rgba(0,255,157,0.45)] group-hover:scale-110"
        >
          {/* Ears / Head Crest by Species */}
          {species.ears === 'cat' && (
            <>
              <rect x="3" y="2" width="2" height="2" fill={species.color} />
              <rect x="11" y="2" width="2" height="2" fill={species.color} />
              <rect x="4" y="3" width="1" height="1" fill={species.accent} />
              <rect x="11" y="3" width="1" height="1" fill={species.accent} />
            </>
          )}
          {species.ears === 'bunny' && (
            <>
              <rect x="4" y="0" width="2" height="4" fill={species.color} />
              <rect x="10" y="0" width="2" height="4" fill={species.color} />
              <rect x="5" y="1" width="1" height="2" fill={species.accent} />
              <rect x="10" y="1" width="1" height="2" fill={species.accent} />
            </>
          )}
          {species.ears === 'fox' && (
            <>
              <rect x="2" y="1" width="3" height="3" fill={species.color} />
              <rect x="11" y="1" width="3" height="3" fill={species.color} />
              <rect x="3" y="2" width="1" height="2" fill="#ffffff" />
              <rect x="12" y="2" width="1" height="2" fill="#ffffff" />
            </>
          )}
          {species.ears === 'owl' && (
            <>
              <rect x="2" y="2" width="2" height="2" fill={species.accent} />
              <rect x="12" y="2" width="2" height="2" fill={species.accent} />
            </>
          )}
          {species.ears === 'frog' && (
            <>
              <rect x="3" y="2" width="3" height="2" fill={species.color} />
              <rect x="10" y="2" width="3" height="2" fill={species.color} />
            </>
          )}
          {species.ears === 'bird' && (
            <>
              <rect x="7" y="1" width="2" height="3" fill={species.accent} />
              <rect x="8" y="0" width="2" height="2" fill={species.color} />
            </>
          )}

          {/* Main Pixel Head & Body */}
          <rect x="3" y="4" width="10" height="8" fill="#0d1117" />
          <rect x="2" y="5" width="1" height="6" fill={species.color} />
          <rect x="13" y="5" width="1" height="6" fill={species.color} />
          <rect x="3" y="3" width="10" height="1" fill={species.color} />
          <rect x="3" y="12" width="10" height="1" fill={species.color} />

          {/* Glowing Pixel Eyes */}
          {isBlinking ? (
            <>
              <rect x="5" y="7" width="2" height="1" fill={species.color} />
              <rect x="9" y="7" width="2" height="1" fill={species.color} />
            </>
          ) : (
            <>
              <rect x="5" y="6" width="2" height="2" fill={species.color} />
              <rect x="9" y="6" width="2" height="2" fill={species.color} />
              <rect x="6" y="6" width="1" height="1" fill="#ffffff" />
              <rect x="10" y="6" width="1" height="1" fill="#ffffff" />
            </>
          )}

          {/* Cute Pixel Cheeks & Nose/Beak */}
          <rect x="4" y="8" width="1" height="1" fill={species.accent} />
          <rect x="11" y="8" width="1" height="1" fill={species.accent} />
          <rect x="7" y="8" width="2" height="1" fill="#ffffff" />
          <rect x="6" y="9" width="4" height="1" fill={species.color} />

          {/* Animated Walking Pixel Feet */}
          <rect
            x={isWalking && stepFrame === 0 ? '3' : '4'}
            y="13"
            width="2"
            height="2"
            fill={species.color}
          />
          <rect
            x={isWalking && stepFrame === 1 ? '11' : '10'}
            y="13"
            width="2"
            height="2"
            fill={species.color}
          />

          {/* Wagging Pixel Tail */}
          <rect
            x="1"
            y={stepFrame === 0 ? '9' : '8'}
            width="1"
            height="2"
            fill={species.accent}
          />
        </svg>
      </div>
    </div>
  );
};

// =========================================================
// 4. ARCHIVAL TALKS DATA (ALL 14 TALKS)
// =========================================================
const TALKS_DATA = [
  {
    id: 'talk-1',
    number: '01',
    title: 'The Probabilistic Method',
    speaker: 'Adeetya Choubey',
    affiliation: 'Mathematics Major, 2022 Batch',
    date: '2025-08-07',
    category: 'Mathematics',
    tags: ['Combinatorics', 'Probability', 'Graph Theory', 'Discrete Math'],
    abstract:
      'An introduction to the celebrated probabilistic method popularized by Paul Erdős. Learn how proving the existence of mathematical objects with specific properties can be accomplished by constructing a probability space and showing the probability is strictly positive—without ever explicitly exhibiting the object.',
    poster: '/talk1',
    slidesUrl: '/Open_board.pdf',
    slidesName: 'Open_board.pdf',
  },
  {
    id: 'talk-2',
    number: '02',
    title: 'Butterflies, Chaos and Fractals',
    speaker: 'Sidharth Raman',
    affiliation: 'Physics & Dynamical Systems',
    date: '2025-08-14',
    category: 'Physics',
    tags: ['Nonlinear Dynamics', 'Chaos Theory', 'Strange Attractors', 'Fractals'],
    abstract:
      'A deep dive into deterministic chaos, sensitive dependence on initial conditions (the butterfly effect), and the geometric beauty of strange attractors like the Lorenz system. We examine how simple nonlinear deterministic rules yield infinite complexity and fractal dimension.',
    poster: '/raman.png',
    slidesUrl: '/walks.pdf',
    slidesName: 'walks.pdf',
  },
  {
    id: 'talk-3',
    number: '03',
    title: 'Stochastic Simulation of Chemical Systems',
    speaker: 'Aryan Gupta',
    affiliation: 'Chemical Sciences & Computation',
    date: '2025-08-21',
    category: 'Chemistry',
    tags: ['Gillespie Algorithm', 'Stochastic Modeling', 'Chemical Kinetics', 'Simulations'],
    abstract:
      'Deterministic rate laws fail when molecular counts are low, such as inside biological cells. This talk unpacks exact stochastic simulation algorithms (Gillespie SSA), chemical master equations, and the statistical mechanics of intrinsic noise in biochemical networks.',
    poster: '/aryan.png',
    slidesUrl: '/beamer.pdf',
    slidesName: 'beamer.pdf',
  },
  {
    id: 'talk-4',
    number: '04',
    title: 'How I Met Your Limit Function',
    speaker: 'Harsh Tandon',
    affiliation: 'Pure Mathematics',
    date: '2025-08-22',
    category: 'Mathematics',
    tags: ['Real Analysis', 'Topology', 'Pointwise Convergence', 'Uniform Continuity'],
    abstract:
      'A playful yet rigorous pedagogical expedition into sequence of functions, pathological counterexamples in analysis, pointwise versus uniform convergence, and the subtle breakdown of interchange of limits and integrals.',
    poster: '/harsh.png',
    slidesUrl: '/yg.pdf',
    slidesName: 'yg.pdf',
  },
  {
    id: 'talk-5',
    number: '05',
    title: 'Strategic Lies and the Art of Truth Extraction',
    speaker: 'Manas Nandan',
    affiliation: 'Economics & Game Theory',
    date: '2025-09-04',
    category: 'Interdisciplinary',
    tags: ['Mechanism Design', 'Information Economics', 'Game Theory', 'Incentives'],
    abstract:
      'When agents have private incentives to distort information, how can an institution or auctioneer extract the objective truth? An intuitive exploration of the Revelation Principle, Vickrey-Clarke-Groves mechanisms, and modern strategic signaling.',
    poster: '/manaso.png',
    slidesUrl: '/Open_board.pdf',
    slidesName: 'Open_board.pdf',
  },
  {
    id: 'talk-6',
    number: '06',
    title: "A Hitchhiker's Guide to Hyperbolic Geometry",
    speaker: 'Dev Krishna',
    affiliation: 'Geometry & Topology',
    date: '2025-09-06',
    category: 'Mathematics',
    tags: ['Non-Euclidean Geometry', 'Poincaré Disk', 'Hyperbolic Tessellations'],
    abstract:
      "What if Euclid's fifth postulate is false? Journey into negatively curved non-Euclidean universes, Poincaré disk projections, Escher-like hyperbolic circle limits, and the geometric structures underlying special relativity and geometric group theory.",
    poster: '/devp.png',
    slidesUrl: '/Open_board.pdf',
    slidesName: 'Open_board.pdf',
  },
  {
    id: 'talk-7',
    number: '07',
    title: 'Interpolation Techniques & Splines',
    speaker: 'Raj Soni',
    affiliation: 'Applied Mathematics & Computing',
    date: '2025-09-09',
    category: 'Computer Science',
    tags: ['Numerical Analysis', 'Splines', 'Runge Phenomenon', 'Polynomials'],
    abstract:
      'How do computers smoothly fit curves through discrete points without exploding into wild oscillations? We analyze polynomial interpolation, Chebyshev nodes, B-splines, and modern computational approximations in graphics and engineering.',
    poster: '/raj.jpeg',
    slidesUrl: '/Presentation_interpolation.pdf',
    slidesName: 'Presentation_interpolation.pdf',
  },
  {
    id: 'talk-8',
    number: '08',
    title: '"Watt are the Chances?": Electrical Networks and Random Walks',
    speaker: 'Deo Ishaan Prashant',
    affiliation: 'Physics & Probability',
    date: '2025-09-12',
    category: 'Physics',
    tags: ['Random Walks', 'Harmonic Functions', 'Kirchhoff Laws', 'Graph Theory'],
    abstract:
      'The breathtaking isomorphism between resistor networks and discrete Markov chains. Discover how voltages satisfy the Dirichlet problem for harmonic functions and how finding escape probabilities of a random walker is solved by Ohm and Kirchhoff laws.',
    poster: '/deo.png',
    slidesUrl: '/walks.pdf',
    slidesName: 'walks.pdf',
  },
  {
    id: 'talk-9',
    number: '09',
    title: 'Everything Entangled All at Once',
    speaker: 'Samriddha Ganguly',
    affiliation: 'Physics Major, 2022 Batch',
    date: '2025-10-09',
    category: 'Physics',
    tags: ['Quantum Matter', 'Entanglement Entropy', 'Topology', 'Quantum Information'],
    abstract:
      'Beyond classical Landau paradigm of symmetry breaking lies the realm of topological order and quantum matter. We explore how quantum entanglement ceases to be just an EPR paradox and becomes the fundamental glue structuring exotic phases of matter.',
    poster: '/sam.png',
    slidesUrl: '/Everything__Entangled__All_At_Once.pdf',
    slidesName: 'Everything__Entangled__All_At_Once.pdf',
  },
  {
    id: 'talk-10',
    number: '10',
    title: 'Rethinking Cosmic Symmetries: Thurston Spacetimes',
    speaker: 'Raghav Kumawat',
    affiliation: 'Cosmology & Theoretical Physics',
    date: '2025-10-16',
    category: 'Physics',
    tags: ['Cosmology', 'General Relativity', 'Thurston Geometries', 'Spacetime'],
    abstract:
      'Standard FLRW cosmology assumes homogeneous and isotropic 3-manifolds. We unpack the eight Thurston 3-dimensional geometries, spatial topology of our universe, and observational signatures of cosmic topological defects.',
    poster: '/raghav.png',
    slidesUrl: '/Cosmology.pptx',
    slidesName: 'Cosmology.pptx',
  },
  {
    id: 'talk-11',
    number: '11',
    title: 'Mathe(ML)atics: From Proofs to Predictions',
    speaker: 'Vedanshi Vaghela',
    affiliation: 'Mathematics & Machine Learning',
    date: '2025-10-17',
    category: 'Computer Science',
    tags: ['Deep Learning', 'Mathematical Reasoning', 'Graph Neural Nets', 'Automated Proofs'],
    abstract:
      'Can artificial neural networks discover mathematical conjectures or verify formal proofs? An examination of recent breakthroughs bridging algebraic geometry, knot theory, and transformer architectures.',
    poster: '/vvml.png',
    slidesUrl: '/vv.pdf',
    slidesName: 'vv.pdf',
  },
  {
    id: 'talk-12',
    number: '12',
    title: 'Bifurcations and How to Find Them',
    speaker: 'Abeer Singh',
    affiliation: 'Dynamical Systems & Mathematics',
    date: '2025-10-23',
    category: 'Mathematics',
    tags: ['Bifurcation Theory', 'Limit Cycles', 'Hopf Bifurcation', 'Stability'],
    abstract:
      'As a control parameter tunes continuously, a dynamical system can undergo abrupt qualitative transformations. We analyze saddle-node, pitchfork, and Hopf bifurcations, accompanied by live topological phase portraits.',
    poster: '/aber.png',
    slidesUrl: '/talk_14.pdf',
    slidesName: 'talk_14.pdf',
  },
  {
    id: 'talk-13',
    number: '13',
    title: 'The Mathematics of Opinions: How Ideas Spread',
    speaker: 'Aneesh Diwanji',
    affiliation: 'Applied Mathematics & Network Theory',
    date: '2025-10-30',
    category: 'Interdisciplinary',
    tags: ['Agent-Based Models', 'Network Diffusion', 'Social Dynamics', 'Percolation'],
    abstract:
      'Using statistical mechanics and graph percolation to model how consensus, radicalization, and echo chambers emerge organically in social networks. From voter models to bounded-confidence dynamics.',
    poster: '/aneesh.png',
    slidesUrl: '/slides.pdf',
    slidesName: 'slides.pdf',
  },
  {
    id: 'talk-14',
    number: '14',
    title: 'Some Biology: Emergence in Living Systems',
    speaker: 'Pratham Shah',
    affiliation: 'Biological Sciences, 2022 Batch',
    date: '2025-11-14',
    category: 'Biology',
    tags: ['Systems Biology', 'Morphogenesis', 'Pattern Formation', 'Evolution'],
    abstract:
      'Unpacking biological complexity through an interdisciplinary lens: how non-equilibrium thermodynamics, feedback networks, and Turing reaction-diffusion mechanisms give rise to organismal architecture.',
    poster: '/pic',
    slidesUrl: '/Open_board.pdf',
    slidesName: 'Open_board.pdf',
  },
];

// =========================================================
// 5. TEAM & SPEAKERS DIRECTORY
// =========================================================
const TEAM_MEMBERS = [
  {
    name: 'Samriddha Ganguly',
    role: 'Lead Coordinator',
    batch: 'Physics Major • 2022 Batch',
    bio: 'Working on quantum matter, topology, and superconductivity. Dedicated to breaking down disciplinary barriers.',
    email: 'samriddha22@iiserb.ac.in',
    avatar: '/sam.png',
    photos: ['/sam1.jpeg', '/sam2.jpeg', '/sam3.jpeg'],
    isCoordinator: true,
  },
  {
    name: 'Adeetya Choubey',
    role: 'Co-Coordinator',
    batch: 'Mathematics Major • 2022 Batch',
    bio: 'Passionate about combinatorics, probabilistic methods, and algebraic structures.',
    email: 'adeety22@iiserb.ac.in',
    avatar: '/ab.png',
    photos: ['/adixit.png'],
    isCoordinator: true,
  },
  {
    name: 'Sidharth Raman',
    role: 'Speaker & Contributor',
    batch: 'Physics & Dynamical Systems',
    bio: 'Researches chaos, nonlinear mechanics, and strange attractors.',
    avatar: '/raman.png',
    photos: ['/ram1.jpeg', '/ram2.jpeg', '/ram3.jpeg'],
  },
  {
    name: 'Aryan Gupta',
    role: 'Speaker & Contributor',
    batch: 'Chemical Sciences & Computation',
    bio: 'Simulates non-equilibrium reaction networks and stochastic physical chemistry.',
    avatar: '/aryan.png',
    photos: ['/aryan1.jpeg', '/aryan2.jpeg', '/aryan3.jpeg'],
  },
  {
    name: 'Harsh Tandon',
    role: 'Speaker & Contributor',
    batch: 'Pure Mathematics',
    bio: 'Explores real analysis, function spaces, and topological convergence.',
    avatar: '/harsh.png',
    photos: ['/hrh1.jpeg', '/hrh2.jpeg', '/hrh3.jpeg'],
  },
  {
    name: 'Manas Nandan',
    role: 'Speaker & Contributor',
    batch: 'Economics & Game Theory',
    bio: 'Investigates auction design, strategic truth extraction, and decision theory.',
    avatar: '/manaso.png',
    photos: ['/mn1.jpeg', '/mn2.jpeg', '/mn3.jpeg'],
  },
  {
    name: 'Dev Krishna',
    role: 'Speaker & Contributor',
    batch: 'Geometry & Topology',
    bio: 'Enthusiast of hyperbolic spaces, Poincaré disks, and geometric group theory.',
    avatar: '/devp.png',
    photos: ['/dev.png'],
  },
  {
    name: 'Deo Ishaan Prashant',
    role: 'Speaker & Contributor',
    batch: 'Physics & Mathematics',
    bio: 'Fascinated by graph theory, random walks, and electrical network analogies.',
    avatar: '/deo.png',
    photos: ['/ish1.jpeg', '/ish2.jpeg', '/ish3.jpeg'],
  },
  {
    name: 'Raghav Kumawat',
    role: 'Speaker & Contributor',
    batch: 'Cosmology & Astrophysics',
    bio: 'Investigating 3-manifold topologies in spacetime geometry and cosmic topology.',
    avatar: '/raghav.png',
    photos: ['/r1.jpeg', '/r2.jpeg', '/r3.jpeg'],
  },
  {
    name: 'Raj Soni',
    role: 'Speaker & Contributor',
    batch: 'Applied Computing & Mathematics',
    bio: 'Focuses on numerical methods, splines, and computational efficiency.',
    avatar: '/raj.jpeg',
    photos: ['/rj1.jpeg', '/rj2.jpeg'],
  },
  {
    name: 'Vedanshi Vaghela',
    role: 'Speaker & Contributor',
    batch: 'Mathematics & Machine Learning',
    bio: 'Bridges deep learning with pure mathematics and graph representations.',
    avatar: '/vvml.png',
    photos: ['/vv1.jpeg', '/vv2.jpeg', '/vv3.jpeg'],
  },
  {
    name: 'Aneesh Diwanji',
    role: 'Speaker & Contributor',
    batch: 'Applied Mathematics',
    bio: 'Studies opinion percolation and complex agent networks.',
    avatar: '/aneesh.png',
    photos: ['/diwan.png'],
  },
];

// =========================================================
// 6. GALLERY DATA (ALL MEDIA FROM PUBLIC/)
// =========================================================
const GALLERY_ITEMS = [
  { src: '/photo1.jpeg', title: 'OpenBoard In Session', caption: 'Lively whiteboard debate on geometric topology', category: 'Talks' },
  { src: '/photo2.jpeg', title: 'Interactive Audience', caption: 'Cross-department students interrogating models', category: 'Audience' },
  { src: '/photo3.jpeg', title: 'Late-Night Derivations', caption: 'Post-talk whiteboard extensions and discussions', category: 'Whiteboard' },
  { src: '/pic', title: 'Blackboard Blueprint', caption: 'Foundational equations from our very first session', category: 'Whiteboard' },
  { src: '/sam1.jpeg', title: 'Samriddha on Entanglement', caption: 'Demystifying topological order and quantum matter', category: 'Talks' },
  { src: '/sam2.jpeg', title: 'Quantum Phase Transitions', caption: 'Exploring ground state degeneracies on the board', category: 'Talks' },
  { src: '/sam3.jpeg', title: 'Q&A Discussion', caption: 'Deep dialogue with chemistry and math students', category: 'Audience' },
  { src: '/aryan1.jpeg', title: 'Aryan on Stochastic Systems', caption: 'Breaking down chemical master equations', category: 'Talks' },
  { src: '/aryan2.jpeg', title: 'Monte Carlo Steps', caption: 'Live computational visualization of reactions', category: 'Talks' },
  { src: '/aryan3.jpeg', title: 'Reaction Sim Questions', caption: 'Explaining intrinsic biological noise to engineers', category: 'Audience' },
  { src: '/hrh1.jpeg', title: 'Harsh on Limits', caption: 'Tracing pathological sequences of functions', category: 'Talks' },
  { src: '/hrh2.jpeg', title: 'Uniform Continuity Board', caption: 'Epsilon-delta precision meets visual intuition', category: 'Whiteboard' },
  { src: '/hrh3.jpeg', title: 'Analysis Reflections', caption: 'Closing thoughts on Lebesgue integration', category: 'Talks' },
  { src: '/ish1.jpeg', title: 'Ishaan on Random Walks', caption: 'Mapping resistor circuits directly to Brownian motion', category: 'Talks' },
  { src: '/ish2.jpeg', title: 'Voltage vs Probability', caption: 'Harmonic functions on discrete lattices', category: 'Whiteboard' },
  { src: '/ish3.jpeg', title: 'Electrical Analogy Session', caption: 'Engaging participants with hands-on questions', category: 'Audience' },
  { src: '/mn1.jpeg', title: 'Manas on Mechanism Design', caption: 'Formalizing strategic incentives and game theory', category: 'Talks' },
  { src: '/mn2.jpeg', title: 'Truth Extraction Matrix', caption: 'The Revelation Principle explained in 15 minutes', category: 'Whiteboard' },
  { src: '/mn3.jpeg', title: 'Economic Dilemmas', caption: 'Audience participating in a live Vickrey auction', category: 'Audience' },
  { src: '/r1.jpeg', title: 'Raghav on Spacetimes', caption: 'Thurston geometries and cosmic topology', category: 'Talks' },
  { src: '/r2.jpeg', title: 'Metric Tensor Details', caption: 'Symmetries beyond the FLRW standard assumptions', category: 'Whiteboard' },
  { src: '/r3.jpeg', title: 'Astrophysics Dialogue', caption: 'Answering questions regarding topological defects', category: 'Audience' },
  { src: '/rj1.jpeg', title: 'Raj on Interpolations', caption: 'Runge phenomenon and polynomial approximations', category: 'Talks' },
  { src: '/rj2.jpeg', title: 'Spline Curves Board', caption: 'Cubic splines vs Lagrange formulas', category: 'Whiteboard' },
  { src: '/ram1.jpeg', title: 'Sidharth on Chaos', caption: 'Phase space trajectories and the Lorenz attractor', category: 'Talks' },
  { src: '/ram2.jpeg', title: 'Fractal Dimensions', caption: 'Mandelbrot iterations drawn out step-by-step', category: 'Whiteboard' },
  { src: '/ram3.jpeg', title: 'Nonlinear Dynamic Questions', caption: 'Why predictability fails in turbulent regimes', category: 'Audience' },
  { src: '/vv1.jpeg', title: 'Vedanshi on Machine Learning', caption: 'Neural architectures discovering formal proofs', category: 'Talks' },
  { src: '/vv2.jpeg', title: 'Graph Neural Networks', caption: 'Representing mathematical graphs and symmetries', category: 'Whiteboard' },
  { src: '/vv3.jpeg', title: 'AI & Math Discussion', caption: 'Debating machine intuition with mathematicians', category: 'Audience' },
];

// =========================================================
// 7. MAIN APPLICATION COMPONENT
// =========================================================
export default function App() {
  const OPENBOARD_EMAIL = 'openboardinitiative@gmail.com';

  // Theme state
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openboard_theme') || 'dark';
    }
    return 'dark';
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('home');

  // Audio mute state
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openboard_muted') === 'true';
    }
    return false;
  });

  const { playClick, playSuccess, playBookmark } = useSoundEffects(isMuted);

  // Search & Filter state for Archive
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);

  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('openboard_bookmarks');
        return saved ? JSON.parse(saved) : ['talk-9', 'talk-1'];
      } catch (e) {
        return ['talk-9', 'talk-1'];
      }
    }
    return ['talk-9', 'talk-1'];
  });

  // Modals state
  const [activeModalTalk, setActiveModalTalk] = useState(null);
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  // ---------------------------------------------------------
  // 7A. TALK PROPOSAL SUBMISSION FORM STATE
  // ---------------------------------------------------------
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    batchOrAffiliation: '',
    title: '',
    department: 'Physics',
    abstract: '',
    prerequisites: 'Basic undergraduate calculus & linear algebra',
    preferredDate: '',
    tags: 'Interdisciplinary, Theory',
  });
  const [formStatus, setFormStatus] = useState('idle'); // 'idle' | 'drafted'
  const [lastSerialNumber, setLastSerialNumber] = useState('');
  const [proposalDraft, setProposalDraft] = useState({
    subject: '',
    body: '',
    mailtoUrl: '',
    gmailUrl: '',
  });
  const [copiedProposal, setCopiedProposal] = useState(false);

  // ---------------------------------------------------------
  // 7B. SUGGESTIONS & FEEDBACK FORM STATE
  // ---------------------------------------------------------
  const [suggestionState, setSuggestionState] = useState({
    name: '',
    email: '',
    affiliation: '',
    category: 'Topic / Speaker Suggestion',
    topic: '',
    details: '',
  });
  const [suggestionStatus, setSuggestionStatus] = useState('idle'); // 'idle' | 'drafted'
  const [lastSuggestionSerial, setLastSuggestionSerial] = useState('');
  const [suggestionDraft, setSuggestionDraft] = useState({
    subject: '',
    body: '',
    mailtoUrl: '',
    gmailUrl: '',
  });
  const [copiedSuggestion, setCopiedSuggestion] = useState(false);

  // Mobile menu open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync theme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('openboard_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem('openboard_muted', String(next));
    if (!next) {
      setTimeout(() => playClick(), 20);
    }
  };

  const toggleTheme = () => {
    playClick();
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleNavClick = (tab) => {
    playClick();
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleBookmark = (talkId, e) => {
    if (e) e.stopPropagation();
    playBookmark();
    setBookmarkedIds((prev) => {
      const exists = prev.includes(talkId);
      const updated = exists ? prev.filter((id) => id !== talkId) : [...prev, talkId];
      localStorage.setItem('openboard_bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  // Filtered talks calculation
  const categoriesList = ['All', 'Physics', 'Mathematics', 'Computer Science', 'Chemistry', 'Biology', 'Interdisciplinary'];

  const filteredTalks = useMemo(() => {
    return TALKS_DATA.filter((talk) => {
      const matchesSearch =
        talk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        talk.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        talk.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        talk.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'All' || talk.category === selectedCategory;
      const matchesBookmark = !showOnlyBookmarked || bookmarkedIds.includes(talk.id);

      return matchesSearch && matchesCat && matchesBookmark;
    });
  }, [searchQuery, selectedCategory, showOnlyBookmarked, bookmarkedIds]);

  // Generate Sequential + Unique Serial Number (#OB-2026-XXXX)
  const generateSerialNumber = (prefix = 'OB') => {
    let seq = 101;
    try {
      const storageKey = prefix === 'OB-SUG' ? 'openboard_sug_counter' : 'openboard_seq_counter';
      const current = parseInt(localStorage.getItem(storageKey) || '100', 10);
      seq = current + 1;
      localStorage.setItem(storageKey, String(seq));
    } catch (e) {}
    const now = new Date();
    const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${now.getFullYear()}-${mmdd}-${seq}-${rand}`;
  };

  // Helper to construct mailto and Gmail compose URLs
  const createEmailLinks = (to, subject, body) => {
    const encodedSubj = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return {
      mailtoUrl: `mailto:${to}?subject=${encodedSubj}&body=${encodedBody}`,
      gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodedSubj}&body=${encodedBody}`,
    };
  };

  // ---------------------------------------------------------
  // HANDLER 1: TALK PROPOSAL FORM -> DRAFTS PROPER EMAIL TO OPENBOARD GMAIL
  // ---------------------------------------------------------
  const handleSubmitProposal = (e) => {
    e.preventDefault();
    if (
      !formState.name.trim() ||
      !formState.email.trim() ||
      !formState.title.trim() ||
      !formState.abstract.trim()
    ) {
      alert('Please fill out all required fields (Speaker Name, Email, Talk Title, and Abstract) before drafting your submission.');
      return;
    }

    playSuccess();

    const serialNumber = generateSerialNumber('OB');
    setLastSerialNumber(serialNumber);
    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const subject = `[Submission #${serialNumber}] OpenBoard Talk Proposal: ${formState.title.trim()}`;
    const body = [
      `Dear OpenBoard Coordinators,`,
      ``,
      `I would like to submit a talk proposal for an upcoming OpenBoard session at IISER Bhopal. Please find the complete details of my proposed talk below:`,
      ``,
      `==================================================`,
      `OPENBOARD TALK PROPOSAL SUBMISSION`,
      `==================================================`,
      `• Submission Tag     : [Submission]`,
      `• Serial Number      : #${serialNumber}`,
      `• Timestamp (IST)    : ${submittedAt}`,
      ``,
      `--- SPEAKER DETAILS ---`,
      `• Speaker Name       : ${formState.name.trim()}`,
      `• Speaker Email      : ${formState.email.trim()}`,
      `• Batch / Affiliation: ${formState.batchOrAffiliation.trim() || 'IISER Bhopal Student'}`,
      `• Academic Discipline: ${formState.department}`,
      ``,
      `--- TALK DETAILS ---`,
      `• Talk Title         : ${formState.title.trim()}`,
      `• Preferred Date     : ${formState.preferredDate || 'Flexible / Next Available Slot'}`,
      `• Prerequisites      : ${formState.prerequisites.trim() || 'None (Accessible to all disciplines)'}`,
      `• Topic Tags         : ${formState.tags.trim() || 'Interdisciplinary'}`,
      ``,
      `--- ABSTRACT & PEDAGOGICAL HOOK ---`,
      `${formState.abstract.trim()}`,
      `==================================================`,
      ``,
      `Looking forward to discussing this further!`,
      ``,
      `Best regards,`,
      `${formState.name.trim()}`,
      `${formState.email.trim()}`,
    ].join('\n');

    const { mailtoUrl, gmailUrl } = createEmailLinks(OPENBOARD_EMAIL, subject, body);

    setProposalDraft({
      subject,
      body,
      mailtoUrl,
      gmailUrl,
    });
    setFormStatus('drafted');

    // Open the user's default mail client with the complete pre-filled draft ready to review & send
    window.location.href = mailtoUrl;
  };

  // ---------------------------------------------------------
  // HANDLER 2: SUGGESTION FORM -> DRAFTS PROPER EMAIL TO OPENBOARD GMAIL
  // ---------------------------------------------------------
  const handleSubmitSuggestion = (e) => {
    e.preventDefault();
    if (
      !suggestionState.name.trim() ||
      !suggestionState.email.trim() ||
      !suggestionState.topic.trim() ||
      !suggestionState.details.trim()
    ) {
      alert('Please fill out all required fields (Your Name, Email, Subject/Topic, and Suggestion Details) before drafting your email.');
      return;
    }

    playSuccess();

    const suggestionSerial = generateSerialNumber('OB-SUG');
    setLastSuggestionSerial(suggestionSerial);
    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const subject = `[Suggestion #${suggestionSerial}] OpenBoard (${suggestionState.category}): ${suggestionState.topic.trim()}`;
    const body = [
      `Dear OpenBoard Coordinators,`,
      ``,
      `I am writing to share a suggestion / feedback for the OpenBoard initiative at IISER Bhopal. Here are the complete details:`,
      ``,
      `==================================================`,
      `OPENBOARD SUGGESTION & FEEDBACK DISPATCH`,
      `==================================================`,
      `• Dispatch Tag       : [Suggestion]`,
      `• Reference ID       : #${suggestionSerial}`,
      `• Category           : ${suggestionState.category}`,
      `• Timestamp (IST)    : ${submittedAt}`,
      ``,
      `--- SENDER DETAILS ---`,
      `• Name               : ${suggestionState.name.trim()}`,
      `• Email              : ${suggestionState.email.trim()}`,
      `• Batch / Affiliation: ${suggestionState.affiliation.trim() || 'IISER Bhopal Community'}`,
      ``,
      `--- SUGGESTION / TOPIC SUMMARY ---`,
      `• Topic / Subject    : ${suggestionState.topic.trim()}`,
      ``,
      `--- DETAILED MESSAGE & SUGGESTION ---`,
      `${suggestionState.details.trim()}`,
      `==================================================`,
      ``,
      `Best regards,`,
      `${suggestionState.name.trim()}`,
      `${suggestionState.email.trim()}`,
    ].join('\n');

    const { mailtoUrl, gmailUrl } = createEmailLinks(OPENBOARD_EMAIL, subject, body);

    setSuggestionDraft({
      subject,
      body,
      mailtoUrl,
      gmailUrl,
    });
    setSuggestionStatus('drafted');

    // Open the user's default mail client with the complete pre-filled suggestion draft ready to review & send
    window.location.href = mailtoUrl;
  };

  const handleCopyText = (text, setCopiedFlag) => {
    playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedFlag(true);
      setTimeout(() => setCopiedFlag(false), 2500);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={cx(
        'min-h-screen relative font-mono transition-colors duration-500 selection:bg-[#00ff9d]/30 selection:text-[#00ff9d]',
        isDark ? 'text-[#e6edf3]' : 'text-[#0f172a]'
      )}
    >
      {/* Fixed Bottom-Most Solid Backdrop so Background Animation at z-0 is ALWAYS Visible */}
      <div
        className={cx(
          'fixed inset-0 -z-20 transition-colors duration-500',
          isDark ? 'bg-[#080c11]' : 'bg-[#f4f7fa]'
        )}
      />

      {/* Self-contained CSS for Python syntax highlighting, terminal cursors & glowing borders */}
      <style>{`
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .blinking-cursor {
          animation: blinkCursor 1s step-start infinite;
        }
        @keyframes neonPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(0, 255, 157, 0.25), inset 0 0 15px rgba(0, 255, 157, 0.05); }
          50% { box-shadow: 0 0 30px rgba(0, 255, 157, 0.45), inset 0 0 20px rgba(0, 255, 157, 0.12); }
        }
        .neon-glow-box {
          animation: neonPulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Interactive Pixel Matrix + 3D Constellation Background (z-0, always visible) */}
      <BackgroundAnimation theme={theme} />

      {/* Interactive Roaming Pixel Animal Companion (Unique mascot per tab, walks & follows mouse) */}
      <PixelCompanion activeTab={activeTab} onPetSound={playBookmark} />

      {/* Neon Atmospheric Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={cx(
            'absolute -top-32 left-1/3 w-[600px] h-[380px] rounded-full blur-[160px] opacity-20 transition-all duration-1000',
            isDark ? 'bg-[#00ff9d]/25' : 'bg-emerald-300/30'
          )}
        />
        <div
          className={cx(
            'absolute top-1/2 -right-40 w-[500px] h-[420px] rounded-full blur-[180px] opacity-20',
            isDark ? 'bg-[#b33973]/25' : 'bg-pink-300/20'
          )}
        />
      </div>

      {/* ========================================================= */}
      {/* FLOATING RETRO-CODER NAVIGATION BAR                       */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 px-3 sm:px-6 py-3 transition-all">
        <div
          className={cx(
            'max-w-7xl mx-auto rounded-2xl px-4 sm:px-6 py-2.5 flex items-center justify-between border backdrop-blur-xl shadow-2xl transition-all duration-300',
            isDark
              ? 'bg-[#121720]/85 border-[#30363d] shadow-[0_4px_25px_rgba(0,0,0,0.5)]'
              : 'bg-white/85 border-[#d0d7de] shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
          )}
        >
          {/* Brand Logo with Python Identifier Styling */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center p-1 group-hover:border-[#00ff9d] transition-colors shadow-inner">
              <span className="text-[#00ff9d] text-xs font-bold font-mono">&gt;_</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[#f43f5e] font-extrabold text-base sm:text-lg tracking-tight">open_</span>
                <span className="text-[#00ff9d] font-extrabold text-base sm:text-lg tracking-tight">board</span>
                <span className="text-[#00ff9d] text-xs blinking-cursor">█</span>
              </div>
              <span className="text-[9px] tracking-widest uppercase text-zinc-400 font-mono hidden sm:inline">
                ~/iiserb/pedagogical_initiative
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 text-xs">
            {[
              { id: 'home', label: '00 // HOME' },
              { id: 'about', label: '01 // ABOUT' },
              { id: 'archive', label: '02 // ARCHIVE' },
              { id: 'gallery', label: '03 // GALLERY' },
              { id: 'events', label: '04 // EVENTS' },
              { id: 'submit', label: '05 // PROPOSE' },
              { id: 'contact', label: '06 // CONTACT' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavClick(tab.id)}
                  className={cx(
                    'px-3 py-1.5 rounded-lg font-mono tracking-wider transition-all duration-200',
                    isActive
                      ? isDark
                        ? 'text-[#00ff9d] bg-[#00ff9d]/10 border border-[#00ff9d]/40 shadow-[0_0_12px_rgba(0,255,157,0.25)]'
                        : 'text-[#047857] bg-emerald-50 border border-emerald-300 font-bold'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#21262d]'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Controls: Audio Synth Mute + Theme Switch */}
          <div className="flex items-center gap-2">
            {/* Active Mascot Indicator Badge */}
            <div
              onClick={playBookmark}
              title="Your page companion! Move mouse or click the pixel pet floating on screen."
              className={cx(
                'hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] border cursor-pointer transition-all',
                isDark
                  ? 'bg-[#0d1117]/80 border-[#30363d] text-[#00ff9d] hover:border-[#00ff9d]'
                  : 'bg-zinc-100 border-zinc-300 text-emerald-700'
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-ping" />
              <span>{(MASCOT_SPECIES[activeTab] || MASCOT_SPECIES.home).name}</span>
            </div>

            {/* Web Audio Synth Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio Synthesizer' : 'Mute Audio Synthesizer'}
              className={cx(
                'px-2.5 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1 font-mono',
                isDark
                  ? 'bg-[#21262d] border-[#30363d] text-zinc-200 hover:border-[#00ff9d] hover:text-[#00ff9d]'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:border-emerald-500'
              )}
            >
              <span>{isMuted ? '🔇' : '🔊'}</span>
              <span className="hidden sm:inline text-[10px] font-bold">{isMuted ? 'MUTED' : 'SFX ON'}</span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              className={cx(
                'px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all',
                isDark
                  ? 'bg-[#21262d] border-[#30363d] text-[#eab308] hover:border-[#eab308]'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:border-zinc-400'
              )}
            >
              {isDark ? 'LIGHT' : 'DARK'}
            </button>

            {/* Mobile Drawer Button */}
            <button
              onClick={() => {
                playClick();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="lg:hidden p-2 rounded-lg border border-[#30363d] text-zinc-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {isMobileMenuOpen && (
          <div
            className={cx(
              'lg:hidden mt-2 p-4 rounded-2xl border backdrop-blur-2xl shadow-2xl flex flex-col gap-1.5 transition-all text-xs font-mono',
              isDark ? 'bg-[#161b22]/95 border-[#30363d]' : 'bg-white/95 border-zinc-200'
            )}
          >
            {[
              { id: 'home', label: '00 // HOME' },
              { id: 'about', label: '01 // ABOUT' },
              { id: 'archive', label: '02 // ARCHIVE' },
              { id: 'gallery', label: '03 // GALLERY' },
              { id: 'events', label: '04 // EVENTS' },
              { id: 'submit', label: '05 // PROPOSE TALK' },
              { id: 'contact', label: '06 // CONTACT & SUGGESTIONS' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleNavClick(tab.id)}
                className={cx(
                  'px-3 py-2 rounded-lg text-left tracking-wider transition-all',
                  activeTab === tab.id
                    ? 'bg-[#00ff9d]/15 text-[#00ff9d] border border-[#00ff9d]/30 font-bold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#21262d]'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTENT CONTAINER (z-10 above background canvas)     */}
      {/* ========================================================= */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* ----------------------------------------------------- */}
        {/* VIEW 0: HOME — PYTHON REPL & MISSION TERMINAL         */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'home' && (
          <div className="space-y-16 sm:space-y-24">
            {/* Top Interactive Hero Split: Terminal Python Window + Live Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Python Terminal Code Window */}
              <div className="lg:col-span-7">
                <div
                  className={cx(
                    'rounded-2xl border overflow-hidden shadow-2xl backdrop-blur-xl transition-all duration-300',
                    isDark
                      ? 'bg-[#0d1117]/85 border-[#30363d] shadow-[0_0_35px_rgba(0,255,157,0.08)]'
                      : 'bg-white/90 border-[#d0d7de] shadow-xl'
                  )}
                >
                  {/* macOS / Linux Terminal Window Bar */}
                  <div
                    className={cx(
                      'px-4 py-3 flex items-center justify-between border-b select-none',
                      isDark ? 'bg-[#161b22]/90 border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
                      <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
                      <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
                    </div>
                    <span className="text-xs font-mono text-zinc-400 font-semibold tracking-wide">
                      open_board — mission.py
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">Python 3.12</span>
                  </div>

                  {/* Terminal Code Content with Full Python Syntax Coloring */}
                  <div className="p-5 sm:p-7 text-xs sm:text-sm leading-relaxed overflow-x-auto font-mono">
                    <p className="text-zinc-500 mb-2"># -*- coding: utf-8 -*-</p>
                    <p className="text-zinc-500 mb-3">
                      # OpenBoard: An interdisciplinary pedagogical initiative at IISER Bhopal
                    </p>

                    <p className="text-[#ec4899] font-bold">
                      from <span className="text-[#38bdf8]">human_curiosity</span>{' '}
                      <span className="text-[#ec4899]">import</span> unconstrained_learning
                    </p>
                    <p className="text-[#ec4899] font-bold mb-4">
                      import <span className="text-[#38bdf8]">mathematics, physics, biology, chemistry, cs</span>
                    </p>

                    <p>
                      <span className="text-[#ec4899] font-bold">class</span>{' '}
                      <span className="text-[#00ff9d] font-bold">OpenBoard</span>:
                    </p>
                    <p className="pl-4 text-[#eab308]">
                      """
                      <br />
                      Breaking down academic silos. A peer-to-peer forum where
                      <br />
                      students explain cutting-edge research to non-specialists.
                      <br />
                      """
                    </p>

                    <div className="pl-4 my-3">
                      <p>
                        <span className="text-[#ec4899] font-bold">def</span>{' '}
                        <span className="text-[#00ff9d] font-bold">ignite_curiosity</span>(
                        <span className="text-[#f97316]">self</span>):
                      </p>
                      <p className="pl-4 text-zinc-400">
                        mission = <span className="text-[#fde047]">"Traverse the vast landscape of knowledge"</span>
                      </p>
                      <p className="pl-4 text-zinc-400">
                        format = <span className="text-[#fde047]">"30-45 min blackboard & slide sessions"</span>
                      </p>
                      <p className="pl-4 text-zinc-400">
                        venue = <span className="text-[#fde047]">"L-8, Lecture Hall Complex, IISER Bhopal"</span>
                      </p>
                      <p className="pl-4 text-[#ec4899] font-bold mt-1">
                        return <span className="text-[#00ff9d] font-semibold">True</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#30363d]/60 text-zinc-400">
                      <p className="flex items-center gap-1.5">
                        <span className="text-[#00ff9d] font-bold">&gt;&gt;&gt;</span>
                        <span>ob = OpenBoard()</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="text-[#00ff9d] font-bold">&gt;&gt;&gt;</span>
                        <span>ob.ignite_curiosity()</span>
                      </p>
                      <p className="text-[#00ff9d] font-bold mt-1 flex items-center gap-1">
                        <span>[SESSION ACTIVE] Curiosity ignited. Welcome to OpenBoard.</span>
                        <span className="blinking-cursor">█</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Proposition, Serifs & Action CTAs */}
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00ff9d]/15 text-[#00ff9d] border border-[#00ff9d]/30">
                  <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-ping" />
                  <span>00 // INITIATIVE OVERVIEW</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  <span className="text-[#f43f5e]">open_</span>
                  <span className="text-[#00ff9d]">board</span>
                  <br />
                  <span className="font-serif italic text-2xl sm:text-3xl font-normal text-zinc-300">
                    Open Knowledge, Shared Insights.
                  </span>
                </h1>

                <p
                  className={cx(
                    'text-xs sm:text-sm leading-relaxed font-sans',
                    isDark ? 'text-zinc-300' : 'text-zinc-700'
                  )}
                >
                  A community fueled by curiosity. A space where a future historian explores neural representations, an
                  aspiring chemist appreciates topological invariants, and an artist understands mathematical rigor.
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => handleNavClick('archive')}
                    className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.4)] hover:shadow-[0_0_30px_rgba(0,255,157,0.6)] hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                  >
                    <span>EXPLORE ARCHIVE</span>
                    <span>↗</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('submit')}
                    className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider border border-[#f43f5e] text-[#f43f5e] hover:bg-[#f43f5e]/10 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
                  >
                    <span>SUBMIT AN ABSTRACT</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Quick Coordinator Info */}
                <div className="pt-4 border-t border-[#30363d] flex items-center gap-3 text-xs text-zinc-400">
                  <span className="text-[#00ff9d]">❖</span>
                  <span>Coordinated by Samriddha Ganguly & Adeetya Choubey</span>
                </div>
              </div>
            </div>

            {/* 4-Column Live Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { number: '14+', label: 'Delivered Talks', doc: 'Full slide decks archived' },
                { number: '06+', label: 'Disciplines', doc: 'Math, Phys, Chem, Bio, CS' },
                { number: '100%', label: 'Open Access', doc: 'Unrestricted notes & code' },
                { number: 'L-8', label: 'LHC Venue', doc: 'IISER Bhopal Campus' },
              ].map((m, idx) => (
                <div
                  key={idx}
                  onClick={playClick}
                  className={cx(
                    'p-5 rounded-2xl border backdrop-blur-md transition-all hover:border-[#00ff9d]/50 group cursor-pointer',
                    isDark ? 'bg-[#161b22]/75 border-[#30363d]' : 'bg-white/85 border-[#d0d7de]'
                  )}
                >
                  <div className="text-3xl font-extrabold text-[#00ff9d] font-mono group-hover:scale-105 transition-transform">
                    {m.number}
                  </div>
                  <div className="text-xs font-bold tracking-wider mt-1">{m.label}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{m.doc}</div>
                </div>
              ))}
            </div>

            {/* Featured Talk Spotlight (Samriddha Ganguly's Entanglement Lecture) */}
            <div
              className={cx(
                'rounded-3xl border backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center transition-all hover:border-[#00ff9d]/40 shadow-2xl relative overflow-hidden',
                isDark ? 'bg-[#161b22]/80 border-[#30363d]' : 'bg-white/90 border-[#d0d7de]'
              )}
            >
              <div className="relative w-full md:w-80 h-64 md:h-80 rounded-2xl overflow-hidden flex-shrink-0 border border-[#00ff9d]/40 group shadow-lg">
                <img
                  src="/sam.png"
                  alt="Featured Speaker Samriddha Ganguly"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = '/sam1.jpeg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/80 text-[#00ff9d] text-xs font-bold border border-[#00ff9d]/50">
                  FEATURED TALK #09
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 font-mono">
                  <span className="text-[#38bdf8]">Physics & Topology</span>
                  <span>2025-10-09</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#f43f5e] font-bold">09 // TOPOLOGY & QUANTUM PHASES</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-xs text-zinc-400">IISER Bhopal</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Everything Entangled All at Once
                </h3>
                <p className="text-xs font-mono text-[#00ff9d]">Speaker: Samriddha Ganguly (Physics Major, 2022 Batch)</p>

                <p
                  className={cx(
                    'text-xs sm:text-sm font-sans leading-relaxed',
                    isDark ? 'text-zinc-300' : 'text-zinc-700'
                  )}
                >
                  Beyond classical Landau paradigm of symmetry breaking lies the realm of topological order and quantum
                  matter. We explore how quantum entanglement ceases to be just an EPR paradox and becomes the
                  fundamental glue structuring exotic phases of matter.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {['Quantum Matter', 'Entanglement Entropy', 'Topology', 'Quantum Information'].map((tg) => (
                    <span
                      key={tg}
                      className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-[#21262d] text-zinc-300 border border-[#30363d]"
                    >
                      #{tg}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <a
                    href="/Everything__Entangled__All_At_Once.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={playClick}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#00ff9d] text-black hover:bg-[#34d399] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                  >
                    <span>📄 DOWNLOAD SLIDES (PDF)</span>
                  </a>
                  <button
                    onClick={() => {
                      playClick();
                      setActiveModalTalk(TALKS_DATA[8]);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-mono border border-[#30363d] hover:border-[#00ff9d] hover:text-[#00ff9d] transition-all"
                  >
                    VIEW NOTES & ABSTRACT
                  </button>
                </div>
              </div>
            </div>

            {/* How It Works (3 Pillars) */}
            <div className="space-y-6">
              <div className="text-left">
                <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">Structure</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  How <span className="font-serif italic font-normal">It Works</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: '01 // PROPOSE',
                    title: 'Submit An Idea',
                    desc: 'Any student can propose a talk. No prerequisite for finished research—just a curious idea, theorem, or experimental insight you wish to share.',
                  },
                  {
                    step: '02 // PREPARE',
                    title: 'Pedagogical Polish',
                    desc: 'Our coordinators collaborate with you to ensure your talk uses intuitive geometric hooks, zero gratuitous jargon, and clean slides.',
                  },
                  {
                    step: '03 // PRESENT',
                    title: 'Blackboard & Dialogue',
                    desc: 'Deliver a 30-45 minute interactive session in LHC Room L-8 with rigorous derivations, followed by an open audience Q&A.',
                  },
                ].map((pillar, i) => (
                  <div
                    key={i}
                    onClick={playClick}
                    className={cx(
                      'p-6 rounded-2xl border backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#00ff9d]/50 shadow-lg cursor-pointer',
                      isDark ? 'bg-[#161b22]/75 border-[#30363d]' : 'bg-white/85 border-[#d0d7de]'
                    )}
                  >
                    <div className="text-xs font-mono text-[#f43f5e] font-bold mb-2">{pillar.step}</div>
                    <h3 className="text-lg font-bold tracking-tight">{pillar.title}</h3>
                    <p
                      className={cx(
                        'text-xs font-sans mt-2 leading-relaxed',
                        isDark ? 'text-zinc-400' : 'text-zinc-600'
                      )}
                    >
                      {pillar.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 1: ABOUT — MISSION, LEADERSHIP & VISION          */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'about' && (
          <div className="space-y-16">
            <div className="text-left max-w-3xl">
              <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">
                01 // PEDAGOGY & LEADERSHIP
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-1">
                About{' '}
                <span className="text-[#f43f5e]">open_</span>
                <span className="text-[#00ff9d]">board</span>
              </h2>
              <p
                className={cx(
                  'mt-3 text-sm sm:text-base font-sans leading-relaxed',
                  isDark ? 'text-zinc-300' : 'text-zinc-700'
                )}
              >
                Founded at the Indian Institute of Science Education and Research, Bhopal (IISERB) as a peer-led
                forum for genuine interdisciplinary discourse.
              </p>
            </div>

            {/* Mission & Vision Twin Code Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className={cx(
                  'p-6 sm:p-8 rounded-2xl border backdrop-blur-xl relative overflow-hidden transition-all hover:border-[#00ff9d]/50 shadow-xl',
                  isDark ? 'bg-[#161b22]/80 border-[#30363d]' : 'bg-white/90 border-[#d0d7de]'
                )}
              >
                <div className="text-xs font-mono text-[#00ff9d] font-bold mb-2">&gt; def our_mission():</div>
                <h3 className="text-xl font-bold tracking-tight mb-3">Breaking Down Academic Silos</h3>
                <p
                  className={cx(
                    'text-xs sm:text-sm font-sans leading-relaxed',
                    isDark ? 'text-zinc-300' : 'text-zinc-700'
                  )}
                >
                  open_board is a peer-to-peer knowledge-sharing platform designed to break down academic silos. Our
                  mission is to create a space where students from any field can present their passion projects and
                  research in a way that is accessible and engaging to a non-specialist audience.
                </p>
              </div>

              <div
                className={cx(
                  'p-6 sm:p-8 rounded-2xl border backdrop-blur-xl relative overflow-hidden transition-all hover:border-[#f43f5e]/50 shadow-xl',
                  isDark ? 'bg-[#161b22]/80 border-[#30363d]' : 'bg-white/90 border-[#d0d7de]'
                )}
              >
                <div className="text-xs font-mono text-[#f43f5e] font-bold mb-2">&gt; def the_vision():</div>
                <h3 className="text-xl font-bold tracking-tight mb-3">Curiosity Over Compartmentalization</h3>
                <p
                  className={cx(
                    'text-xs sm:text-sm font-sans leading-relaxed',
                    isDark ? 'text-zinc-300' : 'text-zinc-700'
                  )}
                >
                  We envision a community fueled by curiosity. A place where a future historian can learn about machine
                  learning, a budding chemist can appreciate poetic structures, and an aspiring artist can understand
                  the elegance of a mathematical theorem.
                </p>
              </div>
            </div>

            {/* Coordinators Section */}
            <div className="space-y-6">
              <div className="text-left">
                <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">Coordinators</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Founding Organizers</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                {TEAM_MEMBERS.filter((m) => m.isCoordinator).map((person, idx) => (
                  <div
                    key={idx}
                    className={cx(
                      'p-6 rounded-2xl border backdrop-blur-xl flex flex-col sm:flex-row items-center sm:items-start gap-5 transition-all hover:border-[#00ff9d]/50 hover:shadow-xl group',
                      isDark ? 'bg-[#161b22]/80 border-[#30363d]' : 'bg-white/90 border-[#d0d7de]'
                    )}
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-[#00ff9d]/40 shadow-md">
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.src = person.photos[0] || '/photo1.jpeg';
                        }}
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00ff9d]/15 text-[#00ff9d] border border-[#00ff9d]/30">
                        {person.role}
                      </span>
                      <h4 className="text-lg font-bold mt-1.5">{person.name}</h4>
                      <p className="text-xs font-mono text-zinc-400">{person.batch}</p>
                      <p
                        className={cx(
                          'text-xs font-sans mt-2 leading-relaxed',
                          isDark ? 'text-zinc-300' : 'text-zinc-600'
                        )}
                      >
                        {person.bio}
                      </p>
                      <a
                        href={`mailto:${person.email}`}
                        className="inline-flex items-center gap-1 text-xs font-mono text-[#00ff9d] hover:underline mt-3"
                      >
                        ✉ {person.email}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contributing Speakers */}
            <div className="space-y-6">
              <div className="text-left">
                <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">Network</span>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">Contributing Speakers</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {TEAM_MEMBERS.filter((m) => !m.isCoordinator).map((speaker, idx) => (
                  <div
                    key={idx}
                    onClick={playClick}
                    className={cx(
                      'p-4 rounded-xl border backdrop-blur-md flex flex-col items-center text-center transition-all hover:border-[#00ff9d]/40 cursor-pointer',
                      isDark ? 'bg-[#161b22]/65 border-[#30363d]' : 'bg-white/85 border-[#d0d7de]'
                    )}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden mb-2.5 border border-[#00ff9d]/40 shadow-sm">
                      <img
                        src={speaker.avatar}
                        alt={speaker.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = speaker.photos[0] || '/photo1.jpeg';
                        }}
                      />
                    </div>
                    <div className="font-bold text-xs">{speaker.name}</div>
                    <div className="text-[10px] font-mono text-[#00ff9d] mt-0.5">{speaker.batch}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 2: ARCHIVE — TALKS REPOSITORY & SLIDES           */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'archive' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">
                  02 // REPOSITORY
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">Talks & Papers Archive</h2>
                <p className={cx('text-xs sm:text-sm mt-1', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                  All 14 delivered lectures with slides (PDF/PPTX), abstracts, and speaker notes.
                </p>
              </div>

              <button
                onClick={() => {
                  playClick();
                  setShowOnlyBookmarked(!showOnlyBookmarked);
                }}
                className={cx(
                  'px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-2 self-start md:self-auto',
                  showOnlyBookmarked
                    ? 'bg-[#f43f5e]/20 text-[#f43f5e] border-[#f43f5e]'
                    : isDark
                    ? 'bg-[#161b22] border-[#30363d] text-zinc-400 hover:text-zinc-100'
                    : 'bg-white border-zinc-300 text-zinc-700'
                )}
              >
                <span>{showOnlyBookmarked ? '♥ SAVED ONLY' : '♡ FILTER SAVED'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#21262d] text-zinc-200">
                  {bookmarkedIds.length}
                </span>
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search talks, speakers, topics (e.g. 'Entanglement', 'Chaos', 'Analysis')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cx(
                  'w-full px-5 py-3 pl-11 rounded-xl text-xs sm:text-sm font-mono border outline-none transition-all',
                  isDark
                    ? 'bg-[#161b22]/90 border-[#30363d] text-zinc-100 placeholder-zinc-500 focus:border-[#00ff9d] focus:shadow-[0_0_15px_rgba(0,255,157,0.2)]'
                    : 'bg-white border-[#d0d7de] text-zinc-900 placeholder-zinc-400 focus:border-emerald-500'
                )}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">&gt;</span>
              {searchQuery && (
                <button
                  onClick={() => {
                    playClick();
                    setSearchQuery('');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 hover:text-white"
                >
                  CLEAR
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categoriesList.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => {
                      playClick();
                      setSelectedCategory(category);
                    }}
                    className={cx(
                      'px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all',
                      isSelected
                        ? 'bg-[#00ff9d] text-black font-bold shadow-[0_0_12px_rgba(0,255,157,0.3)]'
                        : isDark
                        ? 'bg-[#161b22]/90 border border-[#30363d] text-zinc-400 hover:text-zinc-200'
                        : 'bg-white border border-[#d0d7de] text-zinc-600'
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Talk Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTalks.map((talk) => {
                const isBookmarked = bookmarkedIds.includes(talk.id);
                return (
                  <div
                    key={talk.id}
                    onClick={() => {
                      playClick();
                      setActiveModalTalk(talk);
                    }}
                    className={cx(
                      'group rounded-2xl border backdrop-blur-xl p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer hover:-translate-y-1 relative overflow-hidden',
                      isDark
                        ? 'bg-[#161b22]/85 border-[#30363d] hover:border-[#00ff9d]/50 hover:shadow-[0_0_25px_rgba(0,255,157,0.15)]'
                        : 'bg-white/90 border-[#d0d7de] hover:border-emerald-500 hover:shadow-xl'
                    )}
                  >
                    {/* Poster */}
                    <div className="relative w-full h-44 rounded-xl overflow-hidden mb-4 bg-[#0d1117] border border-[#30363d]/60">
                      <img
                        src={talk.poster}
                        alt={talk.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = '/photo1.jpeg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-[#00ff9d] border border-[#00ff9d]/50">
                        #{talk.number}
                      </div>

                      <button
                        onClick={(e) => handleToggleBookmark(talk.id, e)}
                        className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/70 border border-white/20 text-xs hover:scale-110 transition-transform"
                      >
                        {isBookmarked ? '❤️' : '🤍'}
                      </button>

                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-300">
                        <span className="text-[#00ff9d]">{talk.category}</span>
                        <span>{talk.date}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-base group-hover:text-[#00ff9d] transition-colors leading-snug">
                          {talk.title}
                        </h3>
                        <div className="text-xs font-mono text-zinc-400 mt-1">{talk.speaker}</div>
                        <p
                          className={cx(
                            'text-xs font-sans mt-2 line-clamp-3 leading-relaxed',
                            isDark ? 'text-zinc-400' : 'text-zinc-600'
                          )}
                        >
                          {talk.abstract}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="pt-3 border-t border-[#30363d]/70 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {talk.tags.slice(0, 2).map((tg) => (
                            <span
                              key={tg}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-zinc-300"
                            >
                              {tg}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          {talk.slidesUrl && (
                            <a
                              href={talk.slidesUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                playClick();
                              }}
                              className="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/40 hover:bg-[#00ff9d] hover:text-black transition-all"
                            >
                              SLIDES
                            </a>
                          )}
                          <span className="text-xs text-zinc-500 group-hover:text-[#00ff9d]">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 3: GALLERY — ALL PHOTOS FROM PUBLIC/             */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <div className="text-left max-w-2xl">
              <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">
                03 // VISUAL ARCHIVE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">Sessions & Blackboard Notes</h2>
              <p className={cx('text-xs sm:text-sm mt-1', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                Photographic log of peer presentations, live derivations, and audience debates in Room L-8, LHC.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {GALLERY_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    playClick();
                    setActiveLightboxImg(item);
                  }}
                  className={cx(
                    'group relative rounded-xl overflow-hidden border backdrop-blur-md cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-[#00ff9d]/50',
                    isDark ? 'bg-[#161b22]/85 border-[#30363d]' : 'bg-white border-[#d0d7de]'
                  )}
                >
                  <div className="w-full h-52 bg-[#0d1117] overflow-hidden">
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = '/photo1.jpeg';
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <span className="text-[10px] font-mono text-[#00ff9d] uppercase">{item.category}</span>
                    <h4 className="font-bold text-xs text-white">{item.title}</h4>
                    <p className="text-[11px] text-zinc-300 line-clamp-2 mt-0.5">{item.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 4: EVENTS — UPCOMING SESSIONS                    */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'events' && (
          <div className="space-y-8">
            <div className="text-left max-w-2xl">
              <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">
                04 // SCHEDULE
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">Upcoming Talks</h2>
              <p className={cx('text-xs sm:text-sm mt-1', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                Held weekly in Room L-8, Lecture Hall Complex (LHC), IISER Bhopal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
              {[
                {
                  id: 'evt-14',
                  title: 'Some Biology: Emergence & Pattern Formation',
                  speaker: 'Pratham Shah',
                  batch: 'Biological Sciences, 2022 Batch',
                  date: '2025-11-14',
                  time: '18:00 IST',
                  venue: 'Room L-8, LHC, IISER Bhopal',
                  desc: 'How biological order self-assembles from molecular chaos. A look at reaction-diffusion equations and Turing patterns.',
                },
                {
                  id: 'evt-15',
                  title: 'Quantum Advantage in Many-Body Simulation',
                  speaker: 'Open Call / Guest Researcher',
                  batch: 'Physics & Computer Science',
                  date: '2025-11-21',
                  time: '18:00 IST',
                  venue: 'Room L-8, LHC, IISER Bhopal',
                  desc: 'Can noisy intermediate-scale quantum processors outperform classical tensor networks on strongly correlated lattices?',
                },
              ].map((evt) => (
                <div
                  key={evt.id}
                  className={cx(
                    'p-6 sm:p-8 rounded-2xl border backdrop-blur-xl flex flex-col justify-between transition-all hover:border-[#00ff9d]/50 shadow-xl',
                    isDark ? 'bg-[#161b22]/85 border-[#30363d]' : 'bg-white/90 border-[#d0d7de]'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2.5 py-0.5 rounded bg-[#00ff9d]/20 text-[#00ff9d] border border-[#00ff9d]/40 font-bold">
                        SCHEDULED
                      </span>
                      <span className="text-zinc-400">{evt.date}</span>
                    </div>

                    <h3 className="text-xl font-bold tracking-tight">{evt.title}</h3>
                    <p className="text-xs font-mono text-[#00ff9d]">
                      {evt.speaker} • {evt.batch}
                    </p>
                    <p
                      className={cx(
                        'text-xs font-sans leading-relaxed',
                        isDark ? 'text-zinc-300' : 'text-zinc-700'
                      )}
                    >
                      {evt.desc}
                    </p>

                    <div className="p-3.5 rounded-xl bg-[#0d1117]/60 border border-[#30363d] text-xs font-mono space-y-1 text-zinc-300">
                      <div>📍 {evt.venue}</div>
                      <div>⏰ {evt.time}</div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#30363d] flex items-center justify-between">
                    <button
                      onClick={() => {
                        playSuccess();
                        alert(`RSVP confirmed for "${evt.title}". See you at ${evt.venue}!`);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#00ff9d] text-black hover:bg-[#34d399] transition-all"
                    >
                      RSVP FOR TALK
                    </button>
                    <button
                      onClick={() => {
                        playClick();
                        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                          `OpenBoard: ${evt.title}`
                        )}&dates=20251114T123000Z/20251114T133000Z&location=${encodeURIComponent(evt.venue)}`;
                        window.open(gcalUrl, '_blank');
                      }}
                      className="text-xs font-mono text-zinc-400 hover:text-[#00ff9d]"
                    >
                      📅 Add to Calendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 5: PROPOSE — FORM -> DRAFT EMAIL TO OPENBOARD    */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'submit' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-left">
              <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">
                05 // CALL FOR SPEAKERS
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">Propose Your Talk</h2>
              <p className={cx('text-xs sm:text-sm mt-1 leading-relaxed', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                Fill out the proposal form below first. Upon clicking draft, a complete email with your unique{' '}
                <span className="text-[#00ff9d] font-bold">#OB-2026</span> submission tag, talk title in the subject,
                and structured details in the body is automatically drafted to{' '}
                <span className="text-[#00ff9d] font-bold">{OPENBOARD_EMAIL}</span> so you can review and hit send.
              </p>
            </div>

            {formStatus === 'drafted' ? (
              <div
                className={cx(
                  'p-6 sm:p-8 rounded-2xl border backdrop-blur-xl space-y-6 shadow-2xl',
                  isDark ? 'bg-[#161b22]/90 border-[#00ff9d]/50' : 'bg-white border-emerald-400'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#30363d] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#00ff9d]/20 text-[#00ff9d] flex items-center justify-center text-xl border border-[#00ff9d]/40">
                      ✉
                    </div>
                    <div>
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#00ff9d]/15 border border-[#00ff9d]/40 text-[10px] font-mono text-[#00ff9d] font-bold">
                        TAG: SUBMISSION • SERIAL #{lastSerialNumber}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold font-mono mt-0.5">
                        EMAIL DRAFT READY FOR REVIEW &amp; SEND
                      </h3>
                    </div>
                  </div>
                </div>

                <p className={cx('text-xs font-sans leading-relaxed', isDark ? 'text-zinc-300' : 'text-zinc-700')}>
                  Your talk proposal for <strong>"{formState.title}"</strong> has been formatted into a complete email
                  draft addressed to <span className="font-mono text-[#00ff9d] font-bold">{OPENBOARD_EMAIL}</span>. If
                  your email app did not open automatically, choose your preferred option below to review and send it:
                </p>

                {/* Primary Launch Buttons: Default Mail Client + Gmail Web Compose + Copy */}
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={proposalDraft.mailtoUrl}
                    onClick={playClick}
                    className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#00ff9d] text-black hover:bg-[#34d399] shadow-[0_0_20px_rgba(0,255,157,0.35)] transition-all flex items-center gap-2"
                  >
                    <span>✉ OPEN IN DEFAULT MAIL APP &amp; SEND</span>
                  </a>

                  <a
                    href={proposalDraft.gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={playClick}
                    className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold border border-[#00ff9d] text-[#00ff9d] hover:bg-[#00ff9d]/15 transition-all flex items-center gap-2"
                  >
                    <span>🌐 OPEN IN GMAIL WEB COMPOSE ↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(`Subject: ${proposalDraft.subject}\n\n${proposalDraft.body}`, setCopiedProposal)
                    }
                    className="px-4 py-2.5 rounded-xl text-xs font-mono border border-[#30363d] text-zinc-300 hover:border-zinc-400 hover:text-white transition-all"
                  >
                    {copiedProposal ? '✓ COPIED FULL DRAFT' : '📋 COPY DRAFT TEXT'}
                  </button>
                </div>

                {/* Live Preview of the Drafted Email */}
                <div
                  className={cx(
                    'rounded-xl border p-4 space-y-3 font-mono text-xs',
                    isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-zinc-50 border-zinc-300'
                  )}
                >
                  <div className="text-[10px] uppercase tracking-wider text-[#00ff9d] font-bold">
                    DRAFTED EMAIL PREVIEW (VERIFY BEFORE SENDING)
                  </div>
                  <div className="space-y-1 border-b border-[#30363d] pb-2.5 text-[11px]">
                    <div>
                      <span className="text-zinc-500">To: </span>
                      <span className="text-[#00ff9d] font-bold">{OPENBOARD_EMAIL}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Subject: </span>
                      <span className="font-bold text-amber-300">{proposalDraft.subject}</span>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-300 max-h-64 overflow-y-auto font-mono">
                    {proposalDraft.body}
                  </pre>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setFormStatus('idle');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-mono border border-[#30363d] text-zinc-300 hover:text-white hover:border-[#00ff9d]"
                  >
                    ← Edit Proposal Details
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setFormStatus('idle');
                      setFormState({
                        name: '',
                        email: '',
                        batchOrAffiliation: '',
                        title: '',
                        department: 'Physics',
                        abstract: '',
                        prerequisites: 'Basic undergraduate calculus & linear algebra',
                        preferredDate: '',
                        tags: 'Interdisciplinary, Theory',
                      });
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-mono bg-[#21262d] text-zinc-300 hover:text-white"
                  >
                    Start Fresh Proposal
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitProposal}
                className={cx(
                  'p-6 sm:p-8 rounded-2xl border backdrop-blur-xl shadow-2xl space-y-4 font-mono text-xs',
                  isDark ? 'bg-[#161b22]/85 border-[#30363d]' : 'bg-white/95 border-[#d0d7de]'
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-3 text-[11px] text-zinc-400">
                  <span>&gt; recipient = "{OPENBOARD_EMAIL}"</span>
                  <span className="text-[#00ff9d] font-bold">[STEP 1: FILL FORM → STEP 2: REVIEW &amp; SEND MAIL]</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-zinc-400 mb-1">Speaker Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Emmy Noether"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Speaker Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="username22@iiserb.ac.in"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Batch / Affiliation</label>
                    <input
                      type="text"
                      placeholder="e.g. 2022 Batch, IISERB"
                      value={formState.batchOrAffiliation}
                      onChange={(e) => setFormState({ ...formState, batchOrAffiliation: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">Talk Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Symmetries & Conservation Laws"
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Academic Discipline *</label>
                    <select
                      value={formState.department}
                      onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    >
                      <option value="Physics">Physics</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Economics & Social Sciences">Economics & Social Sciences</option>
                      <option value="Interdisciplinary">Interdisciplinary / Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Abstract &amp; Pedagogical Hook *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide a 2-4 sentence summary of your presentation. What fundamental question are you answering for non-specialists?"
                    value={formState.abstract}
                    onChange={(e) => setFormState({ ...formState, abstract: e.target.value })}
                    className={cx(
                      'w-full px-3.5 py-2.5 rounded-lg border outline-none font-sans text-xs',
                      isDark
                        ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                        : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Recommended Audience Prerequisites</label>
                  <input
                    type="text"
                    placeholder="e.g. None! Just curiosity (or 1st-year linear algebra)"
                    value={formState.prerequisites}
                    onChange={(e) => setFormState({ ...formState, prerequisites: e.target.value })}
                    className={cx(
                      'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                      isDark
                        ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                        : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">Preferred Session Date</label>
                    <input
                      type="date"
                      value={formState.preferredDate}
                      onChange={(e) => setFormState({ ...formState, preferredDate: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Topic Tags (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Noether Theorem, Group Theory"
                      value={formState.tags}
                      onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>
                </div>

                {/* Live Subject Line Preview Bar */}
                <div
                  className={cx(
                    'p-3 rounded-lg border text-[11px] font-mono',
                    isDark ? 'bg-[#0d1117]/90 border-[#30363d] text-zinc-400' : 'bg-zinc-100 border-zinc-300 text-zinc-600'
                  )}
                >
                  <span className="text-[#00ff9d] font-bold">Draft Subject Preview: </span>
                  <span>
                    [Submission #OB-2026-XXXX] OpenBoard Talk Proposal:{' '}
                    {formState.title.trim() ? formState.title.trim() : '<Your Talk Title>'}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-mono text-xs font-bold tracking-wider bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.35)] hover:shadow-[0_0_30px_rgba(0,255,157,0.55)] transition-all flex items-center justify-center gap-2"
                >
                  <span>&gt; DRAFT SUBMISSION EMAIL TO OPENBOARDINITIATIVE@GMAIL.COM (REVIEW &amp; SEND)</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 6: CONTACT & SUGGESTIONS — FORM -> DRAFT EMAIL   */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'contact' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-left">
              <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">
                06 // COMMUNICATIONS &amp; FEEDBACK
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
                Suggestions &amp; Coordinator Channels
              </h2>
              <p className={cx('text-xs sm:text-sm mt-1 leading-relaxed', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                Have a suggestion for a topic, speaker, collaboration, or improvement? Fill out the form below to
                generate a properly structured email draft to{' '}
                <span className="text-[#00ff9d] font-bold">{OPENBOARD_EMAIL}</span> ready for you to review and send.
              </p>
            </div>

            {/* Direct Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={cx(
                  'p-6 rounded-2xl border backdrop-blur-xl space-y-2',
                  isDark ? 'bg-[#161b22]/85 border-[#30363d]' : 'bg-white border-[#d0d7de]'
                )}
              >
                <div className="text-xs font-mono text-[#00ff9d] font-bold">📍 CAMPUS LOCATION</div>
                <h4 className="font-bold text-sm">Lecture Hall Complex (LHC)</h4>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  Room L-8, Ground Floor
                  <br />
                  IISER Bhopal, Bhauri, Bhopal, MP 462066
                </p>
              </div>

              <div
                className={cx(
                  'p-6 rounded-2xl border backdrop-blur-xl space-y-2',
                  isDark ? 'bg-[#161b22]/85 border-[#30363d]' : 'bg-white border-[#d0d7de]'
                )}
              >
                <div className="text-xs font-mono text-[#f43f5e] font-bold">✉ OFFICIAL CHANNELS</div>
                <div className="text-xs font-mono space-y-1.5 text-zinc-300">
                  <div>
                    Official Inbox:{' '}
                    <a href={`mailto:${OPENBOARD_EMAIL}`} className="text-[#00ff9d] font-bold hover:underline">
                      {OPENBOARD_EMAIL}
                    </a>
                  </div>
                  <div>
                    Samriddha:{' '}
                    <a href="mailto:samriddha22@iiserb.ac.in" className="text-[#00ff9d] hover:underline">
                      samriddha22@iiserb.ac.in
                    </a>
                  </div>
                  <div>
                    Adeetya:{' '}
                    <a href="mailto:adeety22@iiserb.ac.in" className="text-[#00ff9d] hover:underline">
                      adeety22@iiserb.ac.in
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* SUGGESTIONS & FEEDBACK FORM -> DRAFTS PROPER EMAIL */}
            {suggestionStatus === 'drafted' ? (
              <div
                className={cx(
                  'p-6 sm:p-8 rounded-2xl border backdrop-blur-xl space-y-6 shadow-2xl',
                  isDark ? 'bg-[#161b22]/90 border-[#f43f5e]/50' : 'bg-white border-rose-300'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#30363d] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#f43f5e]/20 text-[#f43f5e] flex items-center justify-center text-xl border border-[#f43f5e]/40">
                      ✉
                    </div>
                    <div>
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#f43f5e]/15 border border-[#f43f5e]/40 text-[10px] font-mono text-[#f43f5e] font-bold">
                        TAG: SUGGESTION • REF #{lastSuggestionSerial}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold font-mono mt-0.5">
                        SUGGESTION DRAFT READY FOR REVIEW &amp; SEND
                      </h3>
                    </div>
                  </div>
                </div>

                <p className={cx('text-xs font-sans leading-relaxed', isDark ? 'text-zinc-300' : 'text-zinc-700')}>
                  Your suggestion regarding <strong>"{suggestionState.topic}"</strong> has been formatted into an email
                  draft to <span className="font-mono text-[#00ff9d] font-bold">{OPENBOARD_EMAIL}</span>. Please review
                  and send it via your preferred email client below:
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={suggestionDraft.mailtoUrl}
                    onClick={playClick}
                    className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-[#00ff9d] text-black hover:bg-[#34d399] shadow-[0_0_20px_rgba(0,255,157,0.35)] transition-all flex items-center gap-2"
                  >
                    <span>✉ OPEN IN DEFAULT MAIL APP &amp; SEND</span>
                  </a>

                  <a
                    href={suggestionDraft.gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={playClick}
                    className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold border border-[#00ff9d] text-[#00ff9d] hover:bg-[#00ff9d]/15 transition-all flex items-center gap-2"
                  >
                    <span>🌐 OPEN IN GMAIL WEB COMPOSE ↗</span>
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        `Subject: ${suggestionDraft.subject}\n\n${suggestionDraft.body}`,
                        setCopiedSuggestion
                      )
                    }
                    className="px-4 py-2.5 rounded-xl text-xs font-mono border border-[#30363d] text-zinc-300 hover:border-zinc-400 hover:text-white transition-all"
                  >
                    {copiedSuggestion ? '✓ COPIED FULL DRAFT' : '📋 COPY DRAFT TEXT'}
                  </button>
                </div>

                {/* Live Preview of the Drafted Suggestion Email */}
                <div
                  className={cx(
                    'rounded-xl border p-4 space-y-3 font-mono text-xs',
                    isDark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-zinc-50 border-zinc-300'
                  )}
                >
                  <div className="text-[10px] uppercase tracking-wider text-[#f43f5e] font-bold">
                    DRAFTED SUGGESTION EMAIL PREVIEW (VERIFY BEFORE SENDING)
                  </div>
                  <div className="space-y-1 border-b border-[#30363d] pb-2.5 text-[11px]">
                    <div>
                      <span className="text-zinc-500">To: </span>
                      <span className="text-[#00ff9d] font-bold">{OPENBOARD_EMAIL}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Subject: </span>
                      <span className="font-bold text-amber-300">{suggestionDraft.subject}</span>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-300 max-h-64 overflow-y-auto font-mono">
                    {suggestionDraft.body}
                  </pre>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#30363d]">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSuggestionStatus('idle');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-mono border border-[#30363d] text-zinc-300 hover:text-white hover:border-[#00ff9d]"
                  >
                    ← Edit Suggestion Details
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setSuggestionStatus('idle');
                      setSuggestionState({
                        name: '',
                        email: '',
                        affiliation: '',
                        category: 'Topic / Speaker Suggestion',
                        topic: '',
                        details: '',
                      });
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-mono bg-[#21262d] text-zinc-300 hover:text-white"
                  >
                    Draft Another Suggestion
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitSuggestion}
                className={cx(
                  'p-6 sm:p-8 rounded-2xl border backdrop-blur-xl shadow-2xl space-y-4 font-mono text-xs',
                  isDark ? 'bg-[#161b22]/85 border-[#30363d]' : 'bg-white/95 border-[#d0d7de]'
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-3 text-[11px] text-zinc-400">
                  <span>&gt; submit_suggestion_to = "{OPENBOARD_EMAIL}"</span>
                  <span className="text-[#f43f5e] font-bold">[TAG: SUGGESTION / FEEDBACK]</span>
                </div>

                <h3 className="text-base sm:text-lg font-bold tracking-tight pt-1">
                  Submit a Suggestion, Topic Request, or Feedback
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alan Turing"
                      value={suggestionState.name}
                      onChange={(e) => setSuggestionState({ ...suggestionState, name: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Your Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="student@iiserb.ac.in"
                      value={suggestionState.email}
                      onChange={(e) => setSuggestionState({ ...suggestionState, email: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Batch / Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Physics 2023 Batch"
                      value={suggestionState.affiliation}
                      onChange={(e) => setSuggestionState({ ...suggestionState, affiliation: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">Suggestion Category *</label>
                    <select
                      value={suggestionState.category}
                      onChange={(e) => setSuggestionState({ ...suggestionState, category: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    >
                      <option value="Topic / Speaker Suggestion">Topic / Speaker Suggestion</option>
                      <option value="Session Format & Pedagogy">Session Format &amp; Pedagogy</option>
                      <option value="Website / Archive Feedback">Website / Archive Feedback</option>
                      <option value="Collaboration / Club Partnership">Collaboration / Club Partnership</option>
                      <option value="General Query / Other">General Query / Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Subject / Topic Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Request for a session on Category Theory"
                      value={suggestionState.topic}
                      onChange={(e) => setSuggestionState({ ...suggestionState, topic: e.target.value })}
                      className={cx(
                        'w-full px-3.5 py-2.5 rounded-lg border outline-none font-mono text-xs',
                        isDark
                          ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Detailed Suggestion / Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your suggestion, recommended speaker, or feedback in detail so we can review it..."
                    value={suggestionState.details}
                    onChange={(e) => setSuggestionState({ ...suggestionState, details: e.target.value })}
                    className={cx(
                      'w-full px-3.5 py-2.5 rounded-lg border outline-none font-sans text-xs',
                      isDark
                        ? 'bg-[#0d1117] border-[#30363d] text-zinc-100 focus:border-[#00ff9d]'
                        : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                    )}
                  />
                </div>

                {/* Live Subject Line Preview Bar */}
                <div
                  className={cx(
                    'p-3 rounded-lg border text-[11px] font-mono',
                    isDark ? 'bg-[#0d1117]/90 border-[#30363d] text-zinc-400' : 'bg-zinc-100 border-zinc-300 text-zinc-600'
                  )}
                >
                  <span className="text-[#f43f5e] font-bold">Draft Subject Preview: </span>
                  <span>
                    [Suggestion #OB-SUG-2026-XXXX] OpenBoard ({suggestionState.category}):{' '}
                    {suggestionState.topic.trim() ? suggestionState.topic.trim() : '<Your Topic / Subject>'}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-mono text-xs font-bold tracking-wider bg-[#f43f5e] text-white shadow-[0_0_20px_rgba(244,63,94,0.35)] hover:shadow-[0_0_30px_rgba(244,63,94,0.55)] transition-all flex items-center justify-center gap-2"
                >
                  <span>&gt; DRAFT SUGGESTION EMAIL TO OPENBOARDINITIATIVE@GMAIL.COM (REVIEW &amp; SEND)</span>
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: TALK DETAILS & ABSTRACT VIEWER                     */}
      {/* ========================================================= */}
      {activeModalTalk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className={cx(
              'max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-6 sm:p-8 shadow-2xl relative font-mono',
              isDark ? 'bg-[#0d1117] border-[#00ff9d]/40' : 'bg-white border-zinc-300'
            )}
          >
            <button
              onClick={() => {
                playClick();
                setActiveModalTalk(null);
              }}
              className="absolute top-5 right-5 w-7 h-7 rounded-lg bg-[#21262d] text-zinc-300 hover:text-white flex items-center justify-center text-xs"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-[#00ff9d]/20 text-[#00ff9d] font-bold border border-[#00ff9d]/40">
                TALK #{activeModalTalk.number}
              </span>
              <span className="text-zinc-400">{activeModalTalk.date}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-[#38bdf8]">{activeModalTalk.category}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">{activeModalTalk.title}</h3>
            <p className="text-xs text-[#00ff9d] mt-1">Speaker: {activeModalTalk.speaker}</p>
            <p className="text-[11px] text-zinc-400">{activeModalTalk.affiliation}</p>

            <div className="my-5 border-t border-[#30363d]" />

            <div>
              <h4 className="text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">
                Abstract &amp; Core Theorems
              </h4>
              <p
                className={cx(
                  'text-xs font-sans leading-relaxed',
                  isDark ? 'text-zinc-300' : 'text-zinc-700'
                )}
              >
                {activeModalTalk.abstract}
              </p>
            </div>

            <div className="mt-5">
              <h4 className="text-[11px] uppercase tracking-wider text-zinc-400 mb-1.5 font-bold">Topic Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {activeModalTalk.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded text-[11px] bg-[#161b22] text-zinc-300 border border-[#30363d]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-7 pt-4 border-t border-[#30363d] flex flex-wrap items-center justify-between gap-3">
              {activeModalTalk.slidesUrl && (
                <a
                  href={activeModalTalk.slidesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={playClick}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00ff9d] text-black hover:bg-[#34d399] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                >
                  📥 DOWNLOAD PRESENTATION ({activeModalTalk.slidesName})
                </a>
              )}

              <button
                onClick={(e) => handleToggleBookmark(activeModalTalk.id, e)}
                className="px-3.5 py-2 rounded-xl text-xs border border-[#30363d] hover:border-[#00ff9d] transition-all"
              >
                {bookmarkedIds.includes(activeModalTalk.id) ? '❤️ In Bookmarks' : '🤍 Bookmark Talk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: GALLERY LIGHTBOX ZOOM                              */}
      {/* ========================================================= */}
      {activeLightboxImg && (
        <div
          onClick={() => {
            playClick();
            setActiveLightboxImg(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full rounded-2xl overflow-hidden border border-[#30363d] bg-[#0d1117] p-2 relative font-mono"
          >
            <button
              onClick={() => {
                playClick();
                setActiveLightboxImg(null);
              }}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-black/70 text-white flex items-center justify-center text-xs hover:bg-zinc-800"
            >
              ✕
            </button>
            <div className="max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-xl bg-black">
              <img
                src={activeLightboxImg.src}
                alt={activeLightboxImg.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
            <div className="p-3 flex items-center justify-between text-xs text-zinc-400">
              <div>
                <span className="text-[#00ff9d] font-bold">{activeLightboxImg.title}</span>
                <p className="text-[11px] text-zinc-300 mt-0.5">{activeLightboxImg.caption}</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#21262d] text-zinc-300">{activeLightboxImg.category}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RETRO FOOTER                                              */}
      {/* ========================================================= */}
      <footer
        className={cx(
          'relative z-10 mt-20 border-t py-8 px-4 sm:px-6 transition-colors font-mono text-xs backdrop-blur-md',
          isDark ? 'border-[#30363d] bg-[#0d1117]/80' : 'border-[#d0d7de] bg-zinc-50/80'
        )}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">open_board</span>
            <span>•</span>
            <span>IISER Bhopal Pedagogical Initiative</span>
            <span>•</span>
            <span className="text-[#00ff9d]">{OPENBOARD_EMAIL}</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => handleNavClick('home')} className="hover:text-[#00ff9d]">
              Home
            </button>
            <button onClick={() => handleNavClick('archive')} className="hover:text-[#00ff9d]">
              Archive
            </button>
            <button onClick={() => handleNavClick('gallery')} className="hover:text-[#00ff9d]">
              Gallery
            </button>
            <button onClick={() => handleNavClick('submit')} className="hover:text-[#00ff9d]">
              Propose Talk
            </button>
            <button onClick={() => handleNavClick('contact')} className="hover:text-[#00ff9d]">
              Suggest
            </button>
            <a
              href="https://github.com/samriddhaganguly/open_board-web"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00ff9d] hover:underline"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
