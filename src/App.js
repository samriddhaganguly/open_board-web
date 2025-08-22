import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

// Helper to apply classes conditionally
const cx = (...classes) => classes.filter(Boolean).join(' ');

// --- [0] Sound Management Hook ---
// Manages interactive sound effects for the application.
const useSoundEffects = () => {
    const clickSynth = useRef(null);
    const submitSynth = useRef(null);
    const isAudioReady = useRef(false);

    useEffect(() => {
        const setupAudio = async () => {
            if (window.Tone && !isAudioReady.current) {
                await window.Tone.start();
                
                // Game Console Click Sound: A simple, clean sine wave with a sharp decay.
                clickSynth.current = new window.Tone.Synth({
                    oscillator: { type: 'triangle' },
                    envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.1 },
                }).toDestination();

                // "Power-up" sound for submission: A quick ascending arpeggio.
                submitSynth.current = new window.Tone.PolySynth(window.Tone.Synth, {
                    oscillator: { type: 'fmsquare' },
                    envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 },
                }).toDestination();

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
            clickSynth.current.triggerAttackRelease("C5", "32n");
        }
    };

    const playSubmitSound = () => {
        if (submitSynth.current) {
            const now = window.Tone.now();
            submitSynth.current.triggerAttackRelease(["C5", "E5", "G5"], "16n", now);
        }
    };

    return { playClick, playSwish: playSubmitSound }; // Exporting playSubmitSound as playSwish
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

// SVG Icon Components
const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const EmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const LinkedInIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
);

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.687-1.475L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.447-4.435-9.884-9.888-9.884-5.448 0-9.886 4.434-9.889 9.885.002 2.17.662 4.245 1.957 5.96.02.029.029.064.017.098l-1.181 4.324 4.463-1.164c.032-.008.067-.008.099.008z"/>
    </svg>
);

const GmailIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 4.5v15c0 .825-.675 1.5-1.5 1.5H1.5C.675 21 0 20.325 0 19.5v-15C0 3.675.675 3 1.5 3h21C23.325 3 24 3.675 24 4.5zm-2.19-1.5H2.19C1.725 3 1.5 3.225 1.5 3.69v.96l10.5 6.562L22.5 4.65v-.96c0-.465-.225-.69-.69-.69zm-1.31 2.812L12 12.825 3.5 6.812V19.5h17V6.812z"/>
    </svg>
);

