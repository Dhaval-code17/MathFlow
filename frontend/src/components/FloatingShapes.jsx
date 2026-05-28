import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Animated floating shapes / particles for the background.
 * - Light mode: soft pastel blobs, gentle floating geometric shapes
 * - Dark mode: subtle glowing orbs
 */
const FloatingShapes = () => {
    const canvasRef = useRef(null);
    const { isDark } = useTheme();
    const animRef = useRef(null);
    const shapesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create shapes
        const SHAPE_COUNT = 18;
        const shapes = [];
        for (let i = 0; i < SHAPE_COUNT; i++) {
            shapes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 20 + Math.random() * 60,
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: (Math.random() - 0.5) * 0.3,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.005,
                type: ['circle', 'ring', 'triangle', 'diamond', 'plus'][Math.floor(Math.random() * 5)],
                hue: Math.random() * 360,
                phase: Math.random() * Math.PI * 2,
            });
        }
        shapesRef.current = shapes;

        const drawShape = (s, t) => {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rotation);

            const pulse = 0.9 + 0.1 * Math.sin(t * 0.001 + s.phase);
            const sz = s.size * pulse;

            if (isDark) {
                // Dark mode: soft glowing orbs
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz);
                grad.addColorStop(0, `hsla(${s.hue}, 70%, 60%, 0.12)`);
                grad.addColorStop(1, `hsla(${s.hue}, 70%, 60%, 0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, sz, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Light mode: pastel geometric shapes with soft fills
                const alpha = 0.08 + 0.04 * Math.sin(t * 0.0008 + s.phase);
                ctx.strokeStyle = `hsla(${s.hue}, 55%, 65%, ${alpha + 0.06})`;
                ctx.fillStyle = `hsla(${s.hue}, 55%, 75%, ${alpha})`;
                ctx.lineWidth = 1.5;

                switch (s.type) {
                    case 'circle':
                        ctx.beginPath();
                        ctx.arc(0, 0, sz * 0.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();
                        break;
                    case 'ring':
                        ctx.beginPath();
                        ctx.arc(0, 0, sz * 0.5, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(0, 0, sz * 0.3, 0, Math.PI * 2);
                        ctx.stroke();
                        break;
                    case 'triangle':
                        ctx.beginPath();
                        for (let j = 0; j < 3; j++) {
                            const a = (j * 2 * Math.PI) / 3 - Math.PI / 2;
                            const px = Math.cos(a) * sz * 0.45;
                            const py = Math.sin(a) * sz * 0.45;
                            j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                        break;
                    case 'diamond':
                        ctx.beginPath();
                        ctx.moveTo(0, -sz * 0.45);
                        ctx.lineTo(sz * 0.3, 0);
                        ctx.lineTo(0, sz * 0.45);
                        ctx.lineTo(-sz * 0.3, 0);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                        break;
                    case 'plus':
                        const w = sz * 0.12;
                        const h = sz * 0.4;
                        ctx.fillRect(-w, -h, w * 2, h * 2);
                        ctx.fillRect(-h, -w, h * 2, w * 2);
                        ctx.strokeRect(-w, -h, w * 2, h * 2);
                        ctx.strokeRect(-h, -w, h * 2, w * 2);
                        break;
                }
            }
            ctx.restore();
        };

        const animate = (t) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const s of shapes) {
                s.x += s.speedX;
                s.y += s.speedY;
                s.rotation += s.rotationSpeed;

                // Wrap around
                if (s.x < -s.size) s.x = canvas.width + s.size;
                if (s.x > canvas.width + s.size) s.x = -s.size;
                if (s.y < -s.size) s.y = canvas.height + s.size;
                if (s.y > canvas.height + s.size) s.y = -s.size;

                drawShape(s, t);
            }

            animRef.current = requestAnimationFrame(animate);
        };

        animRef.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [isDark]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ opacity: isDark ? 0.5 : 1 }}
        />
    );
};

export default FloatingShapes;
