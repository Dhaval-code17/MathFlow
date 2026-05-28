import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { X, Zap, Trophy, Timer, Flame, Target, TrendingUp, Crown } from 'lucide-react';

/**
 * Competitive Mode — 60-second speed run.
 * Problems get harder as your streak grows.
 * Combos, streaks, and a summary at the end.
 */

const DIFFICULTIES = {
    easy: {
        generate: () => {
            const ops = ['+', '-', '×'];
            const op = ops[Math.floor(Math.random() * ops.length)];
            const a = Math.floor(Math.random() * 20) + 1;
            const b = Math.floor(Math.random() * 15) + 1;
            switch (op) {
                case '+': return { q: `${a} + ${b}`, a: a + b };
                case '-': return { q: `${a + b} - ${a}`, a: b };
                case '×': return { q: `${a} × ${Math.floor(Math.random() * 10) + 2}`, a: a * (Math.floor(Math.random() * 10) + 2) };
            }
        }
    },
    medium: {
        generate: () => {
            const type = Math.floor(Math.random() * 3);
            if (type === 0) {
                const a = Math.floor(Math.random() * 50) + 10;
                const b = Math.floor(Math.random() * 50) + 10;
                return { q: `${a} + ${b}`, a: a + b };
            } else if (type === 1) {
                const b = Math.floor(Math.random() * 12) + 2;
                const ans = Math.floor(Math.random() * 12) + 2;
                return { q: `${b * ans} ÷ ${b}`, a: ans };
            } else {
                const a = Math.floor(Math.random() * 15) + 5;
                const b = Math.floor(Math.random() * 12) + 2;
                return { q: `${a} × ${b}`, a: a * b };
            }
        }
    },
    hard: {
        generate: () => {
            const type = Math.floor(Math.random() * 3);
            if (type === 0) {
                const a = Math.floor(Math.random() * 12) + 2;
                const b = Math.floor(Math.random() * 12) + 2;
                const c = Math.floor(Math.random() * 20) + 1;
                return { q: `${a} × ${b} + ${c}`, a: a * b + c };
            } else if (type === 1) {
                const a = Math.floor(Math.random() * 20) + 5;
                return { q: `${a}²`, a: a * a };
            } else {
                const a = Math.floor(Math.random() * 100) + 50;
                const b = Math.floor(Math.random() * 80) + 20;
                return { q: `${a} - ${b}`, a: a - b };
            }
        }
    }
};

const getDifficulty = (streak) => {
    if (streak >= 8) return 'hard';
    if (streak >= 4) return 'medium';
    return 'easy';
};

const GAME_DURATION = 60;

