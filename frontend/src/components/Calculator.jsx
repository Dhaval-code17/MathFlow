import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Delete, History, Camera, Sparkles } from 'lucide-react';
import SoundEngine from '../utils/SoundEngine';
import { useMath } from '../context/MathContext';
import { useTheme } from '../context/ThemeContext';
import EquationBreakdown from './EquationBreakdown';
import { evaluateAdvanced } from '../utils/AdvancedMathEngine';
import AiMathSolver from './AiMathSolver';
import GeometryBuilder from './GeometryBuilder';

// --- Number Explosion Effect (surrounds the calculator in background) ---
const ExplosionEffect = ({ value, onComplete }) => {
    const chars = String(value).split('');
    const [phase, setPhase] = useState('explode');

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('settle'), 900);
        const t2 = setTimeout(() => onComplete?.(), 1800);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Spread digits in full 360° around the calculator
    return (
        <div
            className="absolute z-50 pointer-events-none"
            style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '700px',
                height: '700px',
            }}
        >
            {/* Central flash */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '300px', height: '300px',
                    background: 'radial-gradient(circle, rgba(0,245,255,0.3) 0%, transparent 70%)',
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.5, 2] }}
                transition={{ duration: 0.6 }}
            />

            {/* Digits exploding outward 360° then settling back */}
            {chars.map((char, i) => {
                const angle = (360 / chars.length) * i + (Math.random() - 0.5) * 15;
                const distance = 180 + Math.random() * 80;
                const radians = (angle * Math.PI) / 180;
                const tx = Math.cos(radians) * distance;
                const ty = Math.sin(radians) * distance;

                return (
                    <motion.span
                        key={i}
                        className="text-4xl font-mono font-bold absolute"
                        style={{
                            left: '50%', top: '50%',
                            color: '#00f5ff',
                            textShadow: '0 0 20px rgba(0,245,255,0.9), 0 0 40px rgba(0,245,255,0.4)',
                        }}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
                        animate={phase === 'explode'
                            ? { x: tx, y: ty, opacity: 1, scale: 1.3, rotate: (Math.random() - 0.5) * 120 }
                            : { x: 0, y: 0, opacity: 0, scale: 0.5, rotate: 0 }
                        }
                        transition={phase === 'explode'
                            ? { duration: 0.5, ease: 'easeOut', delay: i * 0.03 }
                            : { duration: 0.6, type: 'spring', stiffness: 150, damping: 15 }
                        }
                    >
                        {char}
                    </motion.span>
                );
            })}

            {/* Particle ring — 360° burst */}
            {phase === 'explode' && Array.from({ length: 20 }).map((_, i) => {
                const angle = (360 / 20) * i;
                const dist = 220 + Math.random() * 60;
                return (
                    <motion.div
                        key={`p-${i}`}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            backgroundColor: i % 3 === 0 ? '#00f5ff' : i % 3 === 1 ? '#a855f7' : '#0aff00',
                            left: '50%', top: '50%',
                        }}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{
                            x: Math.cos((angle * Math.PI) / 180) * dist,
                            y: Math.sin((angle * Math.PI) / 180) * dist,
                            opacity: 0,
                            scale: 0,
                        }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.02 }}
                    />
                );
            })}
        </div>
    );
};

