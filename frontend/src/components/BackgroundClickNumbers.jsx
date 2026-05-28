import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CHARS = '0123456789πΣ∞√∫Δθλ+-×÷='.split('');

const BackgroundClickNumbers = () => {
    const [particles, setParticles] = useState([]);

    const spawnParticles = useCallback((e) => {
        // Don't spawn if clicking on interactive elements
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;

        const count = 4 + Math.floor(Math.random() * 4);
        const id = Date.now();

        // Spawn at random positions across the viewport background, NOT at click position
        const newParticles = Array.from({ length: count }).map((_, i) => ({
            id: `${id}-${i}`,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            char: CHARS[Math.floor(Math.random() * CHARS.length)],
            size: 16 + Math.random() * 20,
            duration: 1 + Math.random() * 0.8,
            color: Math.random() > 0.5 ? '#00f5ff' : '#a855f7',
        }));

        setParticles(prev => [...prev, ...newParticles]);

        setTimeout(() => {
            setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
        }, 2000);
    }, []);

    useEffect(() => {
        // Listen on document so we never block anything
        document.addEventListener('click', spawnParticles);
        return () => document.removeEventListener('click', spawnParticles);
    }, [spawnParticles]);

    return (
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
            <AnimatePresence>
                {particles.map(p => (
                    <motion.span
                        key={p.id}
                        className="fixed font-mono font-bold pointer-events-none select-none"
                        style={{
                            left: p.x,
                            top: p.y,
                            fontSize: p.size,
                            color: p.color,
                            textShadow: `0 0 12px ${p.color}`,
                        }}
                        initial={{ opacity: 0.8, scale: 0.5, y: 0 }}
                        animate={{ opacity: 0, scale: 1.3, y: -40 - Math.random() * 30 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: p.duration, ease: 'easeOut' }}
                    >
                        {p.char}
                    </motion.span>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default BackgroundClickNumbers;
