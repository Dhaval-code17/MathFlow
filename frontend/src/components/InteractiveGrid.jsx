import React, { useRef, useEffect } from 'react';

const InteractiveGrid = () => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        resize();

        const gridSize = 50;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)'; // Neon blue low opacity
            ctx.lineWidth = 1;

            for (let x = 0; x <= canvas.width; x += gridSize) {
                for (let y = 0; y <= canvas.height; y += gridSize) {
                    const dx = x - mouseRef.current.x;
                    const dy = y - mouseRef.current.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 300;

                    let drawX = x;
                    let drawY = y;

                    if (distance < maxDist) {
                        const force = (maxDist - distance) / maxDist;
                        const angle = Math.atan2(dy, dx);
                        drawX -= Math.cos(angle) * force * 20;
                        drawY -= Math.sin(angle) * force * 20;
                        ctx.strokeStyle = `rgba(188, 19, 254, ${0.1 + force * 0.3})`; // Purple glow on hover
                    } else {
                        ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
                    }

                    ctx.beginPath();
                    // Draw horizontal segment
                    if (x < canvas.width) {
                        ctx.moveTo(drawX, drawY);
                        ctx.lineTo(drawX + gridSize, drawY);
                    }
                    // Draw vertical segment
                    if (y < canvas.height) {
                        ctx.moveTo(drawX, drawY);
                        ctx.lineTo(drawX, drawY + gridSize);
                    }
                    ctx.stroke();
                }
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
        />
    );
};

export default InteractiveGrid;
