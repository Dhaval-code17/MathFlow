import React from 'react';

const LoginScene = () => {
    return (
        <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#050816] to-[#0a0f1f]">
            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(0,245,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Ambient neon glow orb - top right */}
            <div
                className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(0,245,255,0.15) 0%, transparent 70%)',
                    animation: 'ambientFloat 8s ease-in-out infinite',
                }}
            />

            {/* Ambient neon glow orb - bottom left */}
            <div
                className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(160,32,240,0.12) 0%, transparent 70%)',
                    animation: 'ambientFloat 10s ease-in-out infinite reverse',
                }}
            />

            {/* Floating math symbols */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {['π', '∑', '∞', '√', '∫', 'Δ', 'θ', 'λ'].map((sym, i) => (
                    <span
                        key={i}
                        className="absolute text-neon-blue/10 font-orbitron select-none"
                        style={{
                            fontSize: `${20 + Math.random() * 40}px`,
                            left: `${10 + (i * 12) % 80}%`,
                            top: `${5 + (i * 15) % 85}%`,
                            animation: `symbolDrift ${6 + i * 1.5}s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.7}s`,
                        }}
                    >
                        {sym}
                    </span>
                ))}
            </div>

            <style>{`
                @keyframes ambientFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(20px, -30px) scale(1.1); }
                }
                @keyframes symbolDrift {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0.08; }
                    100% { transform: translateY(-20px) rotate(10deg); opacity: 0.15; }
                }
            `}</style>
        </div>
    );
};

export default LoginScene;
