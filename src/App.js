import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to apply classes conditionally
const cx = (...classes) => classes.filter(Boolean).join(' ');

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

const Header = ({ currentPage, navigateTo, toggleTheme, theme }) => {
    const navItems = ['home', 'about', 'archive', 'gallery', 'submit'];
    return (
        <header className="flex flex-wrap justify-between items-center gap-x-6 gap-y-4 pb-8 border-b border-gray-300 dark:border-green-500 mb-12">
            <motion.div 
                className="text-3xl font-bold text-gray-800 dark:text-green-400" 
                style={{ textShadow: theme === 'dark' ? '0 0 5px #33ff33, 0 0 10px #33ff33' : 'none' }}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                OpenBoard
            </motion.div>
            <nav>
                <ul className="flex items-center flex-wrap gap-x-4 gap-y-2">
                    {navItems.map((item, i) => (
                        <motion.li 
                            key={item}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                        >
                            <motion.button
                                onClick={() => navigateTo(item)}
                                className={cx(
                                    'text-sm uppercase px-3 py-1 border border-transparent transition-all duration-300 whitespace-nowrap',
                                    'text-gray-600 hover:text-black hover:border-gray-400',
                                    'dark:text-green-400 dark:hover:text-green-300 dark:hover:border-green-400 dark:hover:shadow-[inset_0_0_10px_rgba(51,255,51,0.3)]',
                                    currentPage === item && 'border-gray-400 dark:border-green-400 dark:text-green-200 dark:shadow-[inset_0_0_10px_rgba(51,255,51,0.3)]'
                                )}
                                whileHover={{ y: -2, scale: 1.05 }}
                                whileTap={{ y: 1, scale: 0.95 }}
                            >
                                [ {item} ]
                            </motion.button>
                        </motion.li>
                    ))}
                    <motion.li
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                    >
                        <motion.button 
                            onClick={toggleTheme} 
                            className="ml-2 px-3 py-1 border border-gray-400 dark:border-green-500 text-gray-600 dark:text-green-400 text-sm uppercase hover:bg-gray-200 dark:hover:bg-green-500/20 transition-colors whitespace-nowrap"
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ y: 1, scale: 0.95 }}
                        >
                           {theme === 'dark' ? '[ LITE ]' : '[ DARK ]'}
                        </motion.button>
                    </motion.li>
                </ul>
            </nav>
        </header>
    );
};

const Footer = ({ status }) => (
    <motion.footer 
        className="text-center pt-8 mt-12 border-t border-gray-200 dark:border-green-700 text-sm text-gray-500 dark:text-green-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
    >
        <p>&copy; 2024 OpenBoard. All rights reserved.</p>
        <p>Status: {status}</p>
    </motion.footer>
);

const ContentSection = ({ title, children }) => (
    <motion.div 
        className="bg-white dark:bg-black dark:bg-opacity-60 border border-gray-200 dark:border-green-700 p-8 mb-8 dark:backdrop-blur-sm"
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.6, 0.05, -0.01, 0.9] }}
    >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-green-400 border-b-2 border-gray-300 dark:border-green-700 pb-2 mb-6" style={{ textShadow: '0 0 5px #33ff33' }}>
            // {title}
        </h2>
        {children}
    </motion.div>
);

// --- [3] Page Components ---

const HomePage = ({ navigateTo }) => (
    <div className="text-center flex flex-col items-center justify-center min-h-[60vh]">
        <motion.h1 
            className="text-5xl font-bold text-gray-800 dark:text-green-400 glitch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            Open Knowledge, Shared Insights.
        </motion.h1>
        <motion.p 
            className="text-lg text-gray-600 dark:text-green-400 max-w-2xl mx-auto my-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        >
            An interdisciplinary pedagogical initiative. We bring together students from diverse fields to share, learn, and ignite curiosity.
        </motion.p>
        <motion.button
            onClick={() => navigateTo('about')}
            className="px-6 py-3 border border-gray-800 dark:border-green-400 text-gray-800 dark:text-green-400 bg-gray-500/10 dark:bg-green-400/10 uppercase tracking-widest font-bold transition-all duration-300 hover:bg-gray-800 hover:text-white dark:hover:bg-green-400 dark:hover:text-black dark:hover:shadow-[0_0_20px_rgba(51,255,51,0.7)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ y: 1, scale: 0.95 }}
        >
            Learn More &gt;
        </motion.button>
    </div>
);

const AboutPage = () => {
    const containerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3
            }
        }
    };
    return (
     <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <ContentSection title="Our Mission">
            <p className="text-gray-700 dark:text-green-400">OpenBoard is a peer-to-peer knowledge-sharing platform designed to break down academic silos. Our mission is to create a space where students from any field can present their passion projects and research in a way that is accessible and engaging to a non-specialist audience.</p>
        </ContentSection>
        <ContentSection title="The Vision">
            <p className="text-gray-700 dark:text-green-400">We envision a community fueled by curiosity. A place where a future historian can learn about machine learning, a budding chemist can appreciate poetic structures, and an aspiring artist can understand the elegance of a mathematical theorem. It's an opportunity to traverse the vast landscape of human knowledge, one fascinating talk at a time.</p>
        </ContentSection>
     </motion.div>
    );
};