const Header = ({ currentPage, navigateTo, toggleTheme, theme, playClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navItems = ['home', 'about', 'archive', 'gallery', 'events', 'submit', 'contact'];

    const handleNavClick = (page) => {
        playClick();
        navigateTo(page);
        setIsMenuOpen(false); // Close menu on navigation
    };

    return (
        <header className="flex flex-wrap justify-between items-center gap-x-6 gap-y-4 pb-8 border-b border-gray-300 dark:border-green-500 mb-12">
            <div 
                className="text-3xl font-bold text-gray-800 dark:text-green-400" 
                style={{ textShadow: theme === 'dark' ? '0 0 5px #33ff33, 0 0 10px #33ff33' : 'none' }}
            >
                open_board
            </div>

            {/* Hamburger Menu Button - visible only on small screens */}
            <div className="md:hidden">
                <button onClick={() => { playClick(); setIsMenuOpen(!isMenuOpen); }} className="p-2 rounded-md text-gray-600 dark:text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>
            </div>
            
            {/* Navigation Links */}
            <nav className={cx(
                'w-full md:w-auto md:flex',
                isMenuOpen ? 'block' : 'hidden'
            )}>
                <ul className="flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0">
                    {navItems.map((item) => (
                        <li key={item}>
                            <button
                                onClick={() => handleNavClick(item)}
                                className={cx(
                                    'text-sm uppercase px-3 py-1 border border-transparent transition-all duration-300 whitespace-nowrap w-full text-left md:w-auto',
                                    'text-gray-600 hover:text-black hover:border-gray-400',
                                    'dark:text-green-400 dark:hover:text-green-300 dark:hover:border-green-400 dark:hover:shadow-[inset_0_0_10px_rgba(51,255,51,0.3)]',
                                    currentPage === item && 'border-gray-400 dark:border-green-400 dark:text-green-200 dark:shadow-[inset_0_0_10px_rgba(51,255,51,0.3)]'
                                )}
                            >
                                [ <span className="text-py-function">{item}</span>() ]
                            </button>
                        </li>
                    ))}
                    <li>
                        <button 
                            onClick={() => { playClick(); toggleTheme(); }} 
                            className="ml-0 md:ml-2 p-2 rounded-full transition-colors duration-300 text-gray-600 dark:text-green-400 hover:bg-gray-200 dark:hover:bg-green-500/20"
                        >
                           {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
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
        <p>&copy; 2025 open_board. All rights reserved.</p>
        <p>Status: {status.replace(/\./g, '_')}</p>
    </footer>
);

const ContentSection = ({ title, children }) => (
    <div 
        className="bg-white dark:bg-black dark:bg-opacity-60 border border-gray-200 dark:border-green-700 p-4 md:p-8 mb-8 dark:backdrop-blur-sm font-mono"
    >
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-green-400 border-b-2 border-gray-300 dark:border-green-700 pb-2 mb-6 break-words" style={{ textShadow: '0 0 5px #33ff33' }}>
            {title}
        </h2>
        {children}
    </div>
);

// --- [3] Page Components ---

const HomePage = ({ navigateTo, playClick }) => (
    <div className="text-center flex flex-col items-center justify-center min-h-[60vh]">
        <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-green-400 glitch font-mono break-words"
        >
            <span className="text-py-keyword">print</span>(<span className="text-py-string">"Open_Knowledge, Shared_Insights"</span>)
        </h1>
        <p 
            className="text-lg text-gray-600 dark:text-green-400 max-w-2xl mx-auto my-6 font-mono"
        >
            <span className="text-py-string">"""<br />An interdisciplinary pedagogical initiative. We bring together<br />students from diverse fields to share, learn, and ignite curiosity.<br />"""</span>
        </p>
        <button
            onClick={() => { playClick(); navigateTo('about'); }}
            className="px-6 py-3 border border-gray-800 dark:border-green-400 text-gray-800 dark:text-green-400 bg-gray-500/10 dark:bg-green-400/10 uppercase tracking-widest font-bold transition-all duration-300 hover:bg-gray-800 hover:text-white dark:hover:bg-green-400 dark:hover:text-black dark:hover:shadow-[0_0_20px_rgba(51,255,51,0.7)]"
        >
            learn_more() &gt;
        </button>
    </div>
);

const AboutPage = () => (
     <>
        <ContentSection title={<><span className="text-py-keyword">def</span> <span className="text-py-function">our_mission</span>():</>}>
            <p className="text-gray-700 dark:text-green-400">
                <span className="text-py-string">"""<br />open_board is a peer-to-peer knowledge-sharing platform designed to break down academic silos. Our mission is to create a space where students from any field can present their passion projects and research in a way that is accessible and engaging to a non-specialist audience.<br />"""</span>
            </p>
        </ContentSection>
        <ContentSection title={<><span className="text-py-keyword">def</span> <span className="text-py-function">the_vision</span>():</>}>
            <p className="text-gray-700 dark:text-green-400">
                <span className="text-py-string">"""<br />We envision a community fueled by curiosity. A place where a future historian can learn about machine learning, a budding chemist can appreciate poetic structures, and an aspiring artist can understand the elegance of a mathematical theorem. It's an opportunity to traverse the vast landscape of human knowledge, one fascinating talk at a time.<br />"""</span>
            </p>
        </ContentSection>
     </>
);

const ArchivePage = () => {
    const talks = [
        { title: 'The Probabilistic Method', speaker: 'Adeetya Choubey', date: '2024-08-07' },
        { title: 'TBA', speaker: 'TBA', date: '2024-06-20' },
        { title: 'TBA', speaker: 'TBA', date: '2024-05-10' },
    ];

    return (
        <ContentSection title={<><span className="text-py-keyword">def</span> <span className="text-py-function">load_archives</span>():</>}>
            <p className="text-gray-500 dark:text-green-500 mb-8"><span className="text-py-comment"># Accessing data logs...</span></p>
            <div className="font-mono">
                {talks.map((talk, index) => (
                    <div key={index} className="border-l-4 border-gray-400 dark:border-green-500 pl-6 mb-8">
                        <p><span className="text-py-variable">talk_{index + 1}</span> = {'{'}</p>
                        <p className="pl-4 break-words"><span className="text-py-string">'title'</span>: <span className="text-py-string">"{talk.title}"</span>,</p>
                        <p className="pl-4 break-words"><span className="text-py-string">'speaker'</span>: <span className="text-py-string">"{talk.speaker}"</span>,</p>
                        <p className="pl-4"><span className="text-py-string">'date'</span>: <span className="text-py-string">"{talk.date}"</span></p>
                        <p>{'}'}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                            <a href="#" className="font-bold text-gray-700 dark:text-green-300 hover:underline">[ <span className="text-py-function">view_summary</span>() ]</a>
                            <a href="#" className="font-bold text-gray-700 dark:text-green-300 hover:underline">[ <span className="text-py-function">download_slides</span>() ]</a>
                        </div>
                    </div>
                ))}
            </div>
        </ContentSection>
    );
};

const Slideshow = ({ title, images, playClick }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(
            () => setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1)),
            3000
        );
        return () => {
            resetTimeout();
        };
    }, [currentIndex, images.length]);

    const goToPrevious = () => {
        playClick();
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        playClick();
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    return (
        <div className="w-full mb-8">
            <h3 className="text-center text-xl mb-2"><span className="text-py-variable">{title}</span></h3>
            <div className="relative w-full aspect-square overflow-hidden border-2 border-gray-400 dark:border-green-500 p-1">
                <img src={images[currentIndex]} alt={`${title} slide`} className="w-full h-full object-cover" />
                <button onClick={goToPrevious} className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full">
                    &#10094;
                </button>
                <button onClick={goToNext} className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full">
                    &#10095;
                </button>
            </div>
        </div>
    );
};

