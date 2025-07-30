import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// Helper to apply classes conditionally
const cx = (...classes) => classes.filter(Boolean).join(' ');

// --- [0] Sound Management Hook ---
// Manages interactive sound effects for the application.
const useSoundEffects = () => {
    const clickSynth = useRef(null);
    const explosionSynth = useRef(null);
    const isAudioReady = useRef(false);

    useEffect(() => {
        const setupAudio = async () => {
            if (window.Tone && !isAudioReady.current) {
                await window.Tone.start();
                
                // Futuristic Click Sound: A high-pitched, metallic synth
                clickSynth.current = new window.Tone.MetalSynth({
                    frequency: 400,
                    envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
                    harmonicity: 3.1,
                    modulationIndex: 32,
                    resonance: 4000,
                    octaves: 1.5
                }).toDestination();

                // Explosive Sound: A combination of a deep kick and white noise with distortion
                const kick = new window.Tone.MembraneSynth({
                    pitchDecay: 0.05,
                    octaves: 10,
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
                });
                
                const noise = new window.Tone.NoiseSynth({
                    noise: { type: "white" },
                    envelope: { attack: 0.005, decay: 0.2, sustain: 0 },
                });

                const distortion = new window.Tone.Distortion(0.4).toDestination();
                
                explosionSynth.current = { kick, noise };
                explosionSynth.current.kick.connect(distortion);
                explosionSynth.current.noise.connect(distortion);

                isAudioReady.current = true;
                console.log("Audio context and synths ready.");
                document.body.removeEventListener('click', setupAudio);
            }
        };

        document.body.addEventListener('click', setupAudio);

        return () => {
            document.body.removeEventListener('click', setupAudio);
        };
    }, []);

    const playClick = () => {
        if (clickSynth.current) {
            clickSynth.current.triggerAttackRelease("C6", "32n");
        }
    };

    const playExplosion = () => {
        if (explosionSynth.current) {
            const now = window.Tone.now();
            explosionSynth.current.kick.triggerAttackRelease("C2", "8n", now);
            explosionSynth.current.noise.triggerAttackRelease("16n", now + 0.01);
        }
    };

    return { playClick, playSwish: playExplosion }; // Exporting playExplosion as playSwish for compatibility
};


// --- [1] Animation Component ---
// Adapts particle color based on the current theme.
const BackgroundAnimation = ({ theme }) => {
    const mountRef = useRef(null);
    const threeRef = useRef({}); // To hold three.js objects

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const currentMount = mountRef.current;
        
        if (!threeRef.current.scene) {
            threeRef.current.scene = new THREE.Scene();
            threeRef.current.camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
            threeRef.current.renderer = new THREE.WebGLRenderer({ alpha: true });
            currentMount.appendChild(threeRef.current.renderer.domElement);

            const particleCount = 5000;
            const particles = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount * 3; i++) {
                positions[i] = (Math.random() - 0.5) * 10;
            }
            particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const particleMaterial = new THREE.PointsMaterial({
                size: 0.02,
                transparent: true,
                depthWrite: false,
            });
            
            threeRef.current.particleSystem = new THREE.Points(particles, particleMaterial);
            threeRef.current.scene.add(threeRef.current.particleSystem);
            threeRef.current.camera.position.z = 5;

            const mouse = new THREE.Vector2();
            const handleMouseMove = (event) => {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            };
            window.addEventListener('mousemove', handleMouseMove);
            threeRef.current.mouse = mouse;

            const clock = new THREE.Clock();
            const animate = () => {
                if (!threeRef.current.renderer) return;
                requestAnimationFrame(animate);
                const elapsedTime = clock.getElapsedTime();
                threeRef.current.particleSystem.rotation.y = elapsedTime * 0.1;
                threeRef.current.camera.position.x += (threeRef.current.mouse.x * 0.5 - threeRef.current.camera.position.x) * 0.02;
                threeRef.current.camera.position.y += (threeRef.current.mouse.y * 0.5 - threeRef.current.camera.position.y) * 0.02;
                threeRef.current.camera.lookAt(threeRef.current.scene.position);
                threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
            };
            animate();
        }

        const particleColor = theme === 'dark' ? 0x33ff33 : 0x1a1a1a;
        threeRef.current.particleSystem.material.color.setHex(particleColor);
        threeRef.current.particleSystem.material.blending = theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending;

        const handleResize = () => {
            if (!threeRef.current.camera) return;
            threeRef.current.camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            threeRef.current.camera.updateProjectionMatrix();
            threeRef.current.renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
             window.removeEventListener('resize', handleResize);
        };
    }, [theme]); 

    return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

