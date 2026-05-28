import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMath } from '../context/MathContext';
import { X, Zap, Trophy, Timer, ArrowRight } from 'lucide-react';
import SoundEngine from '../utils/SoundEngine';

const OP_GENERATORS = {
    '+': () => {
        const a = Math.floor(Math.random() * 100) + 1;
        const b = Math.floor(Math.random() * 100) + 1;
        return { question: `${a} + ${b}`, answer: a + b };
    },
    '-': () => {
        const a = Math.floor(Math.random() * 100) + 20;
        const b = Math.floor(Math.random() * a) + 1;
        return { question: `${a} - ${b}`, answer: a - b };
    },
    '*': () => {
        const a = Math.floor(Math.random() * 12) + 2;
        const b = Math.floor(Math.random() * 12) + 2;
        return { question: `${a} × ${b}`, answer: a * b };
    },
    '/': () => {
        const b = Math.floor(Math.random() * 10) + 2;
        const answer = Math.floor(Math.random() * 12) + 1;
        const a = b * answer;
        return { question: `${a} ÷ ${b}`, answer };
    },
};

const ROUND_COUNT = 5;
const ROUND_TIME = 15; // seconds per question

const PracticeMode = () => {
    const { practiceSuggestion, dismissPracticeSuggestion, registerCalculation } = useMath();

    const [mode, setMode] = useState('suggestion'); // suggestion, playing, results
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
    const [answers, setAnswers] = useState([]); // { correct, userAnswer, expected, question }
    const timerRef = useRef(null);
    const inputRef = useRef(null);

    // Generate questions when entering practice
    const startPractice = useCallback(() => {
        if (!practiceSuggestion) return;
        const gen = OP_GENERATORS[practiceSuggestion.type];
        if (!gen) return;

        const qs = Array.from({ length: ROUND_COUNT }, () => gen());
        setQuestions(qs);
        setCurrentQ(0);
        setScore(0);
        setAnswers([]);
        setUserInput('');
        setTimeLeft(ROUND_TIME);
        setMode('playing');
        SoundEngine.playLevelUp();
    }, [practiceSuggestion]);

    // Timer countdown
    useEffect(() => {
        if (mode !== 'playing') return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleSubmit(true); // time's up, auto-submit
                    return ROUND_TIME;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [mode, currentQ]);

    // Focus input when question changes
    useEffect(() => {
        if (mode === 'playing' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [currentQ, mode]);

    const handleSubmit = (timedOut = false) => {
        if (mode !== 'playing' || !questions[currentQ]) return;

        const expected = questions[currentQ].answer;
        const userAnswer = timedOut ? null : parseFloat(userInput);
        const correct = userAnswer === expected;

        if (correct) {
            setScore(prev => prev + 1);
            SoundEngine.playEqual(expected);
        } else {
            SoundEngine.playError();
        }

        const newAnswers = [...answers, {
            correct,
            userAnswer: timedOut ? 'Timed out' : userInput,
            expected,
            question: questions[currentQ].question,
        }];
        setAnswers(newAnswers);

        if (currentQ + 1 >= ROUND_COUNT) {
            // All done
            clearInterval(timerRef.current);
            setMode('results');
            // Register XP for practice
            registerCalculation(`practice_${practiceSuggestion?.type}`, String(correct ? 1 : 0));
        } else {
            setCurrentQ(prev => prev + 1);
            setUserInput('');
            setTimeLeft(ROUND_TIME);
        }
    };

    const handleClose = () => {
        clearInterval(timerRef.current);
        dismissPracticeSuggestion();
        setMode('suggestion');
    };

    if (!practiceSuggestion) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
            >
                {/* SUGGESTION BANNER */}
                {mode === 'suggestion' && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="rounded-xl px-6 py-4 flex items-center gap-4 max-w-lg"
                        style={{
                            background: 'rgba(15, 20, 35, 0.95)',
                            border: '1px solid rgba(0, 245, 255, 0.3)',
                            boxShadow: '0 0 30px rgba(0, 245, 255, 0.1), 0 8px 32px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        <Zap className="w-6 h-6 text-[#00f5ff] flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-gray-200 text-sm">
                                You seem to be practicing <span className="text-[#00f5ff] font-bold">{practiceSuggestion.label}</span>.
                            </p>
                            <p className="text-gray-500 text-xs mt-0.5">Want to switch to practice mode?</p>
                        </div>
                        <button
                            onClick={startPractice}
                            className="px-4 py-2 rounded-lg text-sm font-orbitron text-[#00f5ff] border border-[#00f5ff]/40 hover:bg-[#00f5ff]/10 transition-all flex items-center gap-1"
                        >
                            Start <ArrowRight className="w-3 h-3" />
                        </button>
                        <button onClick={handleClose} className="text-gray-500 hover:text-white ml-1">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}

                {/* PLAYING MODE */}
                {mode === 'playing' && questions[currentQ] && (
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="rounded-2xl p-6 w-[400px]"
                        style={{
                            background: 'rgba(15, 20, 35, 0.95)',
                            border: '1px solid rgba(0, 245, 255, 0.2)',
                            boxShadow: '0 0 40px rgba(0, 245, 255, 0.08), 0 8px 32px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(24px)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[#00f5ff]" />
                                <span className="text-xs font-orbitron text-gray-400 tracking-widest">
                                    PRACTICE MODE
                                </span>
                            </div>
                            <button onClick={handleClose} className="text-gray-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="flex gap-1 mb-4">
                            {Array.from({ length: ROUND_COUNT }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 h-1 rounded-full"
                                    style={{
                                        background: i < currentQ
                                            ? (answers[i]?.correct ? '#0aff00' : '#ef4444')
                                            : i === currentQ ? '#00f5ff' : 'rgba(255,255,255,0.1)',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Timer + Score */}
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                                <Timer className="w-3.5 h-3.5" />
                                <span className={timeLeft <= 5 ? 'text-red-400 font-bold' : ''}>
                                    {timeLeft}s
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="text-gray-300">
                                    {score}/{currentQ}
                                </span>
                            </div>
                        </div>

                        {/* Question */}
                        <div className="text-center mb-5">
                            <motion.h2
                                key={currentQ}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl font-mono font-bold"
                                style={{ color: '#00f5ff', textShadow: '0 0 20px rgba(0,245,255,0.4)' }}
                            >
                                {questions[currentQ].question} = ?
                            </motion.h2>
                        </div>

                        {/* Input */}
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}
                            className="flex gap-2"
                        >
                            <input
                                ref={inputRef}
                                type="number"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-lg font-mono text-2xl text-center text-white focus:outline-none"
                                style={{
                                    background: '#111827',
                                    border: '1px solid rgba(0,245,255,0.2)',
                                }}
                                placeholder="?"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="px-5 py-3 rounded-lg font-orbitron text-sm text-[#00f5ff] border border-[#00f5ff]/40 hover:bg-[#00f5ff]/10 transition-all"
                            >
                                GO
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* RESULTS */}
                {mode === 'results' && (
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="rounded-2xl p-6 w-[400px]"
                        style={{
                            background: 'rgba(15, 20, 35, 0.95)',
                            border: '1px solid rgba(0, 245, 255, 0.2)',
                            boxShadow: '0 0 40px rgba(0, 245, 255, 0.08), 0 8px 32px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(24px)',
                        }}
                    >
                        <div className="text-center mb-4">
                            <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                            <h2 className="text-2xl font-orbitron text-[#00f5ff]">
                                {score}/{ROUND_COUNT}
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                {score === ROUND_COUNT ? 'Perfect! 🎉' : score >= 3 ? 'Great work!' : 'Keep practicing!'}
                            </p>
                        </div>

                        {/* Answer breakdown */}
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto scrollbar-hide">
                            {answers.map((a, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between items-center px-3 py-2 rounded-lg text-sm"
                                    style={{ background: a.correct ? 'rgba(10,255,0,0.08)' : 'rgba(239,68,68,0.08)' }}
                                >
                                    <span className="text-gray-300 font-mono">{a.question}</span>
                                    <span className={a.correct ? 'text-green-400' : 'text-red-400'}>
                                        {a.userAnswer} {!a.correct && <span className="text-gray-500">({a.expected})</span>}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={startPractice}
                                className="flex-1 py-2 rounded-lg font-orbitron text-sm text-[#00f5ff] border border-[#00f5ff]/40 hover:bg-[#00f5ff]/10 transition-all"
                            >
                                Again
                            </button>
                            <button
                                onClick={handleClose}
                                className="flex-1 py-2 rounded-lg font-orbitron text-sm text-gray-400 border border-gray-600 hover:bg-gray-800 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default PracticeMode;
