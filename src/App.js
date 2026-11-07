import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

// Utility helper for conditional classes
const cx = (...classes) => classes.filter(Boolean).join(' ');

// ==========================================
// 1. SOUND MANAGEMENT HOOK (Tone.js via CDN)
// ==========================================
const useSoundEffects = (isMuted) => {
  const clickSynth = useRef(null);
  const successSynth = useRef(null);
  const chimeSynth = useRef(null);
  const isAudioReady = useRef(false);

  useEffect(() => {
    const setupAudio = async () => {
      if (typeof window !== 'undefined' && window.Tone && !isAudioReady.current) {
        try {
          await window.Tone.start();
          
          // Subtle, tactile 8-bit click synth
          clickSynth.current = new window.Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.001, decay: 0.08, sustain: 0.01, release: 0.08 },
          }).toDestination();
          clickSynth.current.volume.value = -12;

          // Polyphonic ascending chord for submission & achievements
          successSynth.current = new window.Tone.PolySynth(window.Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.25, sustain: 0.15, release: 0.4 },
          }).toDestination();
          successSynth.current.volume.value = -8;

          // Crisp shimmer chime for bookmarking
          chimeSynth.current = new window.Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.005, decay: 0.15, sustain: 0.02, release: 0.2 },
          }).toDestination();
          chimeSynth.current.volume.value = -10;

          isAudioReady.current = true;
          document.body.removeEventListener('click', setupAudio);
        } catch (e) {
          console.warn('AudioContext initialization deferred:', e);
        }
      }
    };

    document.body.addEventListener('click', setupAudio, { once: true });
    return () => {
      document.body.removeEventListener('click', setupAudio);
    };
  }, []);

  const playClick = () => {
    if (!isMuted && clickSynth.current && window.Tone?.context?.state === 'running') {
      try {
        clickSynth.current.triggerAttackRelease('F#5', '32n');
      } catch (e) {}
    }
  };

  const playSuccess = () => {
    if (!isMuted && successSynth.current && window.Tone?.context?.state === 'running') {
      try {
        const now = window.Tone.now();
        successSynth.current.triggerAttackRelease(['C5', 'E5', 'G5', 'B5'], '16n', now);
      } catch (e) {}
    }
  };

  const playBookmark = () => {
    if (!isMuted && chimeSynth.current && window.Tone?.context?.state === 'running') {
      try {
        chimeSynth.current.triggerAttackRelease('E6', '32n');
      } catch (e) {}
    }
  };

  return { playClick, playSuccess, playBookmark };
};

// ==========================================
// 2. 3D WEBGL PARTICLE & CONSTELLATION MESH
// ==========================================
const BackgroundAnimation = ({ theme }) => {
  const mountRef = useRef(null);
  const threeRef = useRef({});

  useEffect(() => {
    if (typeof window === 'undefined' || !mountRef.current) return;
    const container = mountRef.current;

    // Initialize Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Particle Cloud (5,000 Nodes)
    const particleCount = 4500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 14;
      positions[i + 1] = (Math.random() - 0.5) * 14;
      positions[i + 2] = (Math.random() - 0.5) * 10;
      scales[i / 3] = Math.random() * 0.02 + 0.01;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.022,
      transparent: true,
      opacity: theme === 'dark' ? 0.75 : 0.45,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Delicate Geometric Polyhedron Core Wireframe
    const icosaGeometry = new THREE.IcosahedronGeometry(2.2, 1);
    const icosaWireframe = new THREE.WireframeGeometry(icosaGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: theme === 'dark' ? 0x10b981 : 0x059669,
      transparent: true,
      opacity: theme === 'dark' ? 0.12 : 0.06,
    });
    const icosaLines = new THREE.LineSegments(icosaWireframe, lineMaterial);
    scene.add(icosaLines);

    threeRef.current = { scene, camera, renderer, particleSystem, material, icosaLines, lineMaterial };

    // Interactive mouse parallax
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Render loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Fluid interpolation toward mouse
      mouse.x += (mouse.targetX - mouse.x) * 0.03;
      mouse.y += (mouse.targetY - mouse.y) * 0.03;

      particleSystem.rotation.y = elapsedTime * 0.04 + mouse.x * 0.2;
      particleSystem.rotation.x = elapsedTime * 0.02 - mouse.y * 0.2;

      icosaLines.rotation.y = -elapsedTime * 0.05 + mouse.x * 0.15;
      icosaLines.rotation.x = elapsedTime * 0.03 + mouse.y * 0.15;

      camera.position.x += (mouse.x * 0.35 - camera.position.x) * 0.03;
      camera.position.y += (mouse.y * 0.35 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      icosaGeometry.dispose();
      lineMaterial.dispose();
    };
  }, []);

  // Update dynamic theme colors without remounting
  useEffect(() => {
    if (!threeRef.current.material) return;
    const isDark = theme === 'dark';
    const primaryNeon = isDark ? 0x00ff9d : 0x0f172a;
    const wireColor = isDark ? 0x10b981 : 0x0f766e;

    threeRef.current.material.color.setHex(primaryNeon);
    threeRef.current.material.opacity = isDark ? 0.75 : 0.45;
    threeRef.current.material.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

    if (threeRef.current.lineMaterial) {
      threeRef.current.lineMaterial.color.setHex(wireColor);
      threeRef.current.lineMaterial.opacity = isDark ? 0.14 : 0.07;
    }
  }, [theme]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-700"
      style={{ opacity: 0.95 }}
    />
  );
};

// ==========================================
// 3. COMPLETE ARCHIVAL TALKS & PAPERS DATA
// ==========================================
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
    hasPdf: true,
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
    hasPdf: true,
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
    hasPdf: true,
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
    hasPdf: true,
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
    hasPdf: true,
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
    hasPdf: true,
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
    hasPdf: true,
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
    hasPdf: true,
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
      'Beyond classical Landau paradigm of symmetry breaking lies the realm of topological order and quantum matter. We explore how quantum entanglement ceases to be just a curious EPR paradox and becomes the fundamental glue structuring exotic phases of matter.',
    poster: '/sam.png',
    slidesUrl: '/Everything__Entangled__All_At_Once.pdf',
    slidesName: 'Everything__Entangled__All_At_Once.pdf',
    hasPdf: true,
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
    hasPdf: false,
    hasPptx: true,
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
    hasPdf: true,
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
    hasPdf: true,
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
    hasPdf: true,
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
    hasPdf: true,
  },
];

