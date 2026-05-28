import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const MathContext = createContext();

export const useMath = () => useContext(MathContext);

export const MathProvider = ({ children }) => {
    // --- GAMIFICATION STATE ---
    const [xp, setXp] = useState(() => parseInt(localStorage.getItem('math_xp')) || 0);
    const [level, setLevel] = useState(1);
    const [totalCalcs, setTotalCalcs] = useState(() => parseInt(localStorage.getItem('math_total_calcs')) || 0);

    // --- ANALYTICS STATE ---
    const [operatorStats, setOperatorStats] = useState(() => JSON.parse(localStorage.getItem('math_operator_stats')) || {});
    const [highScore, setHighScore] = useState(() => parseFloat(localStorage.getItem('math_high_score')) || 0);

    // --- REACTION STATE ---
    const [lastResult, setLastResult] = useState(null);
    const [universeState, setUniverseState] = useState('neutral');
    const [personalityComment, setPersonalityComment] = useState("");
    const [showLevelUp, setShowLevelUp] = useState(false);

    // --- PRACTICE MODE DETECTION ---
    const [recentOps, setRecentOps] = useState([]); // last N dominant operators
    const [practicesSuggestion, setPracticeSuggestion] = useState(null); // { type: '+', label: 'addition' }

    // --- AI CHAT STATE ---
    const [aiSessions, setAiSessions] = useState(() => JSON.parse(localStorage.getItem('math_ai_sessions')) || []);
    const [activeSessionId, setActiveSessionId] = useState(null);

    const aiHistory = aiSessions.find(s => s.id === activeSessionId)?.messages || [];

    useEffect(() => {
        localStorage.setItem('math_ai_sessions', JSON.stringify(aiSessions));
    }, [aiSessions]);

    const createNewSession = () => {
        const newId = Date.now().toString();
        setAiSessions(prev => [{ id: newId, title: 'New Chat', messages: [], updatedAt: Date.now() }, ...prev]);
        setActiveSessionId(newId);
        return newId;
    };

    const deleteSession = (id) => {
        setAiSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) {
            setActiveSessionId(null);
        }
    };

    const setAiHistory = (action) => {
        setAiSessions(prev => {
            let activeId = activeSessionId;
            let currentSessions = [...prev];
            
            if (!activeId) {
                // If there's no active session, create one implicitly
                activeId = Date.now().toString();
                currentSessions = [{ id: activeId, title: 'New Chat', messages: [], updatedAt: Date.now() }, ...currentSessions];
                // We'll asynchronously update the activeSessionId to match
                setTimeout(() => setActiveSessionId(activeId), 0);
            }

            return currentSessions.map(s => {
                if (s.id === activeId) {
                    const nextMessages = typeof action === 'function' ? action(s.messages) : action;
                    let title = s.title;
                    if (s.messages.length === 0 && nextMessages.length > 0 && nextMessages[0].text) {
                        title = nextMessages[0].text.substring(0, 30) + '...';
                    }
                    return { ...s, messages: nextMessages, title, updatedAt: Date.now() };
                }
                return s;
            }).sort((a, b) => b.updatedAt - a.updatedAt);
        });
    };

    // --- TYPING SPEED TRACKING ---
    const [typingSpeed, setTypingSpeed] = useState(0); // keys per second (0-10 range)
    const keystrokeTimesRef = useRef([]);

    // Level thresholds
    const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 2000];
    const LEVEL_TITLES = ["Beginner", "Algebra Explorer", "Equation Master", "Math Architect", "Math Overlord", "Singularity"];

    const OP_LABELS = {
        '+': 'addition',
        '-': 'subtraction',
        '*': 'multiplication',
        '/': 'division',
    };

    useEffect(() => {
        let newLevel = 1;
        for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
            if (xp >= LEVEL_THRESHOLDS[i]) newLevel = i + 1;
        }
        if (newLevel > level) {
            setLevel(newLevel);
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 3000);
        } else {
            setLevel(newLevel);
        }

        localStorage.setItem('math_xp', xp);
        localStorage.setItem('math_total_calcs', totalCalcs);
        localStorage.setItem('math_operator_stats', JSON.stringify(operatorStats));
        localStorage.setItem('math_high_score', highScore);
    }, [xp, totalCalcs, operatorStats, highScore]);

    // Typing speed: record keystroke and compute rolling speed
    const recordKeystroke = useCallback(() => {
        const now = Date.now();
        const times = keystrokeTimesRef.current;
        times.push(now);

        // Keep only last 2 seconds of keystrokes
        const cutoff = now - 2000;
        while (times.length > 0 && times[0] < cutoff) {
            times.shift();
        }

        // Compute keys per second
        const windowMs = times.length > 1 ? (times[times.length - 1] - times[0]) : 2000;
        const kps = times.length > 1 ? (times.length / (windowMs / 1000)) : 0;
        setTypingSpeed(Math.min(kps, 12)); // cap at 12
    }, []);

    // Decay typing speed when idle
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const times = keystrokeTimesRef.current;
            if (times.length === 0 || now - times[times.length - 1] > 1500) {
                setTypingSpeed(prev => prev > 0.2 ? prev * 0.7 : 0);
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // Detect dominant operator from expression
    const detectDominantOp = (expression) => {
        const ops = expression.match(/[\+\-\*\/]/g) || [];
        if (ops.length === 0) return null;

        const counts = {};
        ops.forEach(op => { counts[op] = (counts[op] || 0) + 1; });

        let dominant = ops[0];
        let maxCount = 0;
        Object.entries(counts).forEach(([op, count]) => {
            if (count > maxCount) { maxCount = count; dominant = op; }
        });
        return dominant;
    };

    const registerCalculation = (expression, result) => {
        const numResult = parseFloat(result);

        // 1. Update Stats
        setTotalCalcs(prev => prev + 1);
        if (!isNaN(numResult) && numResult > highScore) setHighScore(numResult);

        // 2. XP Logic
        const complexity = expression.length + (expression.match(/[\+\-\*\/]/g) || []).length * 5;
        setXp(prev => prev + complexity + 10);

        // 3. Universe State Logic
        setLastResult(numResult);
        if (isNaN(numResult)) {
            setUniverseState('glitch');
        } else if (numResult === 0) {
            setUniverseState('void');
        } else if (numResult > 100000) {
            setUniverseState('supernova');
        } else if (numResult < 0) {
            setUniverseState('negative');
        } else {
            setUniverseState('positive');
        }

        // 4. Personality Logic
        generateComment(expression, numResult);

        // 5. Practice mode detection
        const dominantOp = detectDominantOp(expression);
        if (dominantOp) {
            setRecentOps(prev => {
                const updated = [...prev, dominantOp].slice(-6); // keep last 6

                // Check if 4+ of last 6 are the same operator
                const counts = {};
                updated.forEach(op => { counts[op] = (counts[op] || 0) + 1; });

                let shouldSuggest = null;
                Object.entries(counts).forEach(([op, count]) => {
                    if (count >= 4 && OP_LABELS[op]) {
                        shouldSuggest = { type: op, label: OP_LABELS[op] };
                    }
                });

                if (shouldSuggest) {
                    setPracticeSuggestion(shouldSuggest);
                }

                return updated;
            });
        }

        // 6. Update operator stats
        const ops = expression.match(/[\+\-\*\/]/g) || [];
        if (ops.length > 0) {
            setOperatorStats(prev => {
                const updated = { ...prev };
                ops.forEach(op => { updated[op] = (updated[op] || 0) + 1; });
                return updated;
            });
        }

        // Reset universe state
        if (Math.abs(numResult) < 100000 && numResult !== 0) {
            setTimeout(() => setUniverseState('neutral'), 2000);
        }
    };

    const dismissPracticeSuggestion = () => {
        setPracticeSuggestion(null);
        setRecentOps([]);
    };

    const generateComment = (expr, res) => {
        if (res === Infinity || expr.includes('/0')) {
            setPersonalityComment("Division by zero destabilizes the fabric of reality.");
        } else if (res === 0) {
            setPersonalityComment("Precisely nothing. A void in the equation.");
        } else if (res > 1000000) {
            setPersonalityComment("Such magnitude... Are you calculating galaxy masses?");
        } else if (res === 42) {
            setPersonalityComment("The answer to life, the universe, and everything.");
        } else if (res % 1 !== 0) {
            setPersonalityComment("Decimal precision is the hallmark of a refined mind.");
        } else {
            const comments = [
                "Elegant calculation.",
                "The numbers align.",
                "Pure logic.",
                "Processing...",
                "Mathematically sound."
            ];
            setPersonalityComment(comments[Math.floor(Math.random() * comments.length)]);
        }
    };

    return (
        <MathContext.Provider value={{
            xp, level, levelTitle: LEVEL_TITLES[level - 1], maxLevelXp: LEVEL_THRESHOLDS[level] || 9999,
            totalCalcs, highScore, operatorStats,
            universeState, personalityComment, showLevelUp,
            registerCalculation,
            // Practice mode
            practiceSuggestion: practicesSuggestion,
            dismissPracticeSuggestion,
            // Typing speed
            typingSpeed,
            recordKeystroke,
            // AI History & Sessions
            aiSessions, activeSessionId, setActiveSessionId,
            createNewSession, deleteSession,
            aiHistory, setAiHistory
        }}>
            {children}
        </MathContext.Provider>
    );
};