const CompetitiveMode = () => {
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [gameState, setGameState] = useState('idle'); // idle | playing | finished
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [combo, setCombo] = useState(1);
    const [problem, setProblem] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [totalAttempted, setTotalAttempted] = useState(0);
    const [difficulty, setDifficulty] = useState('easy');
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [maxDifficultyReached, setMaxDifficultyReached] = useState('easy');
    const inputRef = useRef(null);
    const timerRef = useRef(null);
    const savedRef = useRef(false);

    const generateProblem = useCallback((currentStreak = 0) => {
        const diff = getDifficulty(currentStreak);
        setDifficulty(diff);
        setMaxDifficultyReached(prev => {
            const order = { easy: 0, medium: 1, hard: 2 };
            return order[diff] > order[prev] ? diff : prev;
        });
        const { q, a } = DIFFICULTIES[diff].generate();
        setProblem({ question: q, answer: a });
        setUserAnswer('');
        setFeedback(null);
    }, []);

    const startGame = () => {
        setGameState('playing');
        setTimeLeft(GAME_DURATION);
        setScore(0);
        setStreak(0);
        setBestStreak(0);
        setCombo(1);
        setTotalCorrect(0);
        setTotalAttempted(0);
        setMaxDifficultyReached('easy');
        setLeaderboard([]);
        setUserRank(null);
        savedRef.current = false;
        generateProblem(0);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    // Save score and fetch leaderboard on game finish
    useEffect(() => {
        if (gameState !== 'finished' || savedRef.current) return;
        savedRef.current = true;
        const saveAndFetch = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
                await axios.post('/api/competitive/score', {
                    score, bestStreak, accuracy, totalCorrect, totalAttempted, maxDifficulty: maxDifficultyReached,
                }, { headers }).catch(() => { });
                const [lbRes, statsRes] = await Promise.all([
                    axios.get('/api/competitive/leaderboard', { headers }).catch(() => ({ data: [] })),
                    axios.get('/api/competitive/mystats', { headers }).catch(() => ({ data: { rank: null } })),
                ]);
                setLeaderboard(lbRes.data || []);
                setUserRank(statsRes.data?.rank || null);
            } catch (e) { console.error('Score save error:', e); }
        };
        saveAndFetch();
    }, [gameState]);

    // Timer
    useEffect(() => {
        if (gameState !== 'playing') return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setGameState('finished');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [gameState]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!problem || gameState !== 'playing') return;

        const parsed = parseInt(userAnswer, 10);
        setTotalAttempted(prev => prev + 1);

        if (parsed === problem.answer) {
            const newStreak = streak + 1;
            const newCombo = Math.min(1 + Math.floor(newStreak / 3), 5);
            const points = 10 * newCombo;

            setStreak(newStreak);
            setBestStreak(prev => Math.max(prev, newStreak));
            setCombo(newCombo);
            setScore(prev => prev + points);
            setTotalCorrect(prev => prev + 1);
            setFeedback({ type: 'correct', points });
            generateProblem(newStreak);
        } else {
            setStreak(0);
            setCombo(1);
            setFeedback({ type: 'wrong', answer: problem.answer });
            generateProblem(0);
        }

        setTimeout(() => setFeedback(null), 600);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleClose = () => {
        setIsOpen(false);
        setGameState('idle');
        clearInterval(timerRef.current);
    };

    const timerPercent = (timeLeft / GAME_DURATION) * 100;
    const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#00f5ff';

    const bg = isDark ? 'rgba(5, 8, 22, 0.97)' : 'rgba(255, 255, 255, 0.97)';
    const textColor = isDark ? '#e2e8f0' : '#1a202c';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const cardBg = isDark ? 'rgba(15, 20, 35, 0.8)' : 'rgba(240, 242, 245, 0.8)';

    return (
        <>
            {/* Floating trigger button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full font-orbitron text-xs tracking-wider transition-all duration-300 group"
                style={{
                    background: isDark
                        ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.2))'
                        : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    boxShadow: '0 0 20px rgba(239,68,68,0.15)',
                }}
            >
                <Flame className="w-4 h-4 group-hover:animate-bounce" />
                COMPETE
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center"
                        style={{ backdropFilter: 'blur(12px)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-[440px] max-h-[90vh] rounded-2xl p-6 overflow-y-auto"
                            style={{
                                background: bg,
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                boxShadow: '0 0 60px rgba(239,68,68,0.1), 0 20px 40px rgba(0,0,0,0.3)',
                            }}
                        >
                            {/* Close */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors z-10"
                            >
                                <X size={18} />
                            </button>

                            {/* === IDLE STATE === */}
                            {gameState === 'idle' && (
                                <div className="text-center py-6">
                                    <Flame className="w-12 h-12 mx-auto mb-4" style={{ color: '#ef4444' }} />
                                    <h2 className="text-2xl font-orbitron font-bold mb-2" style={{ color: textColor }}>
                                        COMPETITIVE MODE
                                    </h2>
                                    <p className="text-sm mb-1" style={{ color: subtextColor }}>
                                        60-second math speed run
                                    </p>
                                    <p className="text-xs mb-6" style={{ color: subtextColor }}>
                                        Problems get harder as your streak grows. Build combos for bonus points!
                                    </p>

                                    <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                                        {[
                                            { label: 'EASY', desc: 'Basic ops', color: '#0aff00' },
                                            { label: 'MEDIUM', desc: 'Bigger numbers', color: '#f59e0b' },
                                            { label: 'HARD', desc: 'Multi-step', color: '#ef4444' },
                                        ].map(d => (
                                            <div key={d.label} className="rounded-lg p-3" style={{ background: cardBg }}>
                                                <div className="text-[10px] font-orbitron font-bold mb-1" style={{ color: d.color }}>
                                                    {d.label}
                                                </div>
                                                <div className="text-[10px]" style={{ color: subtextColor }}>{d.desc}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={startGame}
                                        className="px-8 py-3 rounded-xl font-orbitron font-bold text-sm tracking-wider transition-all duration-300 hover:scale-105"
                                        style={{
                                            background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                                            color: '#fff',
                                            boxShadow: '0 0 25px rgba(239,68,68,0.3)',
                                        }}
                                    >
                                        ⚡ START CHALLENGE
                                    </button>
                                </div>
                            )}

                            {/* === PLAYING STATE === */}
                            {gameState === 'playing' && problem && (
                                <div className="py-2">
                                    {/* Header stats */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Timer className="w-4 h-4" style={{ color: timerColor }} />
                                            <span className="font-orbitron font-bold text-lg" style={{ color: timerColor }}>
                                                {timeLeft}s
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                            <span className="font-orbitron font-bold text-lg" style={{ color: textColor }}>
                                                {score}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Timer bar */}
                                    <div className="w-full h-1.5 rounded-full mb-5 overflow-hidden"
                                        style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ background: timerColor, width: `${timerPercent}%` }}
                                            transition={{ width: { duration: 0.3 } }}
                                        />
                                    </div>

                                    {/* Streak & Combo */}
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-1.5">
                                            <Flame className="w-3.5 h-3.5" style={{ color: streak >= 3 ? '#ef4444' : subtextColor }} />
                                            <span className="text-xs font-mono" style={{ color: subtextColor }}>
                                                Streak: <span style={{ color: streak >= 3 ? '#ef4444' : textColor }}>{streak}</span>
                                            </span>
                                        </div>
                                        {combo > 1 && (
                                            <motion.div
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="text-xs font-orbitron font-bold px-2 py-0.5 rounded-full"
                                                style={{
                                                    color: '#f59e0b',
                                                    background: 'rgba(245,158,11,0.15)',
                                                    border: '1px solid rgba(245,158,11,0.3)',
                                                }}
                                            >
                                                ×{combo} COMBO
                                            </motion.div>
                                        )}
                                        <div className="text-[10px] font-orbitron px-2 py-0.5 rounded-full"
                                            style={{
                                                color: difficulty === 'hard' ? '#ef4444' : difficulty === 'medium' ? '#f59e0b' : '#0aff00',
                                                background: difficulty === 'hard' ? 'rgba(239,68,68,0.12)' : difficulty === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(10,255,0,0.12)',
                                                border: `1px solid ${difficulty === 'hard' ? 'rgba(239,68,68,0.3)' : difficulty === 'medium' ? 'rgba(245,158,11,0.3)' : 'rgba(10,255,0,0.3)'}`,
                                            }}>
                                            {difficulty.toUpperCase()}
                                        </div>
                                    </div>

                                    {/* Problem */}
                                    <div className="rounded-xl p-6 mb-5 text-center" style={{ background: cardBg }}>
                                        <div className="text-4xl font-mono font-bold" style={{ color: textColor }}>
                                            {problem.question}
                                        </div>
                                    </div>

                                    {/* Feedback flash */}
                                    <AnimatePresence>
                                        {feedback && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="text-center text-sm font-bold mb-3 font-orbitron"
                                                style={{ color: feedback.type === 'correct' ? '#0aff00' : '#ef4444' }}
                                            >
                                                {feedback.type === 'correct' ? `✓ +${feedback.points}` : `✕ Answer: ${feedback.answer}`}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Answer input */}
                                    <form onSubmit={handleSubmit} className="flex gap-3">
                                        <input
                                            ref={inputRef}
                                            type="number"
                                            value={userAnswer}
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            placeholder="Your answer..."
                                            autoFocus
                                            className="flex-1 px-4 py-3 rounded-xl font-mono text-lg text-center outline-none transition-colors"
                                            style={{
                                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                                color: textColor,
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            className="px-5 py-3 rounded-xl font-bold transition-all hover:scale-105"
                                            style={{
                                                background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                                                color: '#fff',
                                            }}
                                        >
                                            GO
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* === FINISHED STATE === */}
                            {gameState === 'finished' && (
                                <div className="py-4">
                                    <div className="text-center">
                                        <Trophy className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
                                        <h2 className="text-3xl font-orbitron font-bold mb-1" style={{ color: textColor }}>
                                            {score}
                                        </h2>
                                        {userRank && (
                                            <div className="flex items-center justify-center gap-1 mb-1">
                                                <Crown className="w-3.5 h-3.5 text-yellow-500" />
                                                <span className="text-sm font-orbitron" style={{ color: '#f59e0b' }}>Rank #{userRank}</span>
                                            </div>
                                        )}
                                        <p className="text-[10px] font-orbitron tracking-widest mb-4" style={{ color: subtextColor }}>
                                            FINAL SCORE
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        {[
                                            { icon: Target, label: 'Accuracy', value: totalAttempted > 0 ? `${Math.round((totalCorrect / totalAttempted) * 100)}%` : '0%', color: '#00f5ff' },
                                            { icon: Flame, label: 'Best Streak', value: bestStreak.toString(), color: '#ef4444' },
                                            { icon: TrendingUp, label: 'Solved', value: `${totalCorrect}/${totalAttempted}`, color: '#0aff00' },
                                        ].map(stat => (
                                            <div key={stat.label} className="rounded-xl p-2.5 text-center" style={{ background: cardBg }}>
                                                <stat.icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
                                                <div className="text-sm font-orbitron font-bold" style={{ color: textColor }}>{stat.value}</div>
                                                <div className="text-[8px] mt-0.5" style={{ color: subtextColor }}>{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Leaderboard */}
                                    {leaderboard.length > 0 && (
                                        <div className="rounded-xl p-3 mb-4" style={{ background: cardBg }}>
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Crown className="w-3.5 h-3.5 text-yellow-500" />
                                                <span className="text-[10px] font-orbitron font-bold" style={{ color: subtextColor }}>LEADERBOARD</span>
                                            </div>
                                            <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-hide">
                                                {leaderboard.slice(0, 10).map((entry, i) => {
                                                    const isMe = entry.username === user?.username;
                                                    const medals = ['🥇', '🥈', '🥉'];
                                                    return (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ opacity: 0, x: 15 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.04 }}
                                                            className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-[11px]"
                                                            style={{
                                                                background: isMe
                                                                    ? (isDark ? 'rgba(0,245,255,0.08)' : 'rgba(0,200,255,0.06)')
                                                                    : 'transparent',
                                                                border: isMe ? '1px solid rgba(0,245,255,0.2)' : '1px solid transparent',
                                                            }}
                                                        >
                                                            <span className="w-5 text-center font-bold" style={{ color: i < 3 ? '#f59e0b' : subtextColor }}>
                                                                {i < 3 ? medals[i] : `#${i + 1}`}
                                                            </span>
                                                            <span className="flex-1 truncate font-bold" style={{ color: isMe ? '#00f5ff' : textColor }}>
                                                                {entry.username}{isMe && ' (you)'}
                                                            </span>
                                                            <span className="text-[10px]" style={{ color: subtextColor }}>
                                                                {Math.round(entry.accuracy)}%
                                                            </span>
                                                            <span className="font-mono font-bold" style={{ color: i === 0 ? '#f59e0b' : textColor }}>
                                                                {entry.score}
                                                            </span>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={startGame}
                                            className="px-6 py-2.5 rounded-xl font-orbitron text-xs font-bold tracking-wider transition-all hover:scale-105"
                                            style={{
                                                background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                                                color: '#fff',
                                                boxShadow: '0 0 20px rgba(239,68,68,0.2)',
                                            }}
                                        >
                                            ⚡ PLAY AGAIN
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            className="px-6 py-2.5 rounded-xl font-orbitron text-xs tracking-wider transition-colors"
                                            style={{
                                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                                color: subtextColor,
                                            }}
                                        >
                                            CLOSE
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CompetitiveMode;