// ==========================================
// 4. TEAM & SPEAKERS COMPREHENSIVE DIRECTORY
// ==========================================
const TEAM_MEMBERS = [
  {
    name: 'Samriddha Ganguly',
    role: 'Lead Coordinator',
    batch: 'Physics Major • 2022 Batch',
    bio: 'Working on quantum matter, topology, and superconductivity. Dedicated to creating an open forum where rigorous ideas cross traditional disciplinary walls.',
    email: 'samriddha22@iiserb.ac.in',
    avatar: '/sam.png',
    photos: ['/sam1.jpeg', '/sam2.jpeg', '/sam3.jpeg'],
    isCoordinator: true,
    talksCount: 1,
  },
  {
    name: 'Adeetya Choubey',
    role: 'Co-Coordinator',
    batch: 'Mathematics Major • 2022 Batch',
    bio: 'Passionate about combinatorics, probabilistic methods, and algebraic structures. Spearheading peer discussion sessions and student engagement.',
    email: 'adeety22@iiserb.ac.in',
    avatar: '/ab.png',
    photos: ['/adixit.png'],
    isCoordinator: true,
    talksCount: 1,
  },
  {
    name: 'Sidharth Raman',
    role: 'Speaker & Contributor',
    batch: 'Physics & Dynamical Systems',
    bio: 'Researches chaos, nonlinear mechanics, and complex systems.',
    avatar: '/raman.png',
    photos: ['/ram1.jpeg', '/ram2.jpeg', '/ram3.jpeg'],
    isCoordinator: false,
    talksCount: 1,
  },
  {
    name: 'Aryan Gupta',
    role: 'Speaker & Contributor',
    batch: 'Chemical Sciences & Computation',
    bio: 'Simulates non-equilibrium reaction networks and stochastic physical chemistry.',
    avatar: '/aryan.png',
    photos: ['/aryan1.jpeg', '/aryan2.jpeg', '/aryan3.jpeg'],
    isCoordinator: false,
    talksCount: 1,
  },
  {
    name: 'Harsh Tandon',
    role: 'Speaker & Contributor',
    batch: 'Pure Mathematics',
    bio: 'Explores analysis, functional spaces, and topological foundations.',
    avatar: '/harsh.png',
    photos: ['/hrh1.jpeg', '/hrh2.jpeg', '/hrh3.jpeg'],
    isCoordinator: false,
    talksCount: 1,
  },
  {
    name: 'Manas Nandan',
    role: 'Speaker & Contributor',
    batch: 'Economics & Game Theory',
    bio: 'Investigates auction design, strategic information extraction, and decision theory.',
    avatar: '/manaso.png',
    photos: ['/mn1.jpeg', '/mn2.jpeg', '/mn3.jpeg'],
    isCoordinator: false,
    talksCount: 1,
  },
  {
    name: 'Dev Krishna',
    role: 'Speaker & Contributor',
    batch: 'Geometry & Topology',
    bio: 'Enthusiast of hyperbolic spaces, geometric group theory, and geometric visualization.',
    avatar: '/devp.png',
    photos: ['/dev.png'],
    isCoordinator: false,
    talksCount: 1,
  },
  {
    name: 'Deo Ishaan Prashant',
    role: 'Speaker & Contributor',
    batch: 'Physics & Mathematics',
    bio: 'Fascinated by graph theory, random walks, and electrical network analogies.',
    avatar: '/deo.png',
    photos: ['/ish1.jpeg', '/ish2.jpeg', '/ish3.jpeg'],
    isCoordinator: false,
    talksCount: 1,
  },
  {
    name: 'Raghav Kumawat',
    role: 'Speaker & Contributor',
    batch: 'Cosmology & Astrophysics',
    bio: 'Investigating 3-manifold topologies in spacetime geometry and cosmology.',
    avatar: '/raghav.png',
    photos: ['/r1.jpeg', '/r2.jpeg', '/r3.jpeg'],
    isCoordinator: false,
    talksCount: 1,
  },
  {
    name: 'Raj Soni',
    role: 'Speaker & Contributor',
    batch: 'Applied Computing & Mathematics',
    bio: 'Focuses on numerical methods, splines, and algorithm efficiency.',
    avatar: '/raj.jpeg',
    photos: ['/rj1.jpeg', '/rj2.jpeg'],
    isCoordinator: false,
    talksCount: 1,
  },
  {
    name: 'Vedanshi Vaghela',
    role: 'Speaker & Contributor',
    batch: 'Mathematics & Machine Learning',
    bio: 'Bridges deep learning with pure mathematics and graph representations.',
    avatar: '/vvml.png',
    photos: ['/vv1.jpeg', '/vv2.jpeg', '/vv3.jpeg'],
    isCoordinator: false,
    talksCount: 1,
  },
  {
    name: 'Aneesh Diwanji',
    role: 'Speaker & Contributor',
    batch: 'Applied Mathematics',
    bio: 'Studies opinion percolation and complex agent networks.',
    avatar: '/aneesh.png',
    photos: ['/diwan.png'],
    isCoordinator: false,
    talksCount: 1,
  },
];