// --- [2] UI Components ---

const Header = ({ currentPage, navigateTo, toggleTheme, theme, playClick }) => {
    const navItems = ['home', 'about', 'archive', 'gallery', 'submit'];
    return (
        <header className="flex flex-wrap justify-between items-center gap-x-6 gap-y-4 pb-8 border-b border-gray-300 dark:border-green-500 mb-12">
            <div 
                className="text-3xl font-bold text-gray-800 dark:text-green-400" 
                style={{ textShadow: theme === 'dark' ? '0 0 5px #33ff33, 0 0 10px #33ff33' : 'none' }}
            >
                OpenBoard
            </div>
            <nav>
                <ul className="flex items-center flex-wrap gap-x-4 gap-y-2">
                    {navItems.map((item) => (
                        <li key={item}>
                            <button
                                onClick={() => { playClick(); navigateTo(item); }}
                                className={cx(
                                    'text-sm uppercase px-3 py-1 border border-transparent transition-all duration-300 whitespace-nowrap',
                                    'text-gray-600 hover:text-black hover:border-gray-400',
                                    'dark:text-green-400 dark:hover:text-green-300 dark:hover:border-green-400 dark:hover:shadow-[inset_0_0_10px_rgba(51,255,51,0.3)]',
                                    currentPage === item && 'border-gray-400 dark:border-green-400 dark:text-green-200 dark:shadow-[inset_0_0_10px_rgba(51,255,51,0.3)]'
                                )}
                            >
                                [ {item} ]
                            </button>
                        </li>
                    ))}
                    <li>
                        <button 
                            onClick={() => { playClick(); toggleTheme(); }} 
                            className="ml-2 px-3 py-1 border border-gray-400 dark:border-green-500 text-gray-600 dark:text-green-400 text-sm uppercase hover:bg-gray-200 dark:hover:bg-green-500/20 transition-colors whitespace-nowrap"
                        >
                           {theme === 'dark' ? '[ LITE ]' : '[ DARK ]'}
                        </button>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

const Footer = ({ status }) => (
    <footer 
        className="text-center pt-8 mt-12 border-t border-gray-200 dark:border-green-700 text-sm text-gray-500 dark:text-green-500"
    >
        <p>&copy; 2024 OpenBoard. All rights reserved.</p>
        <p>Status: {status}</p>
    </footer>
);

const ContentSection = ({ title, children }) => (
    <div 
        className="bg-white dark:bg-black dark:bg-opacity-60 border border-gray-200 dark:border-green-700 p-8 mb-8 dark:backdrop-blur-sm"
    >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-green-400 border-b-2 border-gray-300 dark:border-green-700 pb-2 mb-6" style={{ textShadow: '0 0 5px #33ff33' }}>
            // {title}
        </h2>
        {children}
    </div>
);

// --- [3] Page Components ---

const HomePage = ({ navigateTo, playClick }) => (
    <div className="text-center flex flex-col items-center justify-center min-h-[60vh]">
        <h1 
            className="text-5xl font-bold text-gray-800 dark:text-green-400 glitch"
        >
            Open Knowledge, Shared Insights.
        </h1>
        <p 
            className="text-lg text-gray-600 dark:text-green-400 max-w-2xl mx-auto my-6"
        >
            An interdisciplinary pedagogical initiative. We bring together students from diverse fields to share, learn, and ignite curiosity.
        </p>
        <button
            onClick={() => { playClick(); navigateTo('about'); }}
            className="px-6 py-3 border border-gray-800 dark:border-green-400 text-gray-800 dark:text-green-400 bg-gray-500/10 dark:bg-green-400/10 uppercase tracking-widest font-bold transition-all duration-300 hover:bg-gray-800 hover:text-white dark:hover:bg-green-400 dark:hover:text-black dark:hover:shadow-[0_0_20px_rgba(51,255,51,0.7)]"
        >
            Learn More &gt;
        </button>
    </div>
);

const AboutPage = () => (
     <>
        <ContentSection title="Our Mission">
            <p className="text-gray-700 dark:text-green-400">OpenBoard is a peer-to-peer knowledge-sharing platform designed to break down academic silos. Our mission is to create a space where students from any field can present their passion projects and research in a way that is accessible and engaging to a non-specialist audience.</p>
        </ContentSection>
        <ContentSection title="The Vision">
            <p className="text-gray-700 dark:text-green-400">We envision a community fueled by curiosity. A place where a future historian can learn about machine learning, a budding chemist can appreciate poetic structures, and an aspiring artist can understand the elegance of a mathematical theorem. It's an opportunity to traverse the vast landscape of human knowledge, one fascinating talk at a time.</p>
        </ContentSection>
     </>
);

const ArchivePage = () => {
    const talks = [
        { title: 'The Quantum Basis of Photosynthesis', speaker: 'Jane Doe (Dept. of Physics)', date: '2024-07-15' },
        { title: 'Narrative Structures in Procedural Generation', speaker: 'John Smith (Dept. of Computer Science)', date: '2024-06-20' },
        { title: 'The Geopolitics of Submarine Internet Cables', speaker: 'Alex Ray (Dept. of International Relations)', date: '2024-05-10' },
    ];

    return (
        <ContentSection title="Session Archives">
            <p className="text-gray-500 dark:text-green-500 mb-8">Accessing data logs... Below are the records of past transmissions.</p>
            <div>
                {talks.map((talk, index) => (
                    <div key={index} className="border-l-4 border-gray-400 dark:border-green-500 pl-6 mb-8">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-green-400">{talk.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-green-500 mb-2">{talk.speaker} | Date: {talk.date}</p>
                        <div className="flex gap-4">
                            <a href="#" className="font-bold text-gray-700 dark:text-green-300 hover:underline">[ View Summary ]</a>
                            <a href="#" className="font-bold text-gray-700 dark:text-green-300 hover:underline">[ Download Slides ]</a>
                        </div>
                    </div>
                ))}
            </div>
        </ContentSection>
    );
};

const GalleryPage = () => {
    const images = [
        'https://placehold.co/400x300/0a0a0a/33ff33?text=Session+I',
        'https://placehold.co/400x300/0a0a0a/33ff33?text=Speaker',
        'https://placehold.co/400x300/0a0a0a/33ff33?text=Audience',
        'https://placehold.co/400x300/0a0a0a/33ff33?text=Q%26A',
    ];
    return (
        <ContentSection title="Visual Data Stream">
            <p className="text-gray-500 dark:text-green-500 mb-8">Image captures from previous sessions.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {images.map((src, index) => (
                    <div 
                        key={index} 
                        className="border-2 border-gray-400 dark:border-green-500 p-1 transition-transform duration-300 hover:scale-105"
                    >
                        <img src={src} alt={`Gallery image ${index + 1}`} className="w-full h-auto" />
                    </div>
                ))}
            </div>
        </ContentSection>
    );
};

const SubmitPage = ({ playSwish }) => {
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const handleSubmit = (event) => {
        event.preventDefault();
        playSwish(); // Play the swish sound on submit
        setStatus('submitting');
        
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            abstract: formData.get('abstract'),
        };

        const scriptURL = "https://script.google.com/macros/s/AKfycbyiUl916nvX0Xp4wFy0XZOBUllTJ49r1z1U-cxJ98UhEDbxt5o5gWIz9ZtrP5o44S2a/exec";

        fetch(scriptURL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(data),
        })
        .then(response => {
             console.log('Success!', response);
             setStatus('success');
             form.reset();
        })
        .catch(error => {
            console.error('Error!', error.message);
            setStatus('error');
        });
    };

    return (
        <ContentSection title="Submit an Abstract">
            <p className="text-gray-500 dark:text-green-500 mb-8">Ready to contribute? Use the form below to submit your talk proposal.</p>
            <form 
                className="flex flex-col gap-6" 
                onSubmit={handleSubmit}
            >
                <div>
                    <label htmlFor="name" className="block mb-2 text-gray-700 dark:text-green-400">Name / Handle</label>
                    <input type="text" id="name" name="name" required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none" />
                </div>
                <div>
                    <label htmlFor="email" className="block mb-2 text-gray-700 dark:text-green-400">Contact Email</label>
                    <input type="email" id="email" name="email" required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none" />
                </div>
                <div>
                    <label htmlFor="abstract" className="block mb-2 text-gray-700 dark:text-green-400">Abstract (Max 300 words)</label>
                    <textarea id="abstract" name="abstract" rows="5" required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none"></textarea>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        type="submit" 
                        disabled={status === 'submitting'} 
                        className="self-start px-6 py-3 border border-gray-800 dark:border-green-400 text-gray-800 dark:text-green-400 bg-gray-500/10 dark:bg-green-400/10 uppercase tracking-widest font-bold transition-all duration-300 hover:bg-gray-800 hover:text-white dark:hover:bg-green-400 dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'submitting' ? 'Transmitting...' : 'Transmit Data'}
                    </button>
                    {status === 'success' && <p className="text-green-400">Success! Submission received.</p>}
                    {status === 'error' && <p className="text-red-500">Error! Please try again.</p>}
                </div>
            </form>
        </ContentSection>
    );
};


