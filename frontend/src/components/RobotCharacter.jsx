import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMath } from '../context/MathContext';
import { useTheme } from '../context/ThemeContext';

/**
 * A cute CSS robot that sits beside the calculator.
 * - Changes expression based on universe state (happy, excited, error, thinking, etc.)
 * - Shows personality comments as speech bubbles
 */

const EXPRESSIONS = {
    idle: { leftEye: '●', rightEye: '●', mouth: '‿', color: '#00f5ff' },
    happy: { leftEye: '◠', rightEye: '◠', mouth: '▽', color: '#0aff00' },
    excited: { leftEye: '★', rightEye: '★', mouth: '◡', color: '#ffd700' },
    thinking: { leftEye: '◑', rightEye: '◐', mouth: '~', color: '#a855f7' },
    error: { leftEye: '✕', rightEye: '✕', mouth: '△', color: '#ef4444' },
    surprised: { leftEye: '◎', rightEye: '◎', mouth: 'O', color: '#00f5ff' },
    cool: { leftEye: '▬', rightEye: '▬', mouth: '⌣', color: '#bc13fe' },
    glitch: { leftEye: '◇', rightEye: '◆', mouth: '≋', color: '#ff00ff' },
    cute: { leftEye: '^', rightEye: '^', mouth: 'ω', color: '#ff6b9d' },
};

const getExpression = (universeState) => {
    switch (universeState) {
        case 'positive': return 'happy';
        case 'negative': return 'error';
        case 'supernova': return 'excited';
        case 'void': return 'surprised';
        case 'glitch': return 'glitch';
        default: return 'idle';
    }
};