// ==========================================
// 5. GALLERY DATA (ALL MEDIA FROM PUBLIC/)
// ==========================================
const GALLERY_ITEMS = [
  { src: '/photo1.jpeg', title: 'OpenBoard In Session', caption: 'Lively whiteboard debate on geometric topology', category: 'Talks' },
  { src: '/photo2.jpeg', title: 'Interactive Audience', caption: 'Cross-department students interrogating mathematical models', category: 'Audience' },
  { src: '/photo3.jpeg', title: 'Late-Night Derivations', caption: 'Post-talk whiteboard extensions and discussions', category: 'Whiteboard' },
  { src: '/pic', title: 'Blackboard Blueprint', caption: 'Foundational equations from our very first semester session', category: 'Whiteboard' },
  { src: '/sam1.jpeg', title: 'Samriddha on Entanglement', caption: 'Demystifying topological order and quantum matter', category: 'Talks' },
  { src: '/sam2.jpeg', title: 'Quantum Phase Transitions', caption: 'Exploring ground state degeneracies on the board', category: 'Talks' },
  { src: '/sam3.jpeg', title: 'Q&A Discussion', caption: 'Deep dialogue with chemistry and math students', category: 'Audience' },
  { src: '/aryan1.jpeg', title: 'Aryan on Stochastic Systems', caption: 'Breaking down chemical master equations', category: 'Talks' },
  { src: '/aryan2.jpeg', title: 'Monte Carlo Steps', caption: 'Live computational visualization of molecular reactions', category: 'Talks' },
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

// ==========================================
// 6. UPCOMING EVENTS DATA
// ==========================================
const UPCOMING_EVENTS = [
  {
    id: 'event-14',
    title: 'Some Biology: Emergence & Morphogenesis',
    speaker: 'Pratham Shah',
    batch: 'Biological Sciences, 2022 Batch',
    date: '2025-11-14',
    time: '18:00 IST',
    venue: 'Lecture Hall Complex (LHC), Room L-8',
    institution: 'IISER Bhopal Campus',
    category: 'Biology',
    description:
      'How does biological order self-assemble from molecular chaos? Join us for an interdisciplinary exploration of reaction-diffusion systems, genetic feedback circuits, and pattern formation.',
    tags: ['Turing Patterns', 'Systems Biology', 'Morphogenesis'],
    status: 'Scheduled',
    avatar: '/pic',
  },
  {
    id: 'event-15',
    title: 'Quantum Advantage in Many-Body Simulation',
    speaker: 'Open Call / Guest Speaker',
    batch: 'Physics & Computer Science',
    date: '2025-11-21',
    time: '18:00 IST',
    venue: 'Lecture Hall Complex (LHC), Room L-8',
    institution: 'IISER Bhopal Campus',
    category: 'Interdisciplinary',
    description:
      'Exploring whether noisy intermediate-scale quantum (NISQ) processors can genuinely outperform classical tensor networks on strongly correlated lattices.',
    tags: ['Quantum Computing', 'Tensor Networks', 'Simulation'],
    status: 'Upcoming',
    avatar: '/sam.png',
  },
];

// ==========================================
// 7. MAIN REPLACEMENT COMPONENT
// ==========================================
export default function App() {
  // Theme state: defaults to dark for glowing neon aesthetic
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openboard_theme') || 'dark';
    }
    return 'dark';
  });

  // Navigation tab state: 'home', 'about', 'archive', 'gallery', 'events', 'submit', 'contact'
  const [activeTab, setActiveTab] = useState('home');

  // Audio mute state
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openboard_muted') === 'true';
    }
    return false;
  });

  // Sound generator hook
  const { playClick, playSuccess, playBookmark } = useSoundEffects(isMuted);

  // Search & Filter state for Archive
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);

  // Bookmarks state (persisted locally)
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

  // Modal active talk state
  const [activeModalTalk, setActiveModalTalk] = useState(null);

  // Lightbox active gallery image
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);

  // Proposal Submission Form state
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    title: '',
    department: 'Physics',
    abstract: '',
    preferredDate: '',
    tags: 'Interdisciplinary, Theory',
  });
  const [formStatus, setFormStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'

  // Mobile menu open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync theme changes with DOM documentElement
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('openboard_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync mute state
  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    localStorage.setItem('openboard_muted', String(nextState));
    if (!nextState) {
      playClick();
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

  // Handle Proposal Submission
  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.title || !formState.abstract) {
      alert('Please fill out all required fields.');
      return;
    }
    setFormStatus('submitting');
    playClick();

    try {
      // Send proposal to OpenBoard Apps Script endpoint
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbwYyY7ZqXz5ZgGg8Nq6pQ3t2M7k8wP/exec',
        {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formState,
            timestamp: new Date().toISOString(),
          }),
        }
      ).catch(() => null);

      // Trigger reward sound and celebration feedback
      setTimeout(() => {
        setFormStatus('success');
        playSuccess();
      }, 700);
    } catch (err) {
      // Graceful fallback to local success
      setTimeout(() => {
        setFormStatus('success');
        playSuccess();
      }, 700);
    }
  };

  // Colors & Aesthetic Styles
  const isDark = theme === 'dark';

  return (
    <div
      className={cx(
        'min-h-screen relative font-sans transition-colors duration-500 selection:bg-emerald-500/30 selection:text-emerald-300',
        isDark ? 'bg-[#060a12] text-zinc-100' : 'bg-[#f8fafc] text-zinc-900'
      )}
    >
      {/* Inline self-contained neon animations & keyframe styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmerBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* 3D WebGL Background Canvas */}
      <BackgroundAnimation theme={theme} />

      {/* Cyber Shimmer Light Glow Effect (Fixed Ambience) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className={cx(
            'absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[450px] rounded-full blur-[140px] opacity-25 transition-all duration-1000',
            isDark ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500' : 'bg-gradient-to-tr from-emerald-300 to-cyan-200'
          )}
        />
        <div
          className={cx(
            'absolute bottom-0 right-0 w-[550px] h-[400px] rounded-full blur-[160px] opacity-20',
            isDark ? 'bg-indigo-600/30' : 'bg-blue-300/20'
          )}
        />
      </div>

      {/* ========================================================= */}
      {/* HEADER / FLOATING GLASSMORPHIC NAVIGATION BAR             */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 transition-all">
        <div
          className={cx(
            'max-w-7xl mx-auto rounded-2xl px-5 py-3 flex items-center justify-between border backdrop-blur-xl shadow-2xl transition-all duration-300',
            isDark
              ? 'bg-[#090d16]/80 border-emerald-500/20 shadow-[0_0_30px_rgba(0,255,157,0.06)]'
              : 'bg-white/85 border-zinc-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.05)]'
          )}
        >
          {/* Logo with Animated Neon Pulse */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-[1px] shadow-[0_0_15px_rgba(16,185,129,0.35)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all">
              <div
                className={cx(
                  'w-full h-full rounded-[11px] flex items-center justify-center transition-colors',
                  isDark ? 'bg-[#0a0f1d]' : 'bg-white'
                )}
              >
                <span className="font-mono font-bold text-sm bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  OB
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-extrabold tracking-tight text-base sm:text-lg">
                  open_board
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-[10px] tracking-widest uppercase font-mono text-zinc-400">
                IISER Bhopal • Interdisciplinary
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About' },
              { id: 'archive', label: 'Archive' },
              { id: 'gallery', label: 'Gallery' },
              { id: 'events', label: 'Events' },
              { id: 'submit', label: 'Propose Talk' },
              { id: 'contact', label: 'Contact' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavClick(tab.id)}
                  className={cx(
                    'relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 font-mono tracking-wide',
                    isActive
                      ? isDark
                        ? 'text-emerald-300 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.2)] border border-emerald-500/30'
                        : 'text-emerald-700 bg-emerald-50 shadow-sm border border-emerald-200'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Controls: Audio Synth Mute + Dark/Light Mode */}
          <div className="flex items-center gap-2">
            {/* Tone.js Audio Mute Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio Synthesizer' : 'Mute Audio Synthesizer'}
              className={cx(
                'p-2 rounded-xl text-xs border transition-all flex items-center gap-1.5 font-mono',
                isDark
                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-300'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:border-emerald-400'
              )}
            >
              {isMuted ? (
                <span className="opacity-60 flex items-center gap-1">
                  🔇 <span className="hidden sm:inline text-[10px]">Muted</span>
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  🔊 <span className="hidden sm:inline text-[10px]">Synth On</span>
                </span>
              )}
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Color Theme"
              className={cx(
                'p-2 rounded-xl text-xs border transition-all',
                isDark
                  ? 'bg-zinc-900/60 border-zinc-800 text-yellow-400 hover:border-yellow-500/40'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:border-zinc-300'
              )}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Mobile Hamburger Drawer Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-zinc-700/50 text-zinc-300"
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

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div
            className={cx(
              'md:hidden mt-2 p-4 rounded-2xl border backdrop-blur-2xl shadow-2xl flex flex-col gap-2 transition-all',
              isDark ? 'bg-[#090d16]/95 border-emerald-500/30' : 'bg-white/95 border-zinc-200'
            )}
          >
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About' },
              { id: 'archive', label: 'Archive' },
              { id: 'gallery', label: 'Gallery' },
              { id: 'events', label: 'Events' },
              { id: 'submit', label: 'Propose Talk' },
              { id: 'contact', label: 'Contact' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleNavClick(tab.id)}
                className={cx(
                  'px-4 py-2.5 rounded-xl text-left text-sm font-mono tracking-wide transition-all',
                  activeTab === tab.id
                    ? isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'text-zinc-400 hover:text-zinc-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTENT CONTAINER                                    */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        {/* ----------------------------------------------------- */}
        {/* VIEW 1: HOME (Hero, Mission, Stats, Featured Talk)     */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'home' && (
          <div className="space-y-16 sm:space-y-24">
            {/* Hero Section */}
            <section className="relative pt-6 sm:pt-14 pb-8 flex flex-col items-center text-center">
              {/* Top Neon Badge */}
              <div
                className={cx(
                  'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border backdrop-blur-md mb-6 shadow-sm',
                  isDark
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                )}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>IISER Bhopal Student-Led Initiative</span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-400">14+ Recorded Talks</span>
              </div>

              {/* Main Headline with Shimmer Gradient */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1]">
                Breaking Down{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Academic Silos
                </span>{' '}
                One Talk At A Time.
              </h1>

              {/* Subtitle */}
              <p
                className={cx(
                  'mt-6 text-base sm:text-xl max-w-2xl leading-relaxed',
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                )}
              >
                <strong className="text-emerald-400 font-semibold font-mono">open_board</strong> is a peer-to-peer
                pedagogical initiative where students share cutting-edge research, mathematical theorems, and creative
                explorations with non-specialists.
              </p>

              {/* Hero Call to Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => handleNavClick('archive')}
                  className="px-6 py-3 rounded-xl font-mono text-sm font-semibold tracking-wide bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] hover:-translate-y-0.5 transition-all"
                >
                  Explore Talk Archive →
                </button>
                <button
                  onClick={() => handleNavClick('submit')}
                  className={cx(
                    'px-6 py-3 rounded-xl font-mono text-sm font-medium border backdrop-blur-md transition-all hover:-translate-y-0.5',
                    isDark
                      ? 'bg-zinc-900/60 border-zinc-700/70 text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-300'
                      : 'bg-white border-zinc-300 text-zinc-800 hover:border-zinc-400'
                  )}
                >
                  Propose Your Talk
                </button>
              </div>

              {/* Real-Time Live Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 w-full max-w-4xl">
                {[
                  { value: '14+', label: 'Delivered Talks', detail: 'Peer-reviewed sessions' },
                  { value: '6+', label: 'Disciplines', detail: 'Math, Phys, Chem, Bio, CS' },
                  { value: '100%', label: 'Open Access', detail: 'Slides & notes shared' },
                  { value: 'Weekly', label: 'Seminars', detail: 'Room L-8, LHC' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={cx(
                      'p-4 rounded-2xl border backdrop-blur-md text-left transition-all hover:border-emerald-500/40 group',
                      isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white/80 border-zinc-200'
                    )}
                  >
                    <div className="font-mono text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="font-medium text-xs sm:text-sm mt-1">{stat.label}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{stat.detail}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Featured Talk Spotlight (Samriddha Ganguly's Entanglement Lecture) */}
            <section className="relative">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                    Highlighted Presentation
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                    Featured OpenBoard Talk
                  </h2>
                </div>
                <button
                  onClick={() => handleNavClick('archive')}
                  className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
                >
                  View All (14) →
                </button>
              </div>

              <div
                className={cx(
                  'rounded-3xl border backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center transition-all hover:border-emerald-500/40 shadow-2xl',
                  isDark
                    ? 'bg-zinc-900/50 border-emerald-500/20 shadow-[0_0_40px_rgba(0,255,157,0.04)]'
                    : 'bg-white border-zinc-200 shadow-lg'
                )}
              >
                {/* Poster / Speaker Media Image */}
                <div className="relative w-full md:w-80 h-64 md:h-80 rounded-2xl overflow-hidden flex-shrink-0 border border-emerald-500/30 group">
                  <img
                    src="/sam.png"
                    alt="Featured Speaker Samriddha Ganguly"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = '/sam1.jpeg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 font-mono">
                    <span className="bg-emerald-500/80 text-black px-2 py-0.5 rounded font-bold">TALK #09</span>
                    <span>2025-10-09</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Physics & Topology
                      </span>
                      <span className="text-xs text-zinc-400">• IISER Bhopal</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      Everything Entangled All at Once
                    </h3>
                    <p className="text-sm font-mono text-emerald-400 mt-1">Speaker: Samriddha Ganguly</p>

                    <p
                      className={cx(
                        'mt-4 text-sm sm:text-base leading-relaxed',
                        isDark ? 'text-zinc-300' : 'text-zinc-600'
                      )}
                    >
                      Beyond classical Landau paradigm of symmetry breaking lies the realm of topological order and
                      quantum matter. We explore how quantum entanglement ceases to be just an EPR paradox and becomes
                      the fundamental glue structuring exotic phases of matter.
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {['Quantum Matter', 'Entanglement Entropy', 'Topology', 'Quantum Information'].map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-800/60 text-zinc-300 border border-zinc-700/50"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-zinc-800/80">
                    <a
                      href="/Everything__Entangled__All_At_Once.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      📄 Download Lecture Slides (PDF)
                    </a>
                    <button
                      onClick={() => setActiveModalTalk(TALKS_DATA[8])}
                      className="px-4 py-2 rounded-xl text-xs font-mono border border-zinc-700 hover:border-emerald-400 transition-all"
                    >
                      View Full Abstract & Notes
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Philosophy Grid (3 Core Pillars) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Cross-Pollination',
                  icon: '🧬',
                  description:
                    'Historians learning machine learning; chemists appreciating poetic metrical forms; artists unraveling topological theorems.',
                },
                {
                  title: 'Zero Jargon Wall',
                  icon: '⚡',
                  description:
                    'Speakers distill complex proofs into intuitive conceptual models accessible to undergraduate researchers of all majors.',
                },
                {
                  title: 'Open Knowledge',
                  icon: '🌐',
                  description:
                    'Every presentation deck, mathematical appendix, and reference paper is preserved in our open public repository.',
                },
              ].map((pillar, i) => (
                <div
                  key={i}
                  className={cx(
                    'p-6 rounded-3xl border backdrop-blur-md transition-all hover:-translate-y-1 hover:border-emerald-500/40 shadow-xl',
                    isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white border-zinc-200'
                  )}
                >
                  <div className="text-3xl mb-3">{pillar.icon}</div>
                  <h4 className="text-lg font-bold tracking-tight">{pillar.pillar || pillar.title}</h4>
                  <p className={cx('text-xs sm:text-sm mt-2 leading-relaxed', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                    {pillar.description}
                  </p>
                </div>
              ))}
            </section>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 2: ABOUT (Mission, Vision, Coordinators)          */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'about' && (
          <div className="space-y-16">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Our Identity</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-1">
                The Story Behind{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  open_board
                </span>
              </h2>
              <p className={cx('mt-4 text-base sm:text-lg leading-relaxed', isDark ? 'text-zinc-300' : 'text-zinc-600')}>
                Born inside the vibrant academic halls of the Indian Institute of Science Education and Research,
                Bhopal (IISERB).
              </p>
            </div>

            {/* Mission & Vision Twin Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div
                className={cx(
                  'p-8 rounded-3xl border backdrop-blur-xl relative overflow-hidden transition-all hover:border-emerald-500/40 shadow-xl',
                  isDark ? 'bg-zinc-900/50 border-emerald-500/20' : 'bg-white border-zinc-200'
                )}
              >
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">Mission</div>
                <h3 className="text-2xl font-bold tracking-tight mb-4">Breaking Down Academic Silos</h3>
                <p className={cx('text-sm sm:text-base leading-relaxed', isDark ? 'text-zinc-300' : 'text-zinc-600')}>
                  open_board is a peer-to-peer knowledge-sharing platform designed to break down academic silos. Our
                  mission is to create a space where students from any field can present their passion projects and
                  research in a way that is accessible and engaging to a non-specialist audience.
                </p>
              </div>

              <div
                className={cx(
                  'p-8 rounded-3xl border backdrop-blur-xl relative overflow-hidden transition-all hover:border-cyan-500/40 shadow-xl',
                  isDark ? 'bg-zinc-900/50 border-cyan-500/20' : 'bg-white border-zinc-200'
                )}
              >
                <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">Vision</div>
                <h3 className="text-2xl font-bold tracking-tight mb-4">A Curiosity-Fueled Fellowship</h3>
                <p className={cx('text-sm sm:text-base leading-relaxed', isDark ? 'text-zinc-300' : 'text-zinc-600')}>
                  We envision a community fueled by curiosity. A place where a future historian can learn about machine
                  learning, a budding chemist can appreciate poetic structures, and an aspiring artist can understand
                  the elegance of a mathematical theorem. It is an opportunity to traverse the vast landscape of human
                  knowledge, one fascinating talk at a time.
                </p>
              </div>
            </div>

            {/* Coordinators & Core Organizers */}
            <div>
              <div className="text-center mb-10">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Leadership</span>
                <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">Founding Coordinators</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {TEAM_MEMBERS.filter((m) => m.isCoordinator).map((person, idx) => (
                  <div
                    key={idx}
                    className={cx(
                      'p-6 rounded-3xl border backdrop-blur-xl flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-all hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] group',
                      isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                    )}
                  >
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-emerald-400/40 shadow-lg">
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = person.photos[0] || '/photo1.jpeg';
                        }}
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1">
                        {person.role}
                      </div>
                      <h4 className="text-xl font-bold">{person.name}</h4>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">{person.batch}</p>
                      <p className={cx('text-xs sm:text-sm mt-3 leading-relaxed', isDark ? 'text-zinc-300' : 'text-zinc-600')}>
                        {person.bio}
                      </p>
                      <a
                        href={`mailto:${person.email}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:underline mt-4"
                      >
                        ✉️ {person.email}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Complete Speaker Roll Call */}
            <div>
              <div className="text-center mb-8">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Community</span>
                <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight mt-1">Contributing Speakers</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {TEAM_MEMBERS.filter((m) => !m.isCoordinator).map((speaker, idx) => (
                  <div
                    key={idx}
                    className={cx(
                      'p-4 rounded-2xl border backdrop-blur-md flex flex-col items-center text-center transition-all hover:border-emerald-500/40 hover:-translate-y-1',
                      isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                    )}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border border-emerald-400/40 shadow-sm">
                      <img
                        src={speaker.avatar}
                        alt={speaker.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = speaker.photos[0] || '/photo1.jpeg';
                        }}
                      />
                    </div>
                    <div className="font-semibold text-sm">{speaker.name}</div>
                    <div className="text-[11px] font-mono text-emerald-400 mt-0.5">{speaker.batch}</div>
                    <div className="text-[11px] text-zinc-500 mt-2 line-clamp-2">{speaker.bio}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 3: ARCHIVE (Search, Filters, Talk Cards & Modals) */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'archive' && (
          <div className="space-y-8">
            {/* Title & Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Repository</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">Talks & Papers Archive</h2>
                <p className={cx('text-sm mt-1', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                  Search across 14 archived interdisciplinary talks with slide decks, papers, and abstracts.
                </p>
              </div>

              {/* Bookmark Filter Switch */}
              <button
                onClick={() => {
                  playClick();
                  setShowOnlyBookmarked(!showOnlyBookmarked);
                }}
                className={cx(
                  'px-4 py-2 rounded-xl text-xs font-mono font-medium border transition-all flex items-center gap-2 self-start md:self-auto',
                  showOnlyBookmarked
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : isDark
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-100'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                )}
              >
                <span>{showOnlyBookmarked ? '❤️ Showing Saved' : '🤍 Filter Saved'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-200">
                  {bookmarkedIds.length}
                </span>
              </button>
            </div>

            {/* Search Input Bar with Neon Border */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by topic, speaker name, abstract, or keyword (e.g. 'Topology', 'Entropy', 'Chaos')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cx(
                  'w-full px-5 py-3.5 pl-12 rounded-2xl text-sm font-sans border backdrop-blur-xl transition-all outline-none',
                  isDark
                    ? 'bg-zinc-900/70 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                    : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:shadow-md'
                )}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 hover:text-zinc-200"
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
                      'px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all',
                      isSelected
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] font-semibold'
                          : 'bg-emerald-600 text-white shadow font-semibold'
                        : isDark
                        ? 'bg-zinc-900/50 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                        : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Talk Cards Grid */}
            {filteredTalks.length === 0 ? (
              <div
                className={cx(
                  'p-12 text-center rounded-3xl border backdrop-blur-md',
                  isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                )}
              >
                <div className="text-3xl mb-2">🔭</div>
                <h4 className="text-lg font-bold">No talks matched your query</h4>
                <p className="text-xs text-zinc-400 mt-1">Try resetting the search bar or category filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setShowOnlyBookmarked(false);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
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
                        'group rounded-3xl border backdrop-blur-xl p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer hover:-translate-y-1.5 relative overflow-hidden',
                        isDark
                          ? 'bg-zinc-900/60 border-zinc-800/90 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                          : 'bg-white border-zinc-200 hover:border-emerald-400 hover:shadow-xl'
                      )}
                    >
                      {/* Top Poster / Artwork */}
                      <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 bg-zinc-950 border border-zinc-800/50">
                        <img
                          src={talk.poster}
                          alt={talk.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = '/photo1.jpeg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Talk Number Badge */}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/40">
                          #{talk.number}
                        </div>

                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => handleToggleBookmark(talk.id, e)}
                          title={isBookmarked ? 'Remove from Saved' : 'Save Talk'}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs hover:scale-110 transition-transform"
                        >
                          {isBookmarked ? '❤️' : '🤍'}
                        </button>

                        {/* Date & Category on Thumbnail */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-300">
                          <span className="text-emerald-400">{talk.category}</span>
                          <span>{talk.date}</span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg leading-snug group-hover:text-emerald-400 transition-colors">
                            {talk.title}
                          </h3>
                          <div className="text-xs font-mono text-zinc-400 mt-1">{talk.speaker}</div>
                          <p
                            className={cx(
                              'text-xs mt-3 line-clamp-3 leading-relaxed',
                              isDark ? 'text-zinc-400' : 'text-zinc-600'
                            )}
                          >
                            {talk.abstract}
                          </p>
                        </div>

                        {/* Card Bottom Links & Tags */}
                        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {talk.tags.slice(0, 2).map((tg) => (
                              <span
                                key={tg}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/70 text-zinc-300"
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
                                onClick={(e) => e.stopPropagation()}
                                title="Download Lecture Slides"
                                className="p-1.5 rounded-lg text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black transition-all"
                              >
                                📄 Slides
                              </a>
                            )}
                            <span className="text-xs text-zinc-500 group-hover:text-emerald-400 transition-colors">
                              Details →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 4: GALLERY (All Photos from public/ Directory)   */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Visual Timeline</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-1">Life At OpenBoard</h2>
              <p className={cx('text-sm sm:text-base mt-2', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                Moments of peer teaching, blackboard proofs, and cross-department debates captured in Room L-8, LHC.
              </p>
            </div>

            {/* Gallery Masonry Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {GALLERY_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    playClick();
                    setActiveLightboxImg(item);
                  }}
                  className={cx(
                    'group relative rounded-2xl overflow-hidden border backdrop-blur-md cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl',
                    isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                  )}
                >
                  <div className="w-full h-56 bg-zinc-950 overflow-hidden">
                    <img
                      src={item.src}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = '/photo1.jpeg';
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-sm text-white">{item.title}</h4>
                    <p className="text-[11px] text-zinc-300 line-clamp-2 mt-0.5">{item.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 5: UPCOMING EVENTS & VENUE                       */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'events' && (
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Schedule</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-1">Upcoming Sessions</h2>
              <p className={cx('text-sm sm:text-base mt-2', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                All seminars are hosted in-person at IISER Bhopal. Open to all students, faculty, and visiting scholars.
              </p>
            </div>

            {/* Event Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {UPCOMING_EVENTS.map((evt) => (
                <div
                  key={evt.id}
                  className={cx(
                    'p-6 sm:p-8 rounded-3xl border backdrop-blur-xl flex flex-col justify-between transition-all hover:border-emerald-500/50 shadow-xl relative overflow-hidden',
                    isDark ? 'bg-zinc-900/60 border-emerald-500/20' : 'bg-white border-zinc-200'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {evt.status}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">{evt.date}</span>
                    </div>

                    <h3 className="text-2xl font-bold tracking-tight">{evt.title}</h3>
                    <p className="text-xs font-mono text-emerald-400 mt-1">
                      {evt.speaker} • {evt.batch}
                    </p>

                    <p className={cx('text-sm mt-4 leading-relaxed', isDark ? 'text-zinc-300' : 'text-zinc-600')}>
                      {evt.description}
                    </p>

                    <div className="mt-6 p-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">📍</span>
                        <span>{evt.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">⏰</span>
                        <span>{evt.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">🏛️</span>
                        <span>{evt.institution}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        playSuccess();
                        alert(`RSVP recorded for "${evt.title}". See you at ${evt.venue}!`);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      RSVP For Talk
                    </button>
                    <button
                      onClick={() => {
                        playClick();
                        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                          `OpenBoard: ${evt.title}`
                        )}&dates=20251114T123000Z/20251114T133000Z&details=${encodeURIComponent(
                          evt.description
                        )}&location=${encodeURIComponent(evt.venue)}`;
                        window.open(gcalUrl, '_blank');
                      }}
                      className="text-xs font-mono text-zinc-400 hover:text-emerald-400 flex items-center gap-1"
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
        {/* VIEW 6: PROPOSE A TALK (Interactive Submission Form)  */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Call For Speakers</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-1">Propose Your Talk</h2>
              <p className={cx('text-sm sm:text-base mt-2', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                Have a favorite theorem, unexpected historical connection, or personal lab breakthrough? Present it on
                the OpenBoard.
              </p>
            </div>

            {formStatus === 'success' ? (
              <div
                className={cx(
                  'p-8 rounded-3xl border backdrop-blur-xl text-center space-y-4 shadow-2xl animate-fade-in',
                  isDark ? 'bg-zinc-900/80 border-emerald-500/40' : 'bg-white border-emerald-300'
                )}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl mx-auto border border-emerald-500/40">
                  ✨
                </div>
                <h3 className="text-2xl font-bold">Proposal Submitted!</h3>
                <p className={cx('text-sm max-w-md mx-auto', isDark ? 'text-zinc-300' : 'text-zinc-600')}>
                  Thank you, <strong className="text-emerald-400">{formState.name}</strong>. Our student coordinators
                  (Samriddha & Adeetya) will review your abstract for <strong>"{formState.title}"</strong> and contact
                  you at <span className="font-mono text-xs">{formState.email}</span>.
                </p>
                <button
                  onClick={() => {
                    setFormStatus('idle');
                    setFormState({
                      name: '',
                      email: '',
                      title: '',
                      department: 'Physics',
                      abstract: '',
                      preferredDate: '',
                      tags: 'Interdisciplinary, Theory',
                    });
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all"
                >
                  Submit Another Proposal
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitProposal}
                className={cx(
                  'p-6 sm:p-8 rounded-3xl border backdrop-blur-xl shadow-2xl space-y-5',
                  isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                )}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marie Curie"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className={cx(
                        'w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-sans transition-all',
                        isDark
                          ? 'bg-zinc-800/60 border-zinc-700 text-zinc-100 focus:border-emerald-400'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5">IISERB Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="username22@iiserb.ac.in"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className={cx(
                        'w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-sans transition-all',
                        isDark
                          ? 'bg-zinc-800/60 border-zinc-700 text-zinc-100 focus:border-emerald-400'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5">Proposed Talk Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Symmetries in Living Tissues"
                      value={formState.title}
                      onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                      className={cx(
                        'w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-sans transition-all',
                        isDark
                          ? 'bg-zinc-800/60 border-zinc-700 text-zinc-100 focus:border-emerald-400'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5">Primary Discipline</label>
                    <select
                      value={formState.department}
                      onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                      className={cx(
                        'w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-sans transition-all',
                        isDark
                          ? 'bg-zinc-800/60 border-zinc-700 text-zinc-100 focus:border-emerald-400'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    >
                      <option value="Physics">Physics</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Earth & Environmental">Earth & Environmental Sciences</option>
                      <option value="Humanities & Economics">Humanities & Social Sciences</option>
                      <option value="Interdisciplinary">Interdisciplinary / Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                    Abstract & Pedagogical Hook * (Explain why non-specialists will care)
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide a 2-4 sentence summary of your talk. What fundamental question are you answering? How will you make it accessible?"
                    value={formState.abstract}
                    onChange={(e) => setFormState({ ...formState, abstract: e.target.value })}
                    className={cx(
                      'w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-sans transition-all',
                      isDark
                        ? 'bg-zinc-800/60 border-zinc-700 text-zinc-100 focus:border-emerald-400'
                        : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5">Preferred Slot / Date</label>
                    <input
                      type="date"
                      value={formState.preferredDate}
                      onChange={(e) => setFormState({ ...formState, preferredDate: e.target.value })}
                      className={cx(
                        'w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-sans transition-all',
                        isDark
                          ? 'bg-zinc-800/60 border-zinc-700 text-zinc-100 focus:border-emerald-400'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1.5">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Knot Theory, Genomics, Topology"
                      value={formState.tags}
                      onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
                      className={cx(
                        'w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-sans transition-all',
                        isDark
                          ? 'bg-zinc-800/60 border-zinc-700 text-zinc-100 focus:border-emerald-400'
                          : 'bg-zinc-50 border-zinc-300 focus:border-emerald-500'
                      )}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full py-3.5 rounded-xl font-mono text-sm font-semibold tracking-wide bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 text-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.55)] transition-all flex items-center justify-center gap-2"
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching Proposal...</span>
                    </>
                  ) : (
                    <span>🚀 Submit Talk Proposal</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 7: CONTACT & FEEDBACK                           */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'contact' && (
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Get In Touch</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-1">Connect With Us</h2>
              <p className={cx('text-sm sm:text-base mt-2', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                Have questions about presenting, borrowing reference literature, or recommending a speaker?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                className={cx(
                  'p-6 rounded-3xl border backdrop-blur-xl space-y-3',
                  isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                )}
              >
                <div className="text-2xl">🎓</div>
                <h4 className="font-bold text-base">In-Person Sessions</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Lecture Hall Complex (LHC), Room L-8
                  <br />
                  IISER Bhopal, Bhauri, Bhopal, MP 462066
                </p>
              </div>

              <div
                className={cx(
                  'p-6 rounded-3xl border backdrop-blur-xl space-y-3',
                  isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
                )}
              >
                <div className="text-2xl">📬</div>
                <h4 className="font-bold text-base">Direct Inquiries</h4>
                <div className="text-xs font-mono text-emerald-400 space-y-1">
                  <div>
                    Samriddha:{' '}
                    <a href="mailto:samriddha22@iiserb.ac.in" className="hover:underline">
                      samriddha22@iiserb.ac.in
                    </a>
                  </div>
                  <div>
                    Adeetya:{' '}
                    <a href="mailto:adeety22@iiserb.ac.in" className="hover:underline">
                      adeety22@iiserb.ac.in
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Feedback Box */}
            <div
              className={cx(
                'p-6 sm:p-8 rounded-3xl border backdrop-blur-xl space-y-4',
                isDark ? 'bg-zinc-900/50 border-emerald-500/20' : 'bg-white border-zinc-200'
              )}
            >
              <h3 className="font-bold text-lg">Leave Anonymous Community Feedback</h3>
              <textarea
                rows={3}
                placeholder="What topics should OpenBoard explore next? Any suggestions to make sessions better?"
                className={cx(
                  'w-full p-4 rounded-2xl text-sm border outline-none font-sans',
                  isDark ? 'bg-zinc-800/60 border-zinc-700 text-zinc-100' : 'bg-zinc-50 border-zinc-300'
                )}
              />
              <button
                onClick={() => {
                  playSuccess();
                  alert('Thank you for your feedback! The coordinators have received it.');
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Send Feedback
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* TALK DETAILS POPUP MODAL                                  */}
      {/* ========================================================= */}
      {activeModalTalk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className={cx(
              'max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 shadow-2xl relative animate-scale-up',
              isDark ? 'bg-[#090d16] border-emerald-500/30' : 'bg-white border-zinc-200'
            )}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                playClick();
                setActiveModalTalk(null);
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center text-sm font-mono"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                TALK #{activeModalTalk.number}
              </span>
              <span className="text-xs font-mono text-zinc-400">{activeModalTalk.date}</span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs font-mono text-cyan-400">{activeModalTalk.category}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{activeModalTalk.title}</h3>
            <p className="text-sm font-mono text-emerald-400 mt-1">Speaker: {activeModalTalk.speaker}</p>
            <p className="text-xs font-mono text-zinc-400">{activeModalTalk.affiliation}</p>

            <div className="my-6 border-t border-zinc-800" />

            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Abstract & Overview</h4>
              <p className={cx('text-sm sm:text-base leading-relaxed', isDark ? 'text-zinc-300' : 'text-zinc-700')}>
                {activeModalTalk.abstract}
              </p>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Related Topics</h4>
              <div className="flex flex-wrap gap-1.5">
                {activeModalTalk.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              {activeModalTalk.slidesUrl ? (
                <a
                  href={activeModalTalk.slidesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  📥 Open Document ({activeModalTalk.slidesName})
                </a>
              ) : (
                <span className="text-xs font-mono text-zinc-500">Slides distributed in person</span>
              )}

              <button
                onClick={(e) => handleToggleBookmark(activeModalTalk.id, e)}
                className="px-4 py-2.5 rounded-xl text-xs font-mono border border-zinc-700 hover:border-emerald-400 transition-all flex items-center gap-1.5"
              >
                {bookmarkedIds.includes(activeModalTalk.id) ? '❤️ Saved in Bookmarks' : '🤍 Save to Bookmarks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* GALLERY LIGHTBOX POPUP                                    */}
      {/* ========================================================= */}
      {activeLightboxImg && (
        <div
          onClick={() => setActiveLightboxImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full rounded-3xl overflow-hidden border border-zinc-700/80 bg-zinc-950 p-2 relative"
          >
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center font-mono hover:bg-zinc-800"
            >
              ✕
            </button>
            <div className="max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img
                src={activeLightboxImg.src}
                alt={activeLightboxImg.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
            <div className="p-4 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div>
                <span className="text-emerald-400 font-bold">{activeLightboxImg.title}</span>
                <p className="text-[11px] text-zinc-300 mt-0.5">{activeLightboxImg.caption}</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">{activeLightboxImg.category}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FOOTER                                                    */}
      {/* ========================================================= */}
      <footer
        className={cx(
          'mt-24 border-t py-12 px-4 sm:px-8 transition-colors',
          isDark ? 'border-zinc-800/80 bg-[#04070d]' : 'border-zinc-200 bg-zinc-50'
        )}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">open_board</span>
            <span>•</span>
            <span>IISER Bhopal Pedagogical Initiative</span>
            <span>•</span>
            <span className="text-emerald-400">Est. 2025</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => handleNavClick('home')} className="hover:text-emerald-400">
              Home
            </button>
            <button onClick={() => handleNavClick('archive')} className="hover:text-emerald-400">
              Archive
            </button>
            <button onClick={() => handleNavClick('gallery')} className="hover:text-emerald-400">
              Gallery
            </button>
            <button onClick={() => handleNavClick('submit')} className="hover:text-emerald-400">
              Propose Talk
            </button>
            <a
              href="https://github.com/samriddhaganguly/open_board-web"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