const GalleryPage = ({ playClick }) => {
    const galleries = {
        Posters: ['/talk1','/raman.png', '/aryan.png', '/harsh.png', '/dev.png', '/deo.png', '/manas.png', '/dhruv.png', '/ab.png'],
        Session_Snaps: ['/photo1.jpeg', '/photo2.jpeg', '/photo3.jpeg', 'pic','/ram1.jpeg', '/ram2.jpeg', '/ram3.jpeg','/aryan1.jpeg','/aryan2.jpeg','/aryan3.jpeg' ],
    };

    return (
        <ContentSection title={<><span className="text-py-keyword">def</span> <span className="text-py-function">init_visual_stream</span>():</>}>
            <p className="text-gray-500 dark:text-green-500 mb-8"><span className="text-py-comment"># Image captures from previous sessions.</span></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(galleries).map(([title, images]) => (
                    <Slideshow key={title} title={title} images={images} playClick={playClick} />
                ))}
            </div>
        </ContentSection>
    );
};

const UpcomingEventsPage = ({ playClick }) => {
    const events = [
        { date: '2025-08-07', time: '8:30 pm', venue: 'L-8, LHC', title: 'Probabilistic Method', speaker: 'Adeetya Choubey, 4th year Math Major', abstract: 'The probabilistic method, pioneered by Paul Erdős, was originally developed to tackle problems in graph theory and combinatorics. Over the past several decades, it has evolved into a powerful and versatile tool with applications spanning analysis, algebraic geometry, computer science, and more. In this talk, I will introduce the method as envisioned by Erdős and then highlight some of its applications. As part of the presentation, I will walk through some insightful proofs that demonstrate the elegance and utility of this approach. The talk is designed to be accessible; a background in some basic probability, along with some elementary mathematical maturity to follow structured arguments, should suffice as prerequisites.' },
        { date: '2025-08-14', time: '8:30 pm', venue: 'L-8, LHC', title: 'Butterflies, Chaos and Fractals', speaker: 'Sidharth Raman. 4th year Economics Major', abstract: 'Does the Flap of a Butterfly’s Wings in Brazil Set off a Tornado in Texas? Dynamical systems can exhibit chaotic, seemingly random behavior. This talk is about how the butterfly effect links chaos and the beautiful geometric objects, fractals.' },
        { date: '2025-08-21', time: '8:30 pm', venue: 'L-8, LHC', title: 'Stochastic simulation of chemical and non chemical systems using Gillespies algorithm', speaker: 'Aryan Gupta, 4th year Biology Major', abstract:'We shall depart from the classical way of modelling a chemical system, motivations, reasons and mechanisms of which will be explored in the talk followed by approaching some biological problems through the same lens. No assumptions about the audiences background will be presumed other than the curiosity for the subject.' },
        { date: '2025-08-22', time: '8:30 pm', venue: 'L-8, LHC', title: 'How I met your limit function', speaker: 'Harsh Tandon, 4th year Math Major', abstract: 'We often take the convergence of a sequence for granted, the points neatly line up towards a limit in a clean and intuitive way. But what happens when we try to apply this idea to a sequence of functions? Can a sequence of functions "converge" to another? The answer is a resounding yesnt, it depends on what do we mean by convergence of functions. In this talk we will explore various notions of convergencs, from pointwise, uniform to some rather bizzare ideas, understand the relation they have and observe some nice facts about them through OG examples.' },
        { date: '2025-08-29', time: '8:30 pm', venue: 'L-8, LHC', title: 'Coming Soon..', speaker: 'Vanshika Tripathi, 4th year Biology Major', abstract: 'To be announced.' },
        { date: '2025-09-04', time: '8:30 pm', venue: 'L-8, LHC', title: 'Strategic Lies and the Art of Truth Extraction', speaker: 'Manas Nandan, 4th year Economics Major', abstract: 'TPeople lie, and rational people lie rationally. They underreport income on taxes, shade their bids in auctions, or rank colleges strategically to gain an edge. If individuals are infinitely strategic, how can we ever uncover their true information? This is the central challenge of mechanism design, the branch of economics that engineers rules and institutions to make honesty the best strategy.                                                                                                                                                                       In this talk, I will show how truth-telling can be designed. We will see how governments use auctions to allocate billions of dollars in spectrum licenses while compelling firms to reveal their real valuations; how matching algorithms in medical residency programs and in kidney exchanges induce hospitals and students to state their genuine preferences; and why, in some cases, no mechanism can make honesty rational at all. The deeper lesson is that truth in society is not merely discovered, it is constructed through the rules we design.' },
        { date: '2025-09-05', time: '8:30 pm', venue: 'L-8, LHC', title: 'A Hitchhikers Guide to Hyperbolic Geometry', speaker: 'Dev Krishna, 4th year Math Major', abstract: 'Euclids 5th postulate states that for a line in the plane and a point not on the line, there exists a unique line passing through that point and parallel to the line. We ask a question: Can there be more than one line passing through that point, and is parallel to the initial line? The answer is yes, but the caveat is that it would no longer be Euclidean Geometry at all. So would it be legitimate geometry at all? The answer is Yes. This is what we call Hyperbolic Geometry. We will start with the discussion on the two main models of describing the hyperbolic plane. Then we discuss the notion of lines in this plane. After this, we will try to construct simple polygons using our new notion of "lines". At the end, we will be trying to formalize the notions of trigonometry in the new geometry. ' },
        { date: '2025-09-12', time: '8:30 pm', venue: 'L-8, LHC', title: '"Watt are the Chances?: Electrical Networks and Random Walks', speaker: 'Deo Ishaan Prashant, 4th Year Math Major', abstract: 'Electrical networks and random walks are two seemingly unrelated concepts, but the mathematics behind them reveals deep connections. One can, in fact, be used to model the other. In this talk, we will view random walks through the lens of electrical networks, leading to some surprising conclusions — about drunk people, drunk birds, and even drunk higher-dimensional beings.' },
        { date: '2025-10-09', time: '8:30 pm', venue: 'L-8, LHC', title: 'Physics is Cool', speaker: 'Samriddha Ganguly, 4th year Physics major', abstract: 'TBD' },
        { date: '2025-10-16', time: '8:30 pm', venue: 'L-8, LHC', title: 'An ODEyssey into Neural Differential Equations', speaker: 'Dhruv Dua, 3rd year Physics Major', abstract: 'In this talk, we will introduce Neural Differential Equations (NDEs), a recent approach that combines ideas from deep learning and differential equations. Instead of thinking of a neural network as a sequence of layers, an NDE treats it as a continuous dynamical system where the change of the hidden state is described by a differential equation. We will cover the basic definitions, motivation, and mathematical structure of NDEs, along with how they are trained. To illustrate their usefulness, we will look at examples from physics and finance. The goal of the talk is to give students across both natural and engineering sciences a clear and accessible first understanding of this exciting area.' },
        { date: '2025-10-17', time: '8:30 pm', venue: 'L-8, LHC', title: 'Occupied!', speaker: 'TBA', abstract: 'To be announced.' },
        { date: '2025-10-23', time: '8:30 pm', venue: 'L-8, LHC', title: 'Bifurcations and How to Find them', speaker: 'Abeer Singh, 2nd Year PMD Pre-major', abstract: 'How bifurcations is everywhere in complex and deterministic systems. In a nutshell, why does a airplane wing vibrate during high intensity wind? Why do you have unusual non linear oscillatory behaviour in heart rate? Why this? Why that?' },
        { date: '2025-10-30', time: '8:30 pm', venue: 'L-8, LHC', title: 'Open Slot', speaker: 'TBA', abstract: 'To be announced.' },
        { date: '2025-10-31', time: '8:30 pm', venue: 'L-8, LHC', title: 'Open Slot', speaker: 'TBA', abstract: 'To be announced.' },
        { date: '2025-11-13', time: '8:30 pm', venue: 'L-8, LHC', title: 'Open Slot', speaker: 'TBA', abstract: 'To be announced.' },
        { date: '2025-11-14', time: '8:30 pm', venue: 'L-8, LHC', title: 'Biology in Life', speaker: 'Pratham Shah', abstract: 'To be announced.' },
    ];
    
    const [selectedDay, setSelectedDay] = useState(null);
    const [expandedMobileEvent, setExpandedMobileEvent] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 1)); // Start with August 2025

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const eventsByDate = events.reduce((acc, event) => {
        const date = new Date(event.date);
        if (date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear()) {
            const day = date.getDate();
            if (!acc[day]) acc[day] = [];
            acc[day].push(event);
        }
        return acc;
    }, {});

    const changeMonth = (offset) => {
        playClick();
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
        setSelectedDay(null);
    };
    
    const selectedEvents = selectedDay ? eventsByDate[selectedDay] : null;

    return (
        <ContentSection title={<><span className="text-py-keyword">def</span> <span className="text-py-function">upcoming_events</span>():</>}>
            <div className="flex justify-between items-center text-center mb-6">
                 <button onClick={() => changeMonth(-1)} className="hidden md:block p-2 rounded-full hover:bg-gray-200 dark:hover:bg-green-500/20">&#10094;</button>
                <h3 className="text-2xl font-bold">
                    <span className="text-py-string">"{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}"</span>
                </h3>
                 <button onClick={() => changeMonth(1)} className="hidden md:block p-2 rounded-full hover:bg-gray-200 dark:hover:bg-green-500/20">&#10095;</button>
            </div>
            
            {/* Desktop Calendar Grid */}
            <div className="hidden md:grid grid-cols-7 gap-2">
                {days.map(day => <div key={day} className="text-center font-bold text-py-variable">{day}</div>)}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }).map((_, day) => {
                    const dayNumber = day + 1;
                    const dayEvents = eventsByDate[dayNumber];
                    return (
                        <button key={dayNumber} onClick={() => { if(dayEvents) { playClick(); setSelectedDay(dayNumber); } }} className={cx(
                            'p-2 border border-gray-300 dark:border-green-700 h-28 overflow-hidden text-left',
                            dayEvents && 'bg-green-100 dark:bg-green-900/50 cursor-pointer hover:ring-2 ring-green-400',
                            selectedDay === dayNumber && 'ring-2 ring-offset-2 ring-green-500'
                        )}>
                            <div className={cx('font-bold', dayEvents ? 'text-py-keyword' : 'text-gray-500 dark:text-green-500')}>{dayNumber}</div>
                            {dayEvents && dayEvents.map((event, i) => (
                                <div key={i} className="block text-xs mt-1 text-py-string truncate">{event.title}</div>
                            ))}
                        </button>
                    );
                })}
            </div>
            
            {/* Mobile Event List */}
            <div className="md:hidden">
                {events.length > 0 ? (
                    events.map((event, index) => (
                        <div key={index} className="mb-4 border-l-4 border-green-500 pl-4 cursor-pointer" onClick={() => setExpandedMobileEvent(expandedMobileEvent === index ? null : index)}>
                            <p className="font-bold text-py-variable">{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {event.time}</p>
                            <p className="text-py-string">"{event.title}"</p>
                            {expandedMobileEvent === index && (
                                <div className="mt-2 text-sm">
                                    <p><span className="text-py-keyword">speaker</span>: <span className="text-py-string">"{event.speaker}"</span></p>
                                    <p><span className="text-py-keyword">venue</span>: <span className="text-py-string">"{event.venue}"</span></p>
                                    <p className="mt-2"><span className="text-py-comment"># Abstract:</span></p>
                                    <p className="text-gray-700 dark:text-green-400 whitespace-pre-wrap">{event.abstract}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-py-comment"># No upcoming events scheduled. Check back soon.</p>
                )}
            </div>

            {/* Event Details Section for Desktop */}
            {selectedEvents && (
                <div className="mt-8 border-t-2 border-green-700 pt-4">
                    <h3 className="text-xl font-bold mb-4"><span className="text-py-variable">event_details</span> for <span className="text-py-string">{currentDate.toLocaleString('default', { month: 'long' })} {selectedDay}</span>:</h3>
                    {selectedEvents.map((event, i) => (
                        <div key={i} className="mb-4">
                            <p><span className="text-py-keyword">title</span> = <span className="text-py-string">"{event.title}"</span></p>
                            <p><span className="text-py-keyword">speaker</span> = <span className="text-py-string">"{event.speaker}"</span></p>
                            <p><span className="text-py-keyword">time</span> = <span className="text-py-string">"{event.time}"</span></p>
                            <p><span className="text-py-keyword">venue</span> = <span className="text-py-string">"{event.venue}"</span></p>
                            <p className="mt-2"><span className="text-py-comment"># Abstract:</span></p>
                            <p className="text-gray-700 dark:text-green-400 whitespace-pre-wrap">{event.abstract}</p>
                        </div>
                    ))}
                </div>
            )}
        </ContentSection>
    );
};


const SubmitPage = ({ playSwish }) => {
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [selectedTags, setSelectedTags] = useState(new Set());
    const tags = ['Physics', 'Mathematics', 'Biology', 'Economics', 'Earth Sciences', 'Environmental Sciences', 'Social Sciences', 'EECS', 'Applied Sciences and Engineering'];

    const handleTagClick = (tag) => {
        setSelectedTags(prev => {
            const newTags = new Set(prev);
            if (newTags.has(tag)) {
                newTags.delete(tag);
            } else {
                newTags.add(tag);
            }
            return newTags;
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        playSwish(); // Play the submit sound
        setStatus('submitting');
        
        const form = event.target;
        const formData = new FormData(form);
        
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            abstract: formData.get('abstract'),
            date_preference: formData.get('date_preference'),
            tags: Array.from(selectedTags).join(', ')
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
             setSelectedTags(new Set());
        })
        .catch(error => {
            console.error('Error!', error.message);
            setStatus('error');
        });
    };

    return (
        <>
            <ContentSection title={<><span className="text-py-keyword">def</span> <span className="text-py-function">submission_guidelines</span>():</>}>
                <ul className="list-disc list-inside text-gray-700 dark:text-green-400 space-y-2">
                    <li><span className="text-py-string">"Accessible to an audience with at most 2nd-year knowledge of any subject, preferably even 1st years should be able to grasp with proper motivation."</span></li>
                    <li><span className="text-py-string">"Talk should be at least 30-45 mins."</span></li>
                    <li><span className="text-py-string">"Please mention any prerequisites, motivational articles, or keywords for your abstract."</span></li>
                </ul>
            </ContentSection>
            <ContentSection title={<><span className="text-py-keyword">def</span> <span className="text-py-function">submit_abstract</span>(<span className="text-py-params">data</span>):</>}>
                <p className="text-gray-500 dark:text-green-500 mb-8"><span className="text-py-comment"># Ready to contribute? Use the form below to submit your talk proposal.</span></p>
                <form 
                    className="flex flex-col gap-6" 
                    onSubmit={handleSubmit}
                >
                    <div>
                        <label htmlFor="name" className="block mb-2 text-gray-700 dark:text-green-400"><span className="text-py-comment"># Name / Handle</span></label>
                        <input type="text" id="name" name="name" required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none font-mono" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block mb-2 text-gray-700 dark:text-green-400"><span className="text-py-comment"># Contact Email</span></label>
                        <input type="email" id="email" name="email" required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none font-mono" />
                    </div>
                    <div>
                        <label htmlFor="date_preference" className="block mb-2 text-gray-700 dark:text-green-400"><span className="text-py-comment"># Date Preference</span></label>
                        <input type="text" id="date_preference" name="date_preference" required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none font-mono" />
                    </div>
                    <div>
                        <label className="block mb-2 text-gray-700 dark:text-green-400"><span className="text-py-comment"># Subject Tags (Select all that apply)</span></label>
                        <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                                <button
                                    type="button"
                                    key={tag}
                                    onClick={() => handleTagClick(tag)}
                                    className={cx(
                                        'px-3 py-1 border rounded-full transition-colors duration-200',
                                        selectedTags.has(tag)
                                            ? 'bg-green-500 text-black border-green-500'
                                            : 'bg-transparent border-gray-400 dark:border-green-700 text-gray-600 dark:text-green-400'
                                    )}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="abstract" className="block mb-2 text-gray-700 dark:text-green-400"><span className="text-py-comment"># Abstract (Max 300 words)</span></label>
                        <textarea id="abstract" name="abstract" rows="5" required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none font-mono"></textarea>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            type="submit" 
                            disabled={status === 'submitting'} 
                            className="self-start px-6 py-3 border border-gray-800 dark:border-green-400 text-gray-800 dark:text-green-400 bg-gray-500/10 dark:bg-green-400/10 uppercase tracking-widest font-bold transition-all duration-300 hover:bg-gray-800 hover:text-white dark:hover:bg-green-400 dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'submitting' ? 'transmitting_data...' : 'transmit_data()'}
                        </button>
                        {status === 'success' && <p className="text-green-400"><span className="text-py-keyword">return</span> <span className="text-py-string">"Success! Submission received."</span></p>}
                        {status === 'error' && <p className="text-red-500"><span className="text-py-keyword">raise</span> Exception(<span className="text-py-string">"Error! Please try again."</span>)</p>}
                    </div>
                </form>
            </ContentSection>
        </>
    );
};

const SubscribeForm = ({ playSwish }) => {
    const [status, setStatus] = useState('idle');

    const handleSubmit = (event) => {
        event.preventDefault();
        playSwish();
        setStatus('subscribing');

        const form = event.target;
        const data = { email: form.email.value };

        const scriptURL = "https://script.google.com/macros/s/AKfycbyjnJlKboO36YUzfFTjfuoQCCbKJUXaqlcgUdEaPSu_qmH8nCWY8EvJY95ruvw7tvM4GA/exec";

        fetch(scriptURL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
        <div className="my-8 font-mono">
            <h4 className="text-lg mb-2 text-gray-800 dark:text-green-400"><span className="text-py-comment"># subscribe_to_mailing_list</span></h4>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-center">
                <input 
                    type="email" 
                    name="email" 
                    placeholder="your_email@domain.com"
                    required 
                    className="w-full sm:w-auto flex-grow p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none font-mono"
                />
                <button 
                    type="submit" 
                    disabled={status === 'subscribing'}
                    className="w-full sm:w-auto px-6 py-2 border border-gray-800 dark:border-green-400 text-gray-800 dark:text-green-400 bg-gray-500/10 dark:bg-green-400/10 uppercase tracking-widest font-bold transition-all duration-300 hover:bg-gray-800 hover:text-white dark:hover:bg-green-400 dark:hover:text-black disabled:opacity-50"
                >
                    {status === 'subscribing' ? 'subscribing...' : 'subscribe()'}
                </button>
            </form>
            {status === 'success' && <p className="text-green-400 mt-2"><span className="text-py-keyword">return</span> <span className="text-py-string">"Success! Welcome aboard."</span></p>}
            {status === 'error' && <p className="text-red-500 mt-2"><span className="text-py-keyword">raise</span> Exception(<span className="text-py-string">"Error! Please try again."</span>)</p>}
        </div>
    );
};

const ContactPage = ({ playSwish }) => {
    const coordinators = [
        { name: 'Samriddha_Ganguly', designation: 'Physics Major 2022 Batch', gmail: 'samriddha22@iiserb.ac.in', linkedin: 'https://www.linkedin.com/in/samriddha-ganguly-3360bb16a/' },
        { name: 'Adeetya_Choubey', designation: 'Math Major 2022 Batch', gmail: 'adeety22@iiserb.ac.in', linkedin: 'https://www.linkedin.com/in/adeetya-choubey-6b2a44254/' }
    ];

    return (
        <>
            {/* THIS IS THE NEW SECTION TO ADD */}
            <ContentSection title={<><span className="text-py-keyword">def</span> <span className="text-py-function">open_board_socials</span>():</>}>
                <p className="text-gray-700 dark:text-green-400 mb-4">
                    <span className="text-py-string">"""Follow us for the latest updates and discussions."""</span>
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-4 items-center">
                    {/* WhatsApp Link */}
                    <a
                        href="https://whatsapp.com/channel/0029Vb63g00D8SDxWIIeLU2r"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-600 dark:text-green-400 hover:text-black dark:hover:text-green-200 transition-colors"
                        title="Join our WhatsApp Channel"
                    >
                        <WhatsAppIcon />
                        <span className="font-mono hidden sm:inline">[ WhatsApp Channel ]</span>
                    </a>

                    {/* Gmail Link */}
                    <a
                        href="mailto:openboardinitiative@gmail.com"
                        className="flex items-center gap-3 text-gray-600 dark:text-green-400 hover:text-black dark:hover:text-green-200 transition-colors"
                        title="Email us"
                    >
                        <GmailIcon />
                        <span className="font-mono hidden sm:inline">[ openboardinitiative@gmail.com ]</span>
                    </a>
                </div>
            </ContentSection>
            <ContentSection title={<><span className="text-py-keyword">class</span> <span className="text-py-function">Coordinators</span>:</>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {coordinators.map((coord, index) => (
                        <div key={index}>
                            <p><span className="text-py-variable">coordinator_{index+1}</span> = {'{'}</p>
                            <p className="pl-4"><span className="text-py-string">'name'</span>: <span className="text-py-string">"{coord.name}"</span>,</p>
                            <p className="pl-4"><span className="text-py-string">'designation'</span>: <span className="text-py-string">"{coord.designation}"</span></p>
                            <p>{'}'}</p>
                            <div className="flex gap-4 mt-4 pl-4">
                                <a href={`mailto:${coord.gmail}`} className="text-gray-600 dark:text-green-400 hover:text-black dark:hover:text-green-200 transition-colors" title={coord.gmail}>
                                    <EmailIcon />
                                </a>
                                <a href={coord.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-green-400 hover:text-black dark:hover:text-green-200 transition-colors" title={coord.linkedin}>
                                    <LinkedInIcon />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </ContentSection>
            
            <ContentSection title={<><span className="text-py-keyword">def</span> <span className="text-py-function">get_updates</span>(<span className="text-py-params">email</span>):</>}>
                <p className="text-gray-700 dark:text-green-400 mb-4">
                    <span className="text-py-string">"""Subscribe to receive information about our talks."""</span>
                </p>
                <SubscribeForm playSwish={playSwish} />
            </ContentSection>
        </>
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
            case 'gallery': return <GalleryPage playClick={playClick} />;
            case 'events': return <UpcomingEventsPage playClick={playClick} />;
            case 'submit': return <SubmitPage playSwish={playSwish} />;
            case 'contact': return <ContactPage playSwish={playSwish} />;
            case 'home':
            default:
                return <HomePage navigateTo={setPage} playClick={playClick} />;
        }
    };

    const footerStatus = {
        home: 'System_nominal. Awaiting_input...',
        about: 'Signal_clear.',
        archive: 'Archive_integrity_verified.',
        gallery: 'Visuals_rendered.',
        events: 'Scanning_for_upcoming_events...',
        submit: 'Awaiting_transmission.',
        contact: 'Connection_established.',
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

                /* Python Syntax Highlighting Colors */
                .text-py-keyword { color: #f92672; } /* Pink for keywords like def */
                .dark .text-py-keyword { color: #f92672; }
                .light .text-py-keyword { color: #c678dd; }

                .text-py-function { color: #e6db74; } /* Yellow for function names */
                .dark .text-py-function { color: #e6db74; }
                .light .text-py-function { color: #61afef; }
                
                .text-py-string { color: #a6e22e; } /* Green for strings */
                .dark .text-py-string { color: #a6e22e; }
                .light .text-py-string { color: #98c379; }

                .text-py-comment { color: #75715e; } /* Gray for comments */
                .dark .text-py-comment { color: #75715e; }
                .light .text-py-comment { color: #5c6370; }

                .text-py-params { color: #fd971f; } /* Orange for parameters */
                .dark .text-py-params { color: #fd971f; }
                .light .text-py-params { color: #d19a66; }

                .text-py-variable { color: #66d9ef; } /* Light blue for variables */
                .dark .text-py-variable { color: #66d9ef; }
                .light .text-py-variable { color: #e06c75; }

            `}</style>
            
            <BackgroundAnimation theme={theme} />
            <div className="text-gray-800 dark:text-green-300 min-h-screen transition-colors duration-500">
                <div className="relative z-10 container mx-auto p-4 sm:p-8 max-w-5xl">
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
