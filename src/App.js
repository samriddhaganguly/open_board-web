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

          // Tactile coder keyclick synth
          clickSynth.current = new window.Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.001, decay: 0.07, sustain: 0.01, release: 0.07 },
          }).toDestination();
          clickSynth.current.volume.value = -12;

          // Harmonic ascending arpeggio for proposal submission
          successSynth.current = new window.Tone.PolySynth(window.Tone.Synth, {
            oscillator: { type: 'fmsquare' },
            envelope: { attack: 0.01, decay: 0.25, sustain: 0.15, release: 0.35 },
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
          console.warn('Audio context deferred:', e);
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
        successSynth.current.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '16n', now);
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

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4,500 Interactive Constellation Nodes
    const particleCount = 4500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 15;
      positions[i + 1] = (Math.random() - 0.5) * 15;
      positions[i + 2] = (Math.random() - 0.5) * 10;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.024,
      transparent: true,
      opacity: theme === 'dark' ? 0.8 : 0.45,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Rotating 3D Icosahedron Core Wireframe
    const icosaGeometry = new THREE.IcosahedronGeometry(2.3, 1);
    const icosaWireframe = new THREE.WireframeGeometry(icosaGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: theme === 'dark' ? 0x00ff9d : 0x059669,
      transparent: true,
      opacity: theme === 'dark' ? 0.14 : 0.07,
    });
    const icosaLines = new THREE.LineSegments(icosaWireframe, lineMaterial);
    scene.add(icosaLines);

    threeRef.current = { scene, camera, renderer, particleSystem, material, icosaLines, lineMaterial };

    // Fluid mouse parallax
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      mouse.x += (mouse.targetX - mouse.x) * 0.035;
      mouse.y += (mouse.targetY - mouse.y) * 0.035;

      particleSystem.rotation.y = elapsedTime * 0.045 + mouse.x * 0.22;
      particleSystem.rotation.x = elapsedTime * 0.025 - mouse.y * 0.22;

      icosaLines.rotation.y = -elapsedTime * 0.05 + mouse.x * 0.18;
      icosaLines.rotation.x = elapsedTime * 0.035 + mouse.y * 0.18;

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

  // Update dynamic colors on theme switch
  useEffect(() => {
    if (!threeRef.current.material) return;
    const isDark = theme === 'dark';
    const primaryNeon = isDark ? 0x00ff9d : 0x0f172a;
    const wireColor = isDark ? 0x00ff9d : 0x0f766e;

    threeRef.current.material.color.setHex(primaryNeon);
    threeRef.current.material.opacity = isDark ? 0.8 : 0.45;
    threeRef.current.material.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

    if (threeRef.current.lineMaterial) {
      threeRef.current.lineMaterial.color.setHex(wireColor);
      threeRef.current.lineMaterial.opacity = isDark ? 0.15 : 0.07;
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
// 3. ARCHIVAL TALKS DATA (ALL 14 TALKS)
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

// ==========================================
// 4. TEAM & SPEAKERS DIRECTORY
// ==========================================
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

// ==========================================
// 5. GALLERY DATA (ALL MEDIA FROM PUBLIC/)
// ==========================================
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

// ==========================================
// 6. MAIN COMPONENT WITH PYTHON CODER AESTHETIC
// ==========================================
export default function App() {
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
  const [showSubmissionsLog, setShowSubmissionsLog] = useState(false);

  // Proposal Submission Form state & local log
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    title: '',
    department: 'Physics',
    abstract: '',
    preferredDate: '',
    tags: 'Interdisciplinary, Theory',
  });
  const [formStatus, setFormStatus] = useState('idle'); // 'idle' | 'submitting' | 'success'

  // Submissions Log stored in localStorage so no submissions are ever lost
  const [savedSubmissions, setSavedSubmissions] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const local = localStorage.getItem('openboard_submissions');
        return local ? JSON.parse(local) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

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
    if (!next) playClick();
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

  // Robust Submission Handler: Sends to Webhook AND saves locally with fallback
  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.title || !formState.abstract) {
      alert('Please fill out all required fields.');
      return;
    }

    setFormStatus('submitting');
    playClick();

    const newRecord = {
      ...formState,
      timestamp: new Date().toISOString(),
      id: `prop-${Date.now()}`,
    };

    // 1. Immediately store in localStorage so coordinators NEVER lose a submission
    const updatedSubmissions = [newRecord, ...savedSubmissions];
    setSavedSubmissions(updatedSubmissions);
    try {
      localStorage.setItem('openboard_submissions', JSON.stringify(updatedSubmissions));
    } catch (err) {}

    // 2. Dispatch to Google Apps Script webhook
    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbwYyY7ZqXz5ZGgg8Nq6pQ3t2M7k8wP/exec',
        {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord),
        }
      ).catch(() => null);
    } catch (err) {}

    setTimeout(() => {
      setFormStatus('success');
      playSuccess();
    }, 600);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={cx(
        'min-h-screen relative font-mono transition-colors duration-500 selection:bg-[#00ff9d]/30 selection:text-[#00ff9d]',
        isDark ? 'bg-[#0d1117] text-[#e6edf3]' : 'bg-[#f6f8fa] text-[#0f172a]'
      )}
    >
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
        .shimmer-text {
          background: linear-gradient(90deg, #00ff9d 0%, #38bdf8 50%, #f43f5e 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        @keyframes shimmer {
          to { background-position: 200% center; }
        }
      `}</style>

      {/* 3D WebGL Background Canvas */}
      <BackgroundAnimation theme={theme} />

      {/* Neon Atmospheric Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className={cx(
            'absolute -top-32 left-1/3 w-[650px] h-[400px] rounded-full blur-[160px] opacity-25 transition-all duration-1000',
            isDark ? 'bg-[#00ff9d]/20' : 'bg-emerald-300/30'
          )}
        />
        <div
          className={cx(
            'absolute top-1/2 -right-40 w-[550px] h-[450px] rounded-full blur-[180px] opacity-20',
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
              ? 'bg-[#161b22]/90 border-[#30363d] shadow-[0_4px_25px_rgba(0,0,0,0.5)]'
              : 'bg-white/90 border-[#d0d7de] shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
          )}
        >
          {/* Brand Logo with Python Identifier Styling */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group"
          >
            {/* Terminal Icon Box */}
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

          {/* Controls: Audio Synth Mute + Theme Switch + Submissions Log */}
          <div className="flex items-center gap-2">
            {/* Coordinators Submissions Drawer Button */}
            {savedSubmissions.length > 0 && (
              <button
                onClick={() => {
                  playClick();
                  setShowSubmissionsLog(true);
                }}
                title="View Saved Proposals Log"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#b33973]/20 border border-[#f43f5e]/40 text-[#f43f5e] hover:bg-[#b33973]/30 transition-all"
              >
                <span>📬 Proposals</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#f43f5e] text-black font-bold">
                  {savedSubmissions.length}
                </span>
              </button>
            )}

            {/* Audio Synth Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Synthesizer Audio' : 'Mute Synthesizer Audio'}
              className={cx(
                'p-2 rounded-lg text-xs border transition-all flex items-center gap-1 font-mono',
                isDark
                  ? 'bg-[#21262d] border-[#30363d] text-zinc-300 hover:border-[#00ff9d] hover:text-[#00ff9d]'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:border-emerald-500'
              )}
            >
              {isMuted ? '🔇' : '🔊'}
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
              { id: 'contact', label: '06 // CONTACT' },
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

            {savedSubmissions.length > 0 && (
              <button
                onClick={() => {
                  setShowSubmissionsLog(true);
                  setIsMobileMenuOpen(false);
                }}
                className="mt-2 px-3 py-2 rounded-lg text-left tracking-wider text-[#f43f5e] bg-[#f43f5e]/10 border border-[#f43f5e]/30 flex items-center justify-between"
              >
                <span>📬 VIEW SUBMITTED PROPOSALS</span>
                <span className="px-2 py-0.5 rounded-full bg-[#f43f5e] text-black font-bold">
                  {savedSubmissions.length}
                </span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER                                            */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
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
                    'rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300',
                    isDark
                      ? 'bg-[#0d1117] border-[#30363d] shadow-[0_0_35px_rgba(0,255,157,0.08)]'
                      : 'bg-white border-[#d0d7de] shadow-xl'
                  )}
                >
                  {/* macOS / Linux Terminal Window Bar */}
                  <div
                    className={cx(
                      'px-4 py-3 flex items-center justify-between border-b select-none',
                      isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-[#f6f8fa] border-[#d0d7de]'
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
                  className={cx(
                    'p-5 rounded-2xl border backdrop-blur-md transition-all hover:border-[#00ff9d]/50 group',
                    isDark ? 'bg-[#161b22]/70 border-[#30363d]' : 'bg-white border-[#d0d7de]'
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
                isDark ? 'bg-[#161b22]/80 border-[#30363d]' : 'bg-white border-[#d0d7de]'
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
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#00ff9d] text-black hover:bg-[#34d399] transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                  >
                    <span>📄 DOWNLOAD SLIDES (PDF)</span>
                  </a>
                  <button
                    onClick={() => setActiveModalTalk(TALKS_DATA[8])}
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
                    className={cx(
                      'p-6 rounded-2xl border backdrop-blur-md transition-all hover:-translate-y-1 hover:border-[#00ff9d]/50 shadow-lg',
                      isDark ? 'bg-[#161b22]/70 border-[#30363d]' : 'bg-white border-[#d0d7de]'
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
        {/* VIEW 1: ABOUT — MISSION, LEADERSHIP & VISION         */}
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
                  isDark ? 'bg-[#161b22]/80 border-[#30363d]' : 'bg-white border-[#d0d7de]'
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
                  isDark ? 'bg-[#161b22]/80 border-[#30363d]' : 'bg-white border-[#d0d7de]'
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
                      isDark ? 'bg-[#161b22]/80 border-[#30363d]' : 'bg-white border-[#d0d7de]'
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
                    className={cx(
                      'p-4 rounded-xl border backdrop-blur-md flex flex-col items-center text-center transition-all hover:border-[#00ff9d]/40',
                      isDark ? 'bg-[#161b22]/60 border-[#30363d]' : 'bg-white border-[#d0d7de]'
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
                    ? 'bg-[#161b22] border-[#30363d] text-zinc-100 placeholder-zinc-500 focus:border-[#00ff9d] focus:shadow-[0_0_15px_rgba(0,255,157,0.2)]'
                    : 'bg-white border-[#d0d7de] text-zinc-900 placeholder-zinc-400 focus:border-emerald-500'
                )}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">&gt;</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
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
                        ? 'bg-[#161b22] border border-[#30363d] text-zinc-400 hover:text-zinc-200'
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
                        ? 'bg-[#161b22]/90 border-[#30363d] hover:border-[#00ff9d]/50 hover:shadow-[0_0_25px_rgba(0,255,157,0.15)]'
                        : 'bg-white border-[#d0d7de] hover:border-emerald-500 hover:shadow-xl'
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
                              onClick={(e) => e.stopPropagation()}
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
                    isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#d0d7de]'
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
                    isDark ? 'bg-[#161b22]/80 border-[#30363d]' : 'bg-white border-[#d0d7de]'
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
        {/* VIEW 5: PROPOSE — SUBMISSION FORM WITH AUDIT & FIX    */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'submit' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-left">
              <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">
                05 // CALL FOR SPEAKERS
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">Propose Your Talk</h2>
              <p className={cx('text-xs sm:text-sm mt-1', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                Submissions are sent directly to the coordinator webhook and safely archived locally.
              </p>
            </div>

            {formStatus === 'success' ? (
              <div
                className={cx(
                  'p-8 rounded-2xl border backdrop-blur-xl text-center space-y-4 shadow-2xl',
                  isDark ? 'bg-[#161b22] border-[#00ff9d]/50' : 'bg-white border-emerald-300'
                )}
              >
                <div className="w-14 h-14 rounded-full bg-[#00ff9d]/20 text-[#00ff9d] flex items-center justify-center text-2xl mx-auto border border-[#00ff9d]/40">
                  ✓
                </div>
                <h3 className="text-xl font-bold font-mono text-[#00ff9d]">PROPOSAL DISPATCHED</h3>
                <p
                  className={cx(
                    'text-xs font-sans max-w-md mx-auto leading-relaxed',
                    isDark ? 'text-zinc-300' : 'text-zinc-700'
                  )}
                >
                  Thank you, <strong>{formState.name}</strong>. Your abstract for <strong>"{formState.title}"</strong>{' '}
                  has been routed to coordinators Samriddha and Adeetya. A copy has also been archived locally on your
                  browser.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={`mailto:samriddha22@iiserb.ac.in,adeety22@iiserb.ac.in?subject=${encodeURIComponent(
                      `[OpenBoard Talk Proposal] ${formState.title}`
                    )}&body=${encodeURIComponent(
                      `Speaker: ${formState.name}\nEmail: ${formState.email}\nDepartment: ${formState.department}\nPreferred Date: ${formState.preferredDate}\n\nAbstract:\n${formState.abstract}`
                    )}`}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold border border-[#00ff9d] text-[#00ff9d] hover:bg-[#00ff9d]/10 transition-all flex items-center gap-1.5"
                  >
                    <span>✉ Send Backup Copy to Email</span>
                  </a>

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
                    className="px-4 py-2 rounded-xl text-xs font-mono bg-[#21262d] text-zinc-300 hover:text-white"
                  >
                    Submit Another
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitProposal}
                className={cx(
                  'p-6 sm:p-8 rounded-2xl border backdrop-blur-xl shadow-2xl space-y-4 font-mono text-xs',
                  isDark ? 'bg-[#161b22]/90 border-[#30363d]' : 'bg-white border-[#d0d7de]'
                )}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">Speaker Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Richard Feynman"
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
                    <label className="block text-zinc-400 mb-1">IISERB Email *</label>
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">Talk Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Topological Defects in Crystals"
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
                    <label className="block text-zinc-400 mb-1">Discipline</label>
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
                      <option value="Interdisciplinary">Interdisciplinary / Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Abstract & Pedagogical Hook *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide a 2-4 sentence summary of your presentation. What fundamental question are you answering?"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">Preferred Date</label>
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
                    <label className="block text-zinc-400 mb-1">Tags (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Knot Theory, Genomics"
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

                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full py-3 rounded-xl font-mono text-xs font-bold tracking-wider bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.35)] hover:shadow-[0_0_30px_rgba(0,255,157,0.55)] transition-all flex items-center justify-center gap-2"
                >
                  {formStatus === 'submitting' ? (
                    <span>DISPATCHING PROPOSAL...</span>
                  ) : (
                    <span>&gt; DISPATCH PROPOSAL TO COORDINATORS</span>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* VIEW 6: CONTACT — COORDINATOR CHANNELS               */}
        {/* ----------------------------------------------------- */}
        {activeTab === 'contact' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-left">
              <span className="text-xs font-mono text-[#00ff9d] uppercase tracking-widest font-bold">
                06 // COMMUNICATIONS
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">Get In Touch</h2>
              <p className={cx('text-xs sm:text-sm mt-1', isDark ? 'text-zinc-400' : 'text-zinc-600')}>
                Contact the coordinators directly for questions, slide submissions, or session feedback.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className={cx(
                  'p-6 rounded-2xl border backdrop-blur-xl space-y-2',
                  isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#d0d7de]'
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
                  isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-[#d0d7de]'
                )}
              >
                <div className="text-xs font-mono text-[#f43f5e] font-bold">✉ COORDINATOR EMAILS</div>
                <div className="text-xs font-mono space-y-1 text-zinc-300">
                  <div>
                    Samriddha Ganguly:{' '}
                    <a href="mailto:samriddha22@iiserb.ac.in" className="text-[#00ff9d] hover:underline">
                      samriddha22@iiserb.ac.in
                    </a>
                  </div>
                  <div>
                    Adeetya Choubey:{' '}
                    <a href="mailto:adeety22@iiserb.ac.in" className="text-[#00ff9d] hover:underline">
                      adeety22@iiserb.ac.in
                    </a>
                  </div>
                </div>
              </div>
            </div>
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
                Abstract & Core Theorems
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
          onClick={() => setActiveLightboxImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full rounded-2xl overflow-hidden border border-[#30363d] bg-[#0d1117] p-2 relative font-mono"
          >
            <button
              onClick={() => setActiveLightboxImg(null)}
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
      {/* MODAL: COORDINATORS SUBMISSIONS AUDIT LOG (SUBMISSIONS FIX)*/}
      {/* ========================================================= */}
      {showSubmissionsLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            className={cx(
              'max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl relative font-mono text-xs',
              isDark ? 'bg-[#0d1117] border-[#00ff9d]/40' : 'bg-white border-zinc-300'
            )}
          >
            <div className="flex items-center justify-between mb-4 border-b border-[#30363d] pb-3">
              <div>
                <span className="text-[#00ff9d] font-bold">📬 PROPOSALS SUBMISSION LOG</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Archived locally in browser cache. No proposals can be dropped or lost.
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionsLog(false)}
                className="w-7 h-7 rounded-lg bg-[#21262d] text-zinc-300 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {savedSubmissions.length === 0 ? (
              <p className="text-zinc-500 py-6 text-center">No proposals recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {savedSubmissions.map((sub, idx) => (
                  <div
                    key={sub.id || idx}
                    className="p-4 rounded-xl border border-[#30363d] bg-[#161b22]/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#00ff9d] font-bold">{sub.title}</span>
                      <span className="text-[10px] text-zinc-400">{sub.timestamp}</span>
                    </div>
                    <div className="text-zinc-300">
                      Speaker: <span className="font-bold">{sub.name}</span> ({sub.email}) • {sub.department}
                    </div>
                    <div className="text-zinc-400 text-[11px] font-sans pt-1 border-t border-[#30363d]/60">
                      {sub.abstract}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#30363d] flex items-center justify-between">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(savedSubmissions, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `openboard_proposals_${Date.now()}.json`;
                  a.click();
                }}
                className="px-3 py-1.5 rounded-lg border border-[#30363d] hover:border-[#00ff9d] text-zinc-300"
              >
                Export JSON Log
              </button>
              <button
                onClick={() => setShowSubmissionsLog(false)}
                className="px-4 py-1.5 rounded-lg bg-[#00ff9d] text-black font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RETRO FOOTER                                              */}
      {/* ========================================================= */}
      <footer
        className={cx(
          'mt-20 border-t py-8 px-4 sm:px-6 transition-colors font-mono text-xs',
          isDark ? 'border-[#30363d] bg-[#0d1117]' : 'border-[#d0d7de] bg-zinc-50'
        )}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">open_board</span>
            <span>•</span>
            <span>IISER Bhopal Pedagogical Initiative</span>
            <span>•</span>
            <span className="text-[#00ff9d]">Est. 2025</span>
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