// --- [4] Main App Component ---
export default function App() {
    const [page, setPage] = useState('home');
    const [theme, setTheme] = useState('dark'); // 'dark' or 'light'
    const { playClick, playSwish } = useSoundEffects();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const renderPage = () => {
        switch (page) {
            case 'about': return <AboutPage />;
            case 'archive': return <ArchivePage />;
            case 'gallery': return <GalleryPage />;
            case 'submit': return <SubmitPage playSwish={playSwish} />;
            case 'home':
            default:
                return <HomePage navigateTo={setPage} playClick={playClick} />;
        }
    };

    const footerStatus = {
        home: 'System nominal. Awaiting input...',
        about: 'Signal clear.',
        archive: 'Archive integrity verified.',
        gallery: 'Visuals rendered.',
        submit: 'Awaiting transmission.',
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
                
                body {
                    font-family: 'Space Mono', monospace;
                    transition: background-color 0.5s ease;
                }

                html.light {
                    background-color: #ffffff;
                }
                html.dark {
                    background-color: #000000;
                }

                .glitch {
                    animation: glitch-flicker 2s infinite linear;
                }
                
                .light .glitch {
                    color: #1f2937; /* Dark gray for light mode */
                }

                @keyframes glitch-flicker {
                    0% {
                        text-shadow: 0.05em 0 0 rgba(0, 255, 0, 0.75), -0.05em 0 0 rgba(255, 0, 0, 0.75);
                    }
                    25% {
                        text-shadow: -0.05em 0 0 rgba(0, 255, 0, 0.75), 0.05em 0 0 rgba(255, 0, 0, 0.75);
                    }
                    50% {
                        text-shadow: 0.02em 0.02em 0 rgba(0, 255, 0, 0.75), -0.02em -0.02em 0 rgba(255, 0, 0, 0.75);
                    }
                    75% {
                        text-shadow: 0.05em 0 0 rgba(0, 255, 0, 0.75), -0.05em 0 0 rgba(255, 0, 0, 0.75);
                    }
                    100% {
                        text-shadow: -0.05em 0 0 rgba(0, 255, 0, 0.75), 0.05em 0 0 rgba(255, 0, 0, 0.75);
                    }
                }
            `}</style>
            
            <BackgroundAnimation theme={theme} />
            <div className="text-gray-800 dark:text-green-300 min-h-screen transition-colors duration-500">
                <div className="relative z-10 container mx-auto p-8 max-w-5xl">
                    <Header 
                        currentPage={page} 
                        navigateTo={setPage} 
                        toggleTheme={toggleTheme} 
                        theme={theme}
                        playClick={playClick} 
                    />
                    <main>
                       {renderPage()}
                    </main>
                    <Footer status={footerStatus[page]} />
                </div>
            </div>
        </>
    );
}
