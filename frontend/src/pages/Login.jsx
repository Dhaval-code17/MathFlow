import React, { useState, useRef, useEffect } from 'react';
import LoginCard from '../components/LoginCard';
import LoginScene from '../components/LoginScene';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import SoundEngine from '../utils/SoundEngine';

const FORMULAS = [
    'E = mc²',
    'a² + b² = c²',
    'F = ma',
    'eiπ + 1 = 0',
    '∇ × E = −∂B/∂t',
    'PV = nRT',
    'Σ F = 0',
    '∫ f(x)dx',
];

const Login = () => {
    const navigate = useNavigate();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [formulaState, setFormulaState] = useState('idle'); // idle, success, error

    const containerRef = useRef(null);
    const cardWrapperRef = useRef(null);
    const glowRef = useRef(null);
    const circleRef = useRef(null);
    const fadeRef = useRef(null);
    const tlRef = useRef(null);
    const formulaRef = useRef(null);

    useEffect(() => {
        return () => {
            if (tlRef.current) {
                tlRef.current.kill();
                tlRef.current = null;
            }
        };
    }, []);

    // Animate formula on state change
    useEffect(() => {
        if (!formulaRef.current || formulaState === 'idle') return;

        if (formulaState === 'success') {
            gsap.fromTo(formulaRef.current,
                { scale: 1, color: '#00f5ff', opacity: 0.6 },
                {
                    scale: 1.15, color: '#0aff00', opacity: 1,
                    duration: 0.5, ease: 'power2.out',
                    textShadow: '0 0 30px rgba(10,255,0,0.6), 0 0 60px rgba(10,255,0,0.3)',
                    yoyo: true, repeat: 1,
                    onComplete: () => setFormulaState('idle')
                }
            );
        } else if (formulaState === 'error') {
            gsap.fromTo(formulaRef.current,
                { x: 0, color: '#00f5ff', opacity: 0.6 },
                {
                    x: 15, color: '#ef4444', opacity: 1,
                    duration: 0.06, ease: 'power1.inOut',
                    textShadow: '0 0 20px rgba(239,68,68,0.6)',
                    yoyo: true, repeat: 7,
                    onComplete: () => {
                        gsap.to(formulaRef.current, {
                            x: 0, color: '#00f5ff', opacity: 0.6,
                            textShadow: '0 0 15px rgba(0,245,255,0.3)',
                            duration: 0.3
                        });
                        setFormulaState('idle');
                    }
                }
            );
        }
    }, [formulaState]);

    const handleSuccess = () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setFormulaState('success');

        SoundEngine.playLevelUp();

        const tl = gsap.timeline({
            delay: 0.6, // let formula animation play first
            onComplete: () => {
                navigate('/calculator');
            },
        });
        tlRef.current = tl;

        tl.to(cardWrapperRef.current, {
            opacity: 0, scale: 0.95,
            duration: 0.3, ease: 'power3.inOut',
        });

        tl.to(glowRef.current, {
            opacity: 0.6, duration: 0.25, ease: 'power2.in',
        }, '-=0.1');

        tl.fromTo(circleRef.current,
            { scale: 0, opacity: 0.8 },
            { scale: 3, opacity: 1, duration: 0.35, ease: 'power2.out' },
            '-=0.05'
        );

        tl.to(fadeRef.current, {
            opacity: 1, duration: 0.3, ease: 'power3.inOut',
        });
    };

    const handleError = () => {
        setFormulaState('error');
        SoundEngine.playError();
    };

    // Pick a random formula on mount
    const [formula] = useState(() => FORMULAS[Math.floor(Math.random() * FORMULAS.length)]);

    return (
        <div
            ref={containerRef}
            className="flex w-full h-screen overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #050816, #0a0f1f)' }}
        >
            {/* Transition overlays */}
            <div ref={glowRef} className="absolute inset-0 z-30 pointer-events-none opacity-0"
                style={{ background: 'radial-gradient(circle at center, rgba(0,245,255,0.25) 0%, transparent 60%)' }} />
            <div ref={circleRef}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full z-40 pointer-events-none opacity-0"
                style={{ background: 'radial-gradient(circle, rgba(0,245,255,0.5) 0%, rgba(160,32,240,0.2) 40%, transparent 70%)' }} />
            <div ref={fadeRef} className="absolute inset-0 z-50 pointer-events-none opacity-0"
                style={{ backgroundColor: '#050816' }} />

            {/* Left Side - Ambient Scene */}
            <div className="w-1/2 h-full hidden lg:flex flex-col items-center justify-center relative border-r border-white/5">
                <LoginScene />

                {/* Reactive Math Formula */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <h2
                        ref={formulaRef}
                        className="text-5xl font-orbitron tracking-wider select-none"
                        style={{
                            color: '#00f5ff',
                            opacity: 0.6,
                            textShadow: '0 0 15px rgba(0,245,255,0.3)',
                        }}
                    >
                        {formula}
                    </h2>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-8 relative z-10">
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(160deg, rgba(5,8,22,0.9), rgba(10,15,31,0.95))' }} />

                <div ref={cardWrapperRef} className="w-full max-w-md relative z-10">
                    <LoginCard onSuccess={handleSuccess} onError={handleError} />
                </div>
            </div>
        </div>
    );
};

export default Login;
