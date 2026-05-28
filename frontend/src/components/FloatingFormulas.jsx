import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const formulas = [
    'E = mc²', 'a² + b² = c²', 'F = ma', 'e^{i\\pi} + 1 = 0',
    '\\sin^2\\theta + \\cos^2\\theta = 1', '\\int e^x dx = e^x',
    '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', 'A = \\pi r^2',
    '\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\epsilon_0}'
];

const FloatingFormulas = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const newItems = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            text: formulas[Math.floor(Math.random() * formulas.length)],
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: 20 + Math.random() * 20,
            delay: Math.random() * 10,
            scale: 0.5 + Math.random() * 1,
        }));
        setItems(newItems);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {items.map((item) => (
                <motion.div
                    key={item.id}
                    className="absolute text-neon-blue/20 font-serif"
                    style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        fontSize: `${item.scale}rem`
                    }}
                    animate={{
                        y: [0, -100, 0],
                        opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                        duration: item.duration,
                        repeat: Infinity,
                        ease: "linear",
                        delay: item.delay
                    }}
                >
                    {item.text}
                </motion.div>
            ))}
        </div>
    );
};

export default FloatingFormulas;