const RobotCharacter = () => {
    const { personalityComment, universeState } = useMath();
    const { isDark } = useTheme();
    const [expressionKey, setExpressionKey] = useState('idle');
    const [blinking, setBlinking] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const expression = isClicked ? EXPRESSIONS.cute : EXPRESSIONS[expressionKey];

    // Update expression based on universe state
    useEffect(() => {
        setExpressionKey(getExpression(universeState));
    }, [universeState]);

    // Blink cycle
    useEffect(() => {
        const interval = setInterval(() => {
            if (expressionKey === 'idle' || expressionKey === 'happy') {
                setBlinking(true);
                setTimeout(() => setBlinking(false), 150);
            }
        }, 3000 + Math.random() * 2000);
        return () => clearInterval(interval);
    }, [expressionKey]);

    const bodyColor = isDark ? '#1e293b' : '#cbd5e1';
    const borderColor = isDark ? expression.color : '#475569';

    return (
        <div className="absolute -left-52 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col items-center gap-3"
            style={{ width: '160px' }}>

            {/* Speech Bubble */}
            <AnimatePresence mode="wait">
                {personalityComment && (
                    <motion.div
                        key={personalityComment}
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                        transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
                        className="relative rounded-xl px-3 py-2.5 mb-2"
                        style={{
                            background: isDark ? 'rgba(15, 20, 35, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                            border: `1px solid ${expression.color}40`,
                            boxShadow: `0 0 15px ${expression.color}20`,
                            maxWidth: '160px',
                        }}
                    >
                        <p className="text-[11px] font-mono leading-relaxed"
                            style={{ color: isDark ? '#e2e8f0' : '#1a202c' }}>
                            "{personalityComment}"
                        </p>
                        {/* Speech tail pointing down to robot */}
                        <div
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                            style={{
                                background: isDark ? 'rgba(15, 20, 35, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                                borderRight: `1px solid ${expression.color}40`,
                                borderBottom: `1px solid ${expression.color}40`,
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Robot Body */}
            <motion.div
                className="relative flex flex-col items-center cursor-pointer"
                onClick={() => {
                    if (!isClicked) {
                        setIsClicked(true);
                        setTimeout(() => setIsClicked(false), 2000);
                    }
                }}
                animate={
                    isClicked
                        ? { y: [0, -20, 0, -10, 0] }
                        : { y: [0, -3, 0] }
                }
                transition={
                    isClicked
                        ? { duration: 0.6 }
                        : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                }
            >
                {/* Antenna */}
                <div className="relative mb-1">
                    <div className="w-0.5 h-4 mx-auto" style={{ background: borderColor }} />
                    <motion.div
                        className="w-3 h-3 rounded-full mx-auto -mt-1"
                        style={{ background: expression.color, boxShadow: `0 0 8px ${expression.color}` }}
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </div>

                {/* Head */}
                <div
                    className="relative w-20 h-16 rounded-2xl flex items-center justify-center gap-3"
                    style={{
                        background: bodyColor,
                        border: `2px solid ${borderColor}`,
                        boxShadow: `0 0 20px ${expression.color}15, inset 0 0 15px ${expression.color}08`,
                    }}
                >
                    {/* Eyes */}
                    <motion.span
                        className="text-lg font-bold select-none"
                        style={{ color: expression.color }}
                        animate={blinking ? { scaleY: 0.1 } : { scaleY: 1 }}
                        transition={{ duration: 0.1 }}
                    >
                        {expression.leftEye}
                    </motion.span>
                    <motion.span
                        className="text-lg font-bold select-none"
                        style={{ color: expression.color }}
                        animate={blinking ? { scaleY: 0.1 } : { scaleY: 1 }}
                        transition={{ duration: 0.1 }}
                    >
                        {expression.rightEye}
                    </motion.span>

                    {/* Mouth */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm font-bold select-none"
                        style={{ color: expression.color }}>
                        {expression.mouth}
                    </div>

                    {/* Cheek blush (when happy/excited/cute) */}
                    {(expressionKey === 'happy' || expressionKey === 'excited' || isClicked) && (
                        <>
                            <div className="absolute bottom-3 left-2 w-3 h-1.5 rounded-full opacity-60"
                                style={{ background: '#ff6b9d' }} />
                            <div className="absolute bottom-3 right-2 w-3 h-1.5 rounded-full opacity-60"
                                style={{ background: '#ff6b9d' }} />
                        </>
                    )}
                </div>

                {/* Neck */}
                <div className="w-6 h-2 rounded-b" style={{ background: borderColor, opacity: 0.5 }} />

                {/* Body */}
                <div
                    className="w-16 h-12 rounded-xl flex items-center justify-center relative -mt-0.5"
                    style={{
                        background: bodyColor,
                        border: `2px solid ${borderColor}`,
                        boxShadow: `0 0 15px ${expression.color}10`,
                    }}
                >
                    {/* Chest light */}
                    <motion.div
                        className="w-4 h-4 rounded-full"
                        style={{ background: expression.color, boxShadow: `0 0 10px ${expression.color}` }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Arms */}
                    <motion.div
                        className="absolute -left-4 top-2 w-3 h-8 rounded-full"
                        style={{ background: bodyColor, border: `1.5px solid ${borderColor}`, transformOrigin: 'top center' }}
                        animate={isClicked ? { rotate: [0, -140, -100, -140, 0] } : expressionKey === 'excited' ? { rotate: [-10, 10, -10] } : { rotate: 0 }}
                        transition={{ duration: isClicked ? 1 : 0.5, repeat: expressionKey === 'excited' ? Infinity : 0 }}
                    />
                    <motion.div
                        className="absolute -right-4 top-2 w-3 h-8 rounded-full"
                        style={{ background: bodyColor, border: `1.5px solid ${borderColor}`, transformOrigin: 'top center' }}
                        animate={isClicked ? { rotate: [0, 140, 100, 140, 0] } : expressionKey === 'excited' ? { rotate: [10, -10, 10] } : { rotate: 0 }}
                        transition={{ duration: isClicked ? 1 : 0.5, repeat: expressionKey === 'excited' ? Infinity : 0 }}
                    />
                </div>

                {/* Feet */}
                <div className="flex gap-3 -mt-0.5">
                    <div className="w-5 h-3 rounded-b-lg" style={{ background: borderColor, opacity: 0.6 }} />
                    <div className="w-5 h-3 rounded-b-lg" style={{ background: borderColor, opacity: 0.6 }} />
                </div>
            </motion.div>

            {/* Name tag */}
            <div className="text-[9px] font-orbitron tracking-widest mt-1"
                style={{ color: expression.color, opacity: 0.6 }}>
                CALC-BOT
            </div>
        </div>
    );
};

export default RobotCharacter;
