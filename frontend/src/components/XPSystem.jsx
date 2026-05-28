import React from 'react';
import { useMath } from '../context/MathContext';
import { motion, AnimatePresence } from 'framer-motion';
import SoundEngine from '../utils/SoundEngine';

const XPSystem = () => {
    const { xp, level, levelTitle, maxLevelXp, showLevelUp } = useMath();

    // Calculate percentage
    const prevLevelXp = 0; // Simplified for now, ideally would be prev threshold
    const progress = Math.min((xp / maxLevelXp) * 100, 100);

    return (
        <div className="fixed top-4 left-4 z-50 text-white font-orbitron">
            {/* Level Badge */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-neon-blue flex items-center justify-center bg-black/50 backdrop-blur shadow-[0_0_10px_#00f3ff]">
                        <span className="text-xl font-bold">{level}</span>
                    </div>
                    {/* XP Ring around badge could go here */}
                </div>
                <div>
                    <div className="text-sm text-neon-blue tracking-widest uppercase">{levelTitle}</div>
                    <div className="w-32 h-2 bg-gray-800 rounded-full mt-1 overflow-hidden border border-white/10">
                        <motion.div
                            className="h-full bg-gradient-to-r from-neon-blue to-neon-purple"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{xp} / {maxLevelXp} XP</div>
                </div>
            </div>

            {/* Level Up Overlay */}
            <AnimatePresence>
                {showLevelUp && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 0 }}
                        animate={{ opacity: 1, scale: 1, y: 100 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="fixed inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="text-center">
                            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                                LEVEL UP!
                            </h1>
                            <div className="text-2xl text-white mt-4 tracking-[0.5em] uppercase">
                                {levelTitle} ACQUIRED
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default XPSystem;
