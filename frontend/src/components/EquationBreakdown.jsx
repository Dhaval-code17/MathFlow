import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Step-by-step equation breakdown following BODMAS.
 * Renders as a STABLE overlay on top of the calculator — no open/close between steps.
 */
const generateSteps = (expression) => {
    const steps = [];
    const tokenize = (expr) => {
        const tokens = [];
        let num = '';
        for (let i = 0; i < expr.length; i++) {
            const ch = expr[i];
            if (ch === ' ') continue;
            if ('+-*/%'.includes(ch) && num !== '') {
                tokens.push(parseFloat(num));
                tokens.push(ch);
                num = '';
            } else if (ch === '-' && num === '') {
                num += ch;
            } else {
                num += ch;
            }
        }
        if (num !== '') tokens.push(parseFloat(num));
        return tokens;
    };

    const tokensToString = (tokens) =>
        tokens.map(t => typeof t === 'number'
            ? (Number.isInteger(t) ? t.toString() : t.toFixed(4).replace(/\.?0+$/, ''))
            : ` ${t} `
        ).join('');

    const fmt = (n) => Number.isInteger(n) ? n.toString() : n.toFixed(2);
    const fmtRes = (n) => Number.isInteger(n) ? n.toString() : n.toFixed(4).replace(/\.?0+$/, '');

    let tokens = tokenize(expression.trim());
    const ops = tokens.filter(t => typeof t === 'string');
    if (ops.length === 0) return [];

    steps.push({ expression: tokensToString(tokens), highlight: null, description: 'Original expression' });

    let safety = 0;
    while (safety++ < 20) {
        const idx = tokens.findIndex(t => t === '*' || t === '/' || t === '%');
        if (idx === -1) break;
        const left = tokens[idx - 1], op = tokens[idx], right = tokens[idx + 1];
        if (typeof left !== 'number' || typeof right !== 'number') break;
        let res;
        if (op === '*') res = left * right;
        else if (op === '/') res = right !== 0 ? left / right : Infinity;
        else res = left % right;
        const opSym = op === '*' ? '×' : op === '/' ? '÷' : '%';
        steps.push({
            expression: tokensToString(tokens),
            highlight: `${fmt(left)} ${opSym} ${fmt(right)}`,
            description: `${fmt(left)} ${opSym} ${fmt(right)} = ${fmtRes(res)}`,
        });
        tokens.splice(idx - 1, 3, res);
    }

    safety = 0;
    while (safety++ < 20) {
        const idx = tokens.findIndex(t => t === '+' || t === '-');
        if (idx === -1) break;
        const left = tokens[idx - 1], op = tokens[idx], right = tokens[idx + 1];
        if (typeof left !== 'number' || typeof right !== 'number') break;
        const res = op === '+' ? left + right : left - right;
        steps.push({
            expression: tokensToString(tokens),
            highlight: `${fmt(left)} ${op} ${fmt(right)}`,
            description: `${fmt(left)} ${op} ${fmt(right)} = ${fmtRes(res)}`,
        });
        tokens.splice(idx - 1, 3, res);
    }

    if (tokens.length === 1 && typeof tokens[0] === 'number') {
        const v = tokens[0];
        steps.push({
            expression: Number.isInteger(v) ? v.toString() : v.toFixed(4).replace(/\.?0+$/, ''),
            highlight: null,
            description: 'Final result',
        });
    }
    return steps;
};


const EquationBreakdown = ({ expression, onComplete }) => {
    const [steps, setSteps] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (!expression) return;
        const generated = generateSteps(expression);
        if (generated.length <= 2) { onComplete?.(); return; }
        setSteps(generated);
        setCurrentStep(0);
        setVisible(true);
    }, [expression]);

    useEffect(() => {
        if (!visible || steps.length === 0) return;
        if (currentStep < steps.length - 1) {
            timeoutRef.current = setTimeout(() => setCurrentStep(prev => prev + 1), 800);
        } else {
            timeoutRef.current = setTimeout(() => { setVisible(false); onComplete?.(); }, 600);
        }
        return () => clearTimeout(timeoutRef.current);
    }, [currentStep, visible, steps]);

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    if (!visible || steps.length === 0) return null;
    const step = steps[currentStep];

    // Stable overlay — container stays mounted, only inner content transitions
    return (
        <div
            className="absolute inset-0 flex flex-col items-center justify-center z-40 rounded-2xl pointer-events-none"
            style={{
                background: 'rgba(5, 8, 22, 0.92)',
                backdropFilter: 'blur(16px)',
            }}
        >
            {/* Step dots */}
            <div className="flex gap-1.5 mb-4">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                            background: i <= currentStep ? '#00f5ff' : 'rgba(255,255,255,0.15)',
                            boxShadow: i === currentStep ? '0 0 8px #00f5ff' : 'none',
                            transition: 'all 0.3s ease',
                        }}
                    />
                ))}
            </div>

            {/* Label */}
            <div className="text-[10px] font-orbitron text-gray-500 tracking-widest mb-3">
                STEP {currentStep + 1} OF {steps.length}
            </div>

            {/* Highlight tag */}
            <div className="h-8 flex items-center justify-center mb-3">
                {step.highlight ? (
                    <motion.div
                        key={`hl-${currentStep}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-mono px-4 py-1.5 rounded-full"
                        style={{
                            color: '#a855f7',
                            background: 'rgba(160,32,240,0.12)',
                            border: '1px solid rgba(160,32,240,0.3)',
                            textShadow: '0 0 10px rgba(160,32,240,0.3)',
                        }}
                    >
                        {step.highlight}
                    </motion.div>
                ) : null}
            </div>

            {/* Current expression — crossfades without closing the overlay */}
            <motion.div
                key={`expr-${currentStep}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-3xl font-mono font-bold tracking-wide"
                style={{
                    color: currentStep === steps.length - 1 ? '#00f5ff' : '#e2e8f0',
                    textShadow: currentStep === steps.length - 1
                        ? '0 0 25px rgba(0,245,255,0.6)'
                        : '0 0 5px rgba(255,255,255,0.1)',
                }}
            >
                {step.expression}
            </motion.div>

            {/* Description */}
            <motion.div
                key={`desc-${currentStep}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="text-xs text-gray-500 mt-3 font-mono"
            >
                {step.description}
            </motion.div>
        </div>
    );
};

export default EquationBreakdown;