const ArchivePage = () => {
    const talks = [
        { title: 'The Quantum Basis of Photosynthesis', speaker: 'Jane Doe (Dept. of Physics)', date: '2024-07-15' },
        { title: 'Narrative Structures in Procedural Generation', speaker: 'John Smith (Dept. of Computer Science)', date: '2024-06-20' },
        { title: 'The Geopolitics of Submarine Internet Cables', speaker: 'Alex Ray (Dept. of International Relations)', date: '2024-05-10' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <ContentSection title="Session Archives">
            <p className="text-gray-500 dark:text-green-500 mb-8">Accessing data logs... Below are the records of past transmissions.</p>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {talks.map((talk, index) => (
                    <motion.div 
                        key={index} 
                        variants={itemVariants} 
                        className="border-l-4 border-gray-400 dark:border-green-500 pl-6 mb-8 transition-shadow duration-300"
                        whileHover={{ scale: 1.02, x: 5, boxShadow: "0px 10px 20px rgba(0,0,0,0.2)" }}
                    >
                        <h3 className="text-xl font-bold text-gray-800 dark:text-green-400">{talk.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-green-500 mb-2">{talk.speaker} | Date: {talk.date}</p>
                        <div className="flex gap-4">
                            <a href="#" className="font-bold text-gray-700 dark:text-green-300 hover:underline">[ View Summary ]</a>
                            <a href="#" className="font-bold text-gray-700 dark:text-green-300 hover:underline">[ Download Slides ]</a>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
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
                    <motion.div 
                        key={index} 
                        className="border-2 border-gray-400 dark:border-green-500 p-1"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.15 }}
                        whileHover={{ scale: 1.05, y: -5, boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)" }}
                    >
                        <img src={src} alt={`Gallery image ${index + 1}`} className="w-full h-auto" />
                    </motion.div>
                ))}
            </div>
        </ContentSection>
    );
};

const SubmitPage = () => {
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const handleSubmit = (event) => {
        event.preventDefault();
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
    
    const formContainerVariants = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };
    
    const formItemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <ContentSection title="Submit an Abstract">
            <p className="text-gray-500 dark:text-green-500 mb-8">Ready to contribute? Use the form below to submit your talk proposal.</p>
            <motion.form 
                className="flex flex-col gap-6" 
                onSubmit={handleSubmit}
                variants={formContainerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={formItemVariants}>
                    <label htmlFor="name" className="block mb-2 text-gray-700 dark:text-green-400">Name / Handle</label>
                    <input type="text" id="name" name="name" required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none" />
                </motion.div>
                <motion.div variants={formItemVariants}>
                    <label htmlFor="email" className="block mb-2 text-gray-700 dark:text-green-400">Contact Email</label>
                    <input type="email" id="email" name="email" required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none" />
                </motion.div>
                <motion.div variants={formItemVariants}>
                    <label htmlFor="abstract" className="block mb-2 text-gray-700 dark:text-green-400">Abstract (Max 300 words)</label>
                    <textarea id="abstract" name="abstract" rows="5" required className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-green-700 text-gray-800 dark:text-green-300 focus:ring-2 focus:ring-green-400 focus:outline-none"></textarea>
                </motion.div>
                
                <motion.div variants={formItemVariants} className="flex items-center gap-4">
                    <motion.button 
                        type="submit" 
                        disabled={status === 'submitting'} 
                        className="self-start px-6 py-3 border border-gray-800 dark:border-green-400 text-gray-800 dark:text-green-400 bg-gray-500/10 dark:bg-green-400/10 uppercase tracking-widest font-bold transition-all duration-300 hover:bg-gray-800 hover:text-white dark:hover:bg-green-400 dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ y: -3, scale: 1.05 }}
                        whileTap={{ y: 1, scale: 0.95 }}
                    >
                        {status === 'submitting' ? 'Transmitting...' : 'Transmit Data'}
                    </motion.button>
                    <AnimatePresence>
                        {status === 'success' && <motion.p initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="text-green-400">Success! Submission received.</motion.p>}
                        {status === 'error' && <motion.p initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="text-red-500">Error! Please try again.</motion.p>}
                    </AnimatePresence>
                </motion.div>
            </motion.form>
        </ContentSection>
    );
};


// --- [4] Main App Component ---
export default function App() {
    const [page, setPage] = useState('home');
    const [theme, setTheme] = useState('dark'); // 'dark' or 'light'

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const pageVariants = {
        initial: {
            opacity: 0,
            y: 20
        },
        in: {
            opacity: 1,
            y: 0
        },
        out: {
            opacity: 0,
            y: -20
        }
    };

    const pageTransition = {
        type: "tween",
        ease: "anticipate",
        duration: 0.5
    };

    const renderPage = () => {
        switch (page) {
            case 'about': return <AboutPage />;
            case 'archive': return <ArchivePage />;
            case 'gallery': return <GalleryPage />;
            case 'submit': return <SubmitPage />;
            case 'home':
            default:
                return <HomePage navigateTo={setPage} />;
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
        <div className="bg-white dark:bg-black">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
                
                body {
                    font-family: 'Space Mono', monospace;
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
                    <Header currentPage={page} navigateTo={setPage} toggleTheme={toggleTheme} theme={theme} />
                    <main>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={page}
                                initial="initial"
                                animate="in"
                                exit="out"
                                variants={pageVariants}
                                transition={pageTransition}
                            >
                                {renderPage()}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                    <Footer status={footerStatus[page]} />
                </div>
            </div>
        </div>
    );
}