// --- Hidden Stats Panel ---
const HiddenStats = ({ isOpen, onClose }) => {
    const { xp, level, levelTitle, totalCalcs, highScore, operatorStats } = useMath();

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="w-full max-w-[360px] mx-4 rounded-2xl p-6"
                style={{
                    background: 'rgba(10, 14, 30, 0.95)',
                    border: '1px solid rgba(0, 245, 255, 0.2)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 0 40px rgba(0,245,255,0.1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-orbitron text-[#00f5ff] mb-4 tracking-wider">HIDDEN STATS</h2>

                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Level</span>
                        <span className="text-white font-mono">{level} — {levelTitle}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total XP</span>
                        <span className="text-[#00f5ff] font-mono">{xp}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Calculations</span>
                        <span className="text-white font-mono">{totalCalcs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Highest Value</span>
                        <span className="text-[#a855f7] font-mono">{highScore > 1e6 ? (highScore / 1e6).toFixed(2) + 'M' : highScore}</span>
                    </div>

                    <div className="border-t border-white/10 pt-3 mt-3">
                        <p className="text-xs text-gray-500 mb-2">Operator Usage</p>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(operatorStats || {}).map(([op, count]) => (
                                <div key={op} className="flex justify-between text-sm px-2 py-1 rounded" style={{ background: '#111827' }}>
                                    <span className="text-[#a855f7] font-mono">{op}</span>
                                    <span className="text-gray-300 font-mono">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <button onClick={onClose} className="text-gray-500 text-xs hover:text-white transition-colors">
                        Press H or click to close
                    </button>
                </div>
            </div>
        </motion.div>
    );
};


const Calculator = ({ onHistoryClick, onCalculationComplete }) => {
    const [display, setDisplay] = useState('');
    const [result, setResult] = useState('');
    const [lastExpression, setLastExpression] = useState('');
    const [lastResult, setLastResult] = useState('');
    const [breakdownExpr, setBreakdownExpr] = useState(null);
    const [showResult, setShowResult] = useState(true);
    const [showExplosion, setShowExplosion] = useState(false);
    const [explosionValue, setExplosionValue] = useState('');
    const [showHiddenStats, setShowHiddenStats] = useState(false);
    const [calcMode, setCalcMode] = useState('basic'); // 'basic', 'advanced', 'geo'
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiInitialImage, setAiInitialImage] = useState(null);
    const { registerCalculation, recordKeystroke, operatorStats } = useMath();
    const theme = useTheme();
    const calcRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Easter Egg State
    const [isPiMode, setIsPiMode] = useState(false);

    useEffect(() => {
        if (display === '314159') {
            setIsPiMode(true);
            SoundEngine.playLevelUp();
            setTimeout(() => setIsPiMode(false), 5000);
        }
        if (display === '00000') {
            SoundEngine.playGlitch();
        }
    }, [display]);

    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't intercept if user is in an input field (e.g. practice mode)
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key.toUpperCase();

            if (key === 'P') {
                e.preventDefault();
                setDisplay(prev => prev + 'π');
                SoundEngine.playNumber('3');
                recordKeystroke();
            } else if (key === 'S') {
                e.preventDefault();
                setDisplay(prev => prev + '√');
                SoundEngine.playOperator();
                recordKeystroke();
            } else if (key === 'E') {
                e.preventDefault();
                setDisplay(prev => prev + 'e');
                SoundEngine.playNumber('2');
                recordKeystroke();
            } else if (key === 'L') {
                e.preventDefault();
                // Open analytics panel (leaderboard)
                onHistoryClick?.();
                SoundEngine.playOperator();
            } else if (key === 'H') {
                e.preventDefault();
                setShowHiddenStats(prev => !prev);
                SoundEngine.playOperator();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [recordKeystroke, onHistoryClick]);

    const handleBtnClick = useCallback((val) => {
        recordKeystroke();

        if (['+', '-', '*', '/', '%'].includes(val)) {
            SoundEngine.playOperator();
        } else if (val === 'C' || val === 'DEL') {
            // handled below
        } else {
            SoundEngine.playNumber(val);
        }

        if (val === 'C') {
            setDisplay('');
            setResult('');
            setLastExpression('');
            setLastResult('');
            setBreakdownExpr(null);
            setShowResult(true);
            setShowExplosion(false);
            SoundEngine.playClear();
        } else if (val === 'DEL') {
            setDisplay(prev => prev.slice(0, -1));
            SoundEngine.playNumber('0');
        } else if (val === '=') {
            calculate();
        } else {
            setDisplay(prev => prev + val);
        }
    }, [display, recordKeystroke]);

    const calculate = async () => {
        try {
            let evalResult;
            let resultStr;

            if (calcMode === 'advanced') {
                const advancedResult = evaluateAdvanced(display);
                setResult(advancedResult.toString());
                registerCalculation(display, advancedResult.toString());
                return;
            } else {
                // Replace math symbols for eval
                let evalExpr = display
                    .replace(/π/g, `(${Math.PI})`)
                    .replace(/√(\d+)/g, 'Math.sqrt($1)')
                    .replace(/e/g, `(${Math.E})`);

                // eslint-disable-next-line no-eval
                evalResult = eval(evalExpr);
                resultStr = String(evalResult);
            }

            // Check for explosion (> 1,000,000)
            if (typeof evalResult === 'number' && Math.abs(evalResult) > 1000000 && isFinite(evalResult)) {
                setShowExplosion(true);
                setExplosionValue(evalResult > 1e9 ? evalResult.toExponential(3) : Math.round(evalResult).toLocaleString());
                setResult(evalResult);
                setLastExpression(display);
                setLastResult(resultStr);
                setShowResult(false);
                SoundEngine.playLevelUp();
            }
            // Check for breakdown (multi-operator)
            else {
                const opCount = (display.replace(/[πe√]/g, '').match(/[\+\-\*\/\%]/g) || []).length;
                if (calcMode === 'basic' && opCount >= 2) {
                    setShowResult(false);
                    setBreakdownExpr(display.replace(/π/g, String(Math.PI)).replace(/e/g, String(Math.E)));
                    setResult(evalResult);
                    setLastExpression(display);
                    setLastResult(resultStr);
                } else {
                    setResult(evalResult);
                    setLastExpression(display);
                    setLastResult(resultStr);
                    setShowResult(true);
                }
                SoundEngine.playEqual(evalResult);
            }

            registerCalculation(display, resultStr);

            await axios.post('/api/calculate', {
                expression: display,
                result: resultStr
            });

            if (onCalculationComplete) onCalculationComplete();
        } catch (error) {
            setResult('Error');
            setShowResult(true);
            SoundEngine.playError();
            registerCalculation(display, 'NaN');
        }
    };

    const handleBreakdownComplete = () => {
        setBreakdownExpr(null);
        setShowResult(true);
    };

    const handleExplosionComplete = () => {
        setShowExplosion(false);
        setShowResult(true);
    };

    const handleCameraCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAiInitialImage(reader.result);
                setIsAiModalOpen(true);
                e.target.value = '';
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExpressionClick = () => {
        if (lastExpression) {
            setDisplay(lastExpression);
            setResult('');
            SoundEngine.playOperator();
        }
    };

    const handleResultClick = () => {
        if (lastResult && lastResult !== 'Error') {
            setDisplay(lastResult);
            setResult('');
            SoundEngine.playOperator();
        }
    };

    const buttons = [
        { label: 'C', type: 'func' }, { label: 'DEL', type: 'func' }, { label: '%', type: 'op' }, { label: '/', type: 'op' },
        { label: '7', type: 'num' }, { label: '8', type: 'num' }, { label: '9', type: 'num' }, { label: '*', type: 'op' },
        { label: '4', type: 'num' }, { label: '5', type: 'num' }, { label: '6', type: 'num' }, { label: '-', type: 'op' },
        { label: '1', type: 'num' }, { label: '2', type: 'num' }, { label: '3', type: 'num' }, { label: '+', type: 'op' },
        { label: '0', type: 'num' }, { label: '.', type: 'num' }, { label: '=', type: 'equal', cols: 2 },
    ];

    const advancedButtons = [
        { label: 'sin(', type: 'func' }, { label: 'cos(', type: 'func' }, { label: 'tan(', type: 'func' }, { label: 'log(', type: 'func' }, { label: 'ln(', type: 'func' },
        { label: 'diff(', type: 'func' }, { label: 'integrate(', type: 'func' }, { label: 'solve(', type: 'func' }, { label: '(', type: 'op' }, { label: ')', type: 'op' },
        { label: 'x', type: 'num' }, { label: 'y', type: 'num' }, { label: 'π', type: 'num' }, { label: 'e', type: 'num' }, { label: '^', type: 'op' },
        { label: '7', type: 'num' }, { label: '8', type: 'num' }, { label: '9', type: 'num' }, { label: 'DEL', type: 'func' }, { label: 'C', type: 'func' },
        { label: '4', type: 'num' }, { label: '5', type: 'num' }, { label: '6', type: 'num' }, { label: '*', type: 'op' }, { label: '/', type: 'op' },
        { label: '1', type: 'num' }, { label: '2', type: 'num' }, { label: '3', type: 'num' }, { label: '+', type: 'op' }, { label: '-', type: 'op' },
        { label: '0', type: 'num' }, { label: '.', type: 'num' }, { label: ',', type: 'op' }, { label: 'sqrt(', type: 'func' }, { label: '=', type: 'equal' }
    ];

    const currentButtons = calcMode === 'advanced' ? advancedButtons : buttons;

    const btnStyle = (btn) => {
        const base = 'rounded-lg font-bold text-xl relative overflow-hidden transition-all duration-200';
        const colSpan = btn.cols ? `col-span-${btn.cols}` : '';
        if (btn.type === 'equal') return `${base} ${colSpan} text-[#00f5ff] border border-[#00f5ff]/40 hover:shadow-[0_0_20px_rgba(0,245,255,0.3)]`;
        if (btn.type === 'op' || btn.type === 'func') return `${base} ${colSpan} text-[#a855f7] hover:text-[#c084fc]`;
        return `${base} ${colSpan} text-gray-200 hover:text-white`;
    };

    const hasClickableResult = lastResult && lastResult !== 'Error' && result !== '';
    const hasClickableExpression = lastExpression && result !== '';

    return (
        <>
            {/* Hidden Stats Modal */}
            <AnimatePresence>
                {showHiddenStats && (
                    <HiddenStats isOpen={showHiddenStats} onClose={() => setShowHiddenStats(false)} />
                )}
            </AnimatePresence>

            {/* AI Math Solver Modal */}
            <AnimatePresence>
                {isAiModalOpen && (
                    <AiMathSolver isOpen={isAiModalOpen} onClose={() => { setIsAiModalOpen(false); setAiInitialImage(null); }} initialImage={aiInitialImage} />
                )}
            </AnimatePresence>

            {/* Floating Solve with AI button */}
            <button
                onClick={() => setIsAiModalOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full font-orbitron text-xs tracking-wider transition-all duration-300 group hover:scale-105"
                style={{
                    background: theme.isDark
                        ? 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(0,245,255,0.2))'
                        : 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(0,245,255,0.15))',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: theme.isDark ? '#e9d5ff' : '#9333ea',
                    boxShadow: '0 0 20px rgba(168,85,247,0.2)',
                }}
            >
                <Sparkles className="w-4 h-4 text-[#a855f7] group-hover:animate-pulse" />
                SOLVE WITH AI
            </button>

            <div
                ref={calcRef}
                className={`relative w-full ${calcMode !== 'basic' ? 'max-w-[540px]' : 'max-w-[420px]'} aspect-[3/4] sm:aspect-[4/5] rounded-2xl p-4 sm:p-6 flex flex-col gap-4 transition-all duration-500`}
                style={{
                    background: theme.card,
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: `1px solid ${theme.cardBorder}`,
                    boxShadow: theme.isDark
                        ? '0 0 40px rgba(0, 245, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.4)'
                        : '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
            >
                {/* Equation Breakdown — overlays the calculator */}
                {breakdownExpr && (
                    <EquationBreakdown
                        expression={breakdownExpr}
                        onComplete={handleBreakdownComplete}
                    />
                )}

                {/* Number Explosion — floats above calculator */}
                {showExplosion && (
                    <ExplosionEffect value={explosionValue} onComplete={handleExplosionComplete} />
                )}

                {/* Easter Egg Overlay */}
                {isPiMode && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none rounded-2xl overflow-hidden bg-black/60">
                        <motion.h1 initial={{ scale: 0 }} animate={{ scale: 2 }}
                            className="text-8xl font-orbitron"
                            style={{ color: '#00f5ff', textShadow: '0 0 40px rgba(0,245,255,0.8)' }}>
                            π
                        </motion.h1>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00f5ff', boxShadow: '0 0 8px #00f5ff' }} />
                        <h1 className="text-sm font-orbitron text-gray-400 tracking-widest hidden sm:block">CONTROL PANEL</h1>
                        
                        <button
                            onClick={() => {
                                SoundEngine.playOperator();
                                setCalcMode(prev => prev === 'basic' ? 'advanced' : prev === 'advanced' ? 'geo' : 'basic');
                            }}
                            className={`px-4 py-1.5 rounded-full font-orbitron text-xs tracking-wider border transition-all ${
                                calcMode === 'advanced' ? 'bg-[#00f5ff]/20 text-[#00f5ff] border-[#00f5ff]/50 shadow-[0_0_15px_rgba(0,245,255,0.3)]' : 
                                calcMode === 'geo' ? 'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 
                                'bg-black/40 text-gray-400 border-white/10 hover:border-white/30'
                            }`}
                        >
                            {calcMode === 'basic' ? 'BASIC' : calcMode === 'advanced' ? 'ADV' : 'GEO'}
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Keyboard hint */}
                        <div className="hidden md:flex items-center gap-1">
                            {['P:π', 'S:√', 'E:e'].map(hint => (
                                <span key={hint} className="text-[9px] text-gray-600 font-mono px-1 py-0.5 rounded border border-gray-700/50">
                                    {hint}
                                </span>
                            ))}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={cameraInputRef}
                            style={{ display: 'none' }}
                            onChange={handleCameraCapture}
                        />
                        <button
                            onClick={() => {
                                SoundEngine.playOperator();
                                cameraInputRef.current?.click();
                            }}
                            className="text-gray-500 hover:text-[#a855f7] transition-colors"
                            title="AI Camera Math Solver"
                        >
                            <Camera size={18} />
                        </button>
                        <button
                            onClick={() => { SoundEngine.playOperator(); onHistoryClick(); }}
                            className="text-gray-500 hover:text-[#00f5ff] transition-colors"
                            title="Calculation History"
                        >
                            <History size={18} />
                        </button>
                    </div>
                </div>

                {/* Display */}
                <div
                    className="rounded-xl p-6 mb-2 h-32 flex flex-col justify-end relative overflow-hidden transition-colors duration-500"
                    style={{
                        background: theme.displayBg,
                        border: `1px solid ${theme.displayBorder}`,
                        boxShadow: theme.isDark
                            ? 'inset 0 2px 15px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(0, 245, 255, 0.03)'
                            : 'inset 0 2px 8px rgba(0, 0, 0, 0.05)',
                    }}
                >


                    {/* Normal display */}
                    {showResult && (
                        <>
                            {calcMode === 'advanced' ? (
                                <input
                                    type="text"
                                    value={display}
                                    onChange={(e) => { setDisplay(e.target.value); setResult(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && calculate()}
                                    className="w-full bg-transparent text-right outline-none text-xl font-mono text-gray-300 placeholder-gray-600 mb-1"
                                    placeholder="e.g. diff(x^2, x)"
                                />
                            ) : (
                                <div
                                    onClick={handleExpressionClick}
                                    className={`text-sm h-6 font-mono overflow-x-auto scrollbar-hide whitespace-nowrap mb-1 transition-colors duration-200 ${hasClickableExpression ? 'text-gray-400 cursor-pointer hover:text-[#a855f7]' : 'text-gray-500'
                                        }`}
                                    title={hasClickableExpression ? 'Click to reuse this expression' : ''}
                                >
                                    {display || ''}
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={result}
                                    initial={{ opacity: 0.5, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={handleResultClick}
                                    className={`text-5xl font-bold font-mono text-right tracking-tight transition-colors duration-200 ${hasClickableResult ? 'cursor-pointer' : ''
                                        }`}
                                    style={{
                                        color: result === 'Error' ? '#ef4444' : '#00f5ff',
                                        textShadow: result === 'Error'
                                            ? '0 0 10px rgba(239,68,68,0.4)'
                                            : '0 0 15px rgba(0,245,255,0.4), 0 0 30px rgba(0,245,255,0.15)',
                                    }}
                                    title={hasClickableResult ? 'Click to use this result' : ''}
                                >
                                    {result || (display ? '' : '0')}
                                </motion.div>
                            </AnimatePresence>

                            {hasClickableResult && (
                                <div className="absolute top-2 right-3 text-[10px] text-gray-600 font-mono">
                                    tap to reuse ↑
                                </div>
                            )}
                        </>
                    )}
                </div>

                {calcMode === 'geo' ? (
                    <GeometryBuilder onSolveCanvas={(img) => { setAiInitialImage(img); setIsAiModalOpen(true); }} />
                ) : (
                    <div className={`grid ${calcMode === 'advanced' ? 'grid-cols-5' : 'grid-cols-4'} gap-3 flex-1`}>
                        {currentButtons.map((btn, idx) => (
                            <motion.button
                            key={btn.label + idx}
                            whileTap={{ scale: 0.94 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            onMouseDown={() => handleBtnClick(btn.label)}
                            className={btnStyle(btn)}
                            style={{
                                background: btn.type === 'equal'
                                    ? 'rgba(0, 245, 255, 0.08)'
                                    : btn.type === 'op' || btn.type === 'func'
                                        ? 'rgba(160, 32, 240, 0.08)'
                                        : theme.buttonBg,
                                color: btn.type === 'num' || btn.type === 'dot' ? theme.buttonText : undefined,
                                ...(btn.type !== 'equal' && btn.type !== 'op' && btn.type !== 'func'
                                    ? { border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }
                                    : {}),
                            }}
                            onMouseEnter={(e) => {
                                if (btn.type === 'equal') e.currentTarget.style.background = 'rgba(0, 245, 255, 0.15)';
                                else if (btn.type === 'op' || btn.type === 'func') e.currentTarget.style.background = 'rgba(160, 32, 240, 0.15)';
                                else e.currentTarget.style.background = theme.buttonHover;
                            }}
                            onMouseLeave={(e) => {
                                if (btn.type === 'equal') e.currentTarget.style.background = 'rgba(0, 245, 255, 0.08)';
                                else if (btn.type === 'op' || btn.type === 'func') e.currentTarget.style.background = 'rgba(160, 32, 240, 0.08)';
                                else e.currentTarget.style.background = theme.buttonBg;
                            }}
                        >
                            <span className={`relative z-10 flex items-center justify-center h-full w-full ${btn.label.length > 5 ? 'text-xs' : btn.label.length > 3 ? 'text-sm' : ''}`}>
                                {btn.label === 'DEL' ? <Delete className="w-5 h-5" /> : btn.label}
                            </span>
                        </motion.button>
                    ))}
                </div>
                )}
            </div>
        </>
    );
};

export default Calculator;
