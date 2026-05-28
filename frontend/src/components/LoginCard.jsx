import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
import SoundManager from '../utils/SoundEngine';

const LoginCard = ({ onSuccess, onError }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '', username: '' });
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const cardRef = useRef(null);

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e) => {
        const rect = cardRef.current.getBoundingClientRect();

        const width = rect.width;
        const height = rect.height;

        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;

        const xPct = mouseXVal / width - 0.5;
        const yPct = mouseYVal / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        let res;
        if (isLogin) {
            res = await login(formData.email, formData.password);
        } else {
            res = await register(formData.username, formData.email, formData.password);
        }

        if (res.success) {
            if (onSuccess) onSuccess();
            else navigate('/calculator');
        } else {
            if (onError) onError();
            else SoundManager.playError();
            setError(res.error);
        }
    };

    return (
        <motion.div
            ref={cardRef}
            style={{
                rotateX: rotateX,
                rotateY: rotateY,
                transformStyle: "preserve-3d"
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-md perspective-1000"
        >
            <div className="bg-dark-card/80 backdrop-blur-xl p-8 rounded-2xl border border-neon-blue/30 shadow-[0_0_50px_rgba(0,243,255,0.1)] relative overflow-hidden group">
                {/* Animated Gradient Border */}
                <div className="absolute inset-0 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-gradient-xy pointer-events-none rounded-2xl p-[1px] -z-10" />

                <h2 className="text-3xl font-orbitron text-center mb-8 text-white drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]">
                    {isLogin ? 'SYSTEM LOGIN' : 'NEW USER REGISTRATION'}
                </h2>

                {error && (
                    <div className="bg-red-900/40 border border-red-500 text-red-100 p-3 rounded mb-4 text-sm backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <div className="relative group/input">
                            <User className="absolute left-3 top-3 text-neon-blue w-5 h-5 group-focus-within/input:text-neon-purple transition-colors" />
                            <input
                                type="text"
                                placeholder="Username"
                                className="input-field pl-10 bg-black/40 border-white/10 focus:bg-black/60 focus:border-neon-purple/50"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                    )}
                    <div className="relative group/input">
                        <Mail className="absolute left-3 top-3 text-neon-blue w-5 h-5 group-focus-within/input:text-neon-purple transition-colors" />
                        <input
                            type="email"
                            placeholder="Email"
                            className="input-field pl-10 bg-black/40 border-white/10 focus:bg-black/60 focus:border-neon-purple/50"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="relative group/input">
                        <Lock className="absolute left-3 top-3 text-neon-blue w-5 h-5 group-focus-within/input:text-neon-purple transition-colors" />
                        <input
                            type="password"
                            placeholder="Password"
                            className="input-field pl-10 bg-black/40 border-white/10 focus:bg-black/60 focus:border-neon-purple/50"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border border-neon-blue text-neon-blue font-orbitron tracking-widest hover:bg-neon-blue/20 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all duration-300 uppercase"
                        onMouseEnter={() => SoundManager.playHover()}
                        onClick={() => SoundManager.playClick()}
                    >
                        {isLogin ? 'Initialize' : 'Register'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400" style={{ transform: "translateZ(20px)" }}>
                    {isLogin ? "No Access? " : "Has Access? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-neon-pink hover:text-white transition-colors ml-1 font-bold underline decoration-neon-pink/50 hover:decoration-white"
                        onMouseEnter={() => SoundManager.playHover()}
                    >
                        {isLogin ? 'Create Identity' : 'Login'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default LoginCard;
