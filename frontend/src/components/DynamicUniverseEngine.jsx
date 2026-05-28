import React, { useEffect, useRef } from 'react';
import { useMath } from '../context/MathContext';
import { gsap } from 'gsap';


const DynamicUniverseEngine = () => {
    const { universeState, typingSpeed } = useMath();
    const containerRef = useRef();
    const speedOverlayRef = useRef();

    // React to universe state changes
    useEffect(() => {
        if (!containerRef.current) return;

        switch (universeState) {
            case 'positive':
                gsap.to(containerRef.current, { backgroundColor: '#000000', duration: 1 });
                break;
            case 'negative':
                gsap.to(containerRef.current, { backgroundColor: '#1a0000', duration: 0.5 });
                break;
            case 'void':
                gsap.to(containerRef.current, { backgroundColor: '#000000', filter: 'brightness(0)', duration: 0.2, yoyo: true, repeat: 1 });
                break;
            case 'supernova':
                gsap.fromTo(containerRef.current,
                    { backgroundColor: '#0f172a' },
                    { backgroundColor: '#050816', duration: 2, ease: 'power2.out' }
                );
                break;
            case 'glitch':
                gsap.to(containerRef.current, { x: 5, y: -5, duration: 0.05, repeat: 5, yoyo: true });
                break;
            default:
                gsap.to(containerRef.current, { backgroundColor: '#050816', duration: 1 });
        }
    }, [universeState]);

    // React to typing speed
    useEffect(() => {
        if (!speedOverlayRef.current) return;

        // Map speed (0-12) to visual intensity
        const intensity = Math.min(typingSpeed / 8, 1); // normalized 0-1

        if (typingSpeed > 0.5) {
            gsap.to(speedOverlayRef.current, {
                opacity: intensity * 0.35,
                duration: 0.3,
                ease: 'power1.out',
            });
        } else {
            gsap.to(speedOverlayRef.current, {
                opacity: 0,
                duration: 0.8,
                ease: 'power2.out',
            });
        }
    }, [typingSpeed]);

    // Choose color based on speed tiers
    const getSpeedColor = () => {
        if (typingSpeed > 6) return 'rgba(239, 68, 68, 0.3)'; // fast = red pulse
        if (typingSpeed > 3) return 'rgba(160, 32, 240, 0.25)'; // medium = purple
        return 'rgba(0, 245, 255, 0.15)'; // slow = subtle cyan
    };

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 transition-colors duration-1000 bg-dark-bg">

            {/* Typing Speed Reactive Overlay */}
            <div
                ref={speedOverlayRef}
                className="absolute inset-0 pointer-events-none opacity-0 transition-colors duration-300"
                style={{
                    background: `radial-gradient(circle at center, ${getSpeedColor()} 0%, transparent 70%)`,
                }}
            />

            {/* Speed indicator particles - visible at high speed */}
            {typingSpeed > 4 && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: Math.min(Math.floor(typingSpeed), 8) }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 rounded-full animate-ping"
                            style={{
                                backgroundColor: typingSpeed > 6 ? '#ef4444' : '#00f5ff',
                                top: `${20 + Math.random() * 60}%`,
                                left: `${10 + Math.random() * 80}%`,
                                animationDuration: `${0.5 + Math.random() * 1}s`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                opacity: 0.6,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Ambient Overlays for Universe States */}
            {universeState === 'negative' && (
                <div className="absolute inset-0 bg-red-900/10 pointer-events-none animate-pulse" />
            )}
            {universeState === 'supernova' && (
                <div className="absolute inset-0 bg-[#00f5ff]/10 pointer-events-none animate-ping" />
            )}
        </div>
    );
};

export default DynamicUniverseEngine;
