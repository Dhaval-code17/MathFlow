import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Triangle, Square, Circle as CircleIcon, Calculator, RotateCcw, PenTool } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import GeometryCanvas from './GeometryCanvas';

const SHAPES = [
    { id: 'triangle', icon: Triangle, label: 'Right Triangle' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: CircleIcon, label: 'Circle' },
    { id: 'custom', icon: PenTool, label: 'Draw' }
];

const GeometryBuilder = ({ onSolveCanvas }) => {
    const theme = useTheme();
    const [activeShape, setActiveShape] = useState('triangle');
    const [data, setData] = useState({});
    const [error, setError] = useState('');

    // Reset data when shape changes
    useEffect(() => {
        setData({});
        setError('');
    }, [activeShape]);

    const handleChange = (key, value) => {
        setData(prev => ({ ...prev, [key]: value }));
        setError('');
    };

    const handleSolve = () => {
        try {
            let result = { ...data };
            const parse = (val) => val ? parseFloat(val) : null;

            if (activeShape === 'triangle') {
                let a = parse(result.a), b = parse(result.b), c = parse(result.c);
                let angleA = parse(result.angleA), angleB = parse(result.angleB);

                // Pythagoras
                if (a && b && !c) c = Math.sqrt(a*a + b*b);
                else if (a && c && !b) b = Math.sqrt(c*c - a*a);
                else if (b && c && !a) a = Math.sqrt(c*c - b*b);

                // Trig from sides
                if (a && c && !angleA) angleA = Math.asin(a/c) * (180/Math.PI);
                if (b && c && !angleB) angleB = Math.asin(b/c) * (180/Math.PI);

                // Sides from Angle & Hypotenuse
                if (c && angleA && !a) a = c * Math.sin(angleA * (Math.PI/180));
                if (c && angleA && !b) b = c * Math.cos(angleA * (Math.PI/180));

                if (!angleB && angleA) angleB = 90 - angleA;
                if (!angleA && angleB) angleA = 90 - angleB;

                if (!a || !b || !c) throw new Error('Not enough info to solve triangle');
                
                result = {
                    a: a.toFixed(2), b: b.toFixed(2), c: c.toFixed(2),
                    angleA: angleA.toFixed(2), angleB: angleB.toFixed(2),
                    area: (0.5 * a * b).toFixed(2),
                    perimeter: (a + b + c).toFixed(2)
                };
            } 
            else if (activeShape === 'rectangle') {
                let w = parse(result.w), h = parse(result.h), d = parse(result.d), area = parse(result.area);

                if (w && h && !d) d = Math.sqrt(w*w + h*h);
                if (w && d && !h) h = Math.sqrt(d*d - w*w);
                if (h && d && !w) w = Math.sqrt(d*d - h*h);
                if (w && area && !h) { h = area / w; d = Math.sqrt(w*w + h*h); }
                if (h && area && !w) { w = area / h; d = Math.sqrt(w*w + h*h); }

                if (!w || !h) throw new Error('Not enough info to solve rectangle');

                result = {
                    w: w.toFixed(2), h: h.toFixed(2), d: d.toFixed(2),
                    area: (w * h).toFixed(2),
                    perimeter: (2 * (w + h)).toFixed(2)
                };
            }
            else if (activeShape === 'circle') {
                let r = parse(result.r), d = parse(result.d), c = parse(result.c), area = parse(result.area);

                if (r) { d = r * 2; c = 2 * Math.PI * r; area = Math.PI * r * r; }
                else if (d) { r = d / 2; c = 2 * Math.PI * r; area = Math.PI * r * r; }
                else if (c) { r = c / (2 * Math.PI); d = r * 2; area = Math.PI * r * r; }
                else if (area) { r = Math.sqrt(area / Math.PI); d = r * 2; c = 2 * Math.PI * r; }
                
                if (!r) throw new Error('Not enough info to solve circle');

                result = {
                    r: r.toFixed(2), d: d.toFixed(2),
                    c: c.toFixed(2), area: area.toFixed(2)
                };
            }

            setData(result);
            setError('');
        } catch (err) {
            setError(err.message || 'Invalid calculation');
        }
    };

    const inputStyle = `w-16 ${theme.isDark ? 'bg-black/40 placeholder-white/20' : 'bg-white/50 placeholder-black/30 text-black'} border border-[#00f5ff]/30 rounded text-center ${theme.isDark ? 'text-[#00f5ff]' : 'text-[#00b5cc]'} font-mono text-sm py-1 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all`;

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-y-auto overflow-x-hidden">
            {/* Shape Selector */}
            <div className={`flex gap-2 mb-4 ${theme.isDark ? 'bg-black/20 border-white/5' : 'bg-black/5 border-black/5'} p-1.5 rounded-lg border`}>
                {SHAPES.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveShape(s.id)}
                        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                            activeShape === s.id 
                                ? `bg-[#00f5ff]/20 ${theme.isDark ? 'text-[#00f5ff]' : 'text-[#008b9c]'} shadow-[0_0_10px_rgba(0,245,255,0.2)]` 
                                : (theme.isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-black hover:bg-black/5')
                        }`}
                    >
                        <s.icon size={16} />
                        <span className="hidden sm:inline">{s.label}</span>
                    </button>
                ))}
            </div>

            {activeShape === 'custom' ? (
                <GeometryCanvas onSolveCanvas={onSolveCanvas} />
            ) : (
                <>
                    {/* Interactive Canvas Area */}
                    <div className={`flex-1 relative ${theme.isDark ? 'bg-black/30 border-white/5' : 'bg-white/50 border-black/10'} rounded-xl border flex items-center justify-center min-h-[300px]`}>
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeShape}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="relative w-full h-full flex items-center justify-center"
                    >
                        {activeShape === 'triangle' && (
                            <div className="relative w-64 h-48 mt-8">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <polygon points="10,90 90,90 10,10" fill="rgba(0,245,255,0.1)" stroke={theme.isDark ? "#00f5ff" : "#00a1ab"} strokeWidth="2" strokeLinejoin="round"/>
                                    {/* Right angle indicator */}
                                    <polyline points="10,80 20,80 20,90" fill="none" stroke={theme.isDark ? "#00f5ff" : "#00a1ab"} strokeWidth="1.5" />
                                </svg>
                                {/* Side A (left) */}
                                <div className="absolute left-[-2rem] top-1/2 -translate-y-1/2 flex flex-col items-center">
                                    <span className={`text-xs ${theme.isDark ? 'text-gray-400' : 'text-gray-600'} font-mono mb-1`}>Side a</span>
                                    <input type="number" value={data.a || ''} onChange={e => handleChange('a', e.target.value)} placeholder="a" className={inputStyle} />
                                </div>
                                {/* Side B (bottom) */}
                                <div className="absolute bottom-[-3rem] left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <input type="number" value={data.b || ''} onChange={e => handleChange('b', e.target.value)} placeholder="b" className={inputStyle} />
                                    <span className={`text-xs ${theme.isDark ? 'text-gray-400' : 'text-gray-600'} font-mono mt-1`}>Side b</span>
                                </div>
                                {/* Hypotenuse C */}
                                <div className="absolute top-1/2 left-1/2 translate-x-[-10px] translate-y-[-20px] flex flex-col items-center rotate-45 origin-center">
                                    <span className={`text-xs ${theme.isDark ? 'text-[#a855f7]' : 'text-[#8b3dce]'} font-mono mb-1`}>Side c</span>
                                    <input type="number" value={data.c || ''} onChange={e => handleChange('c', e.target.value)} placeholder="c" className={inputStyle} />
                                </div>
                                {/* Angle A (top) */}
                                <div className="absolute top-[1.5rem] left-[1.5rem] flex flex-col items-start">
                                    <input type="number" value={data.angleA || ''} onChange={e => handleChange('angleA', e.target.value)} placeholder="∠A°" className={`${inputStyle} w-14 h-6 text-xs`} />
                                </div>
                                {/* Angle B (bottom right) */}
                                <div className="absolute bottom-[0.5rem] right-[1.5rem] flex flex-col items-end">
                                    <input type="number" value={data.angleB || ''} onChange={e => handleChange('angleB', e.target.value)} placeholder="∠B°" className={`${inputStyle} w-14 h-6 text-xs`} />
                                </div>
                            </div>
                        )}

                        {activeShape === 'rectangle' && (
                            <div className="relative w-72 h-40">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <rect x="10" y="10" width="80" height="80" fill="rgba(168,85,247,0.1)" stroke={theme.isDark ? "#a855f7" : "#8b3dce"} strokeWidth="2" rx="4" />
                                    <line x1="10" y1="90" x2="90" y2="10" stroke="rgba(168,85,247,0.4)" strokeWidth="1" strokeDasharray="4,4" />
                                </svg>
                                {/* Height */}
                                <div className="absolute left-[-2rem] top-1/2 -translate-y-1/2 flex flex-col items-center">
                                    <span className={`text-xs ${theme.isDark ? 'text-gray-400' : 'text-gray-600'} font-mono mb-1`}>h</span>
                                    <input type="number" value={data.h || ''} onChange={e => handleChange('h', e.target.value)} placeholder="h" className={inputStyle} />
                                </div>
                                {/* Width */}
                                <div className="absolute bottom-[-3rem] left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <input type="number" value={data.w || ''} onChange={e => handleChange('w', e.target.value)} placeholder="w" className={inputStyle} />
                                    <span className={`text-xs ${theme.isDark ? 'text-gray-400' : 'text-gray-600'} font-mono mt-1`}>w</span>
                                </div>
                                {/* Diagonal */}
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center ${theme.isDark ? 'bg-black/40' : 'bg-white/60'} px-2 py-1 rounded`}>
                                    <span className={`text-[10px] ${theme.isDark ? 'text-gray-400' : 'text-gray-600'} font-mono mb-1`}>Diagonal</span>
                                    <input type="number" value={data.d || ''} onChange={e => handleChange('d', e.target.value)} placeholder="d" className={`${inputStyle} w-14 h-6 text-xs`} />
                                </div>
                            </div>
                        )}

                        {activeShape === 'circle' && (
                            <div className="relative w-48 h-48">
                                <svg width="100%" height="100%" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="rgba(255,0,255,0.1)" stroke={theme.isDark ? "#ff00ff" : "#cc00cc"} strokeWidth="2" />
                                    <circle cx="50" cy="50" r="2" fill={theme.isDark ? "#ff00ff" : "#cc00cc"} />
                                    <line x1="50" y1="50" x2="95" y2="50" stroke={theme.isDark ? "#ff00ff" : "#cc00cc"} strokeWidth="1.5" strokeDasharray="4,2" />
                                </svg>
                                {/* Radius */}
                                <div className={`absolute top-1/2 left-[60%] -translate-y-[120%] flex flex-col items-center ${theme.isDark ? 'bg-black/40' : 'bg-white/60'} px-2 py-1 rounded`}>
                                    <span className={`text-[10px] ${theme.isDark ? 'text-gray-400' : 'text-gray-600'} font-mono`}>Radius (r)</span>
                                    <input type="number" value={data.r || ''} onChange={e => handleChange('r', e.target.value)} placeholder="r" className={`${inputStyle} border-[#ff00ff]/30 ${theme.isDark ? 'text-[#ff00ff]' : 'text-[#cc00cc]'} focus:ring-[#ff00ff]`} />
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Quick Results Panel overlays the top right */}
                <div className={`absolute top-3 right-3 ${theme.isDark ? 'bg-black/60 border-white/10' : 'bg-white/80 border-black/10'} backdrop-blur-md border rounded-lg p-3 min-w-[120px] pointer-events-none`}>
                    <h3 className={`text-xs font-orbitron ${theme.isDark ? 'text-gray-400 border-white/10' : 'text-gray-600 border-black/10'} mb-2 border-b pb-1`}>Properties</h3>
                    <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between gap-4">
                            <span className={theme.isDark ? "text-gray-500" : "text-gray-600"}>Area</span>
                            <span className={theme.isDark ? "text-[#00f5ff]" : "text-[#008b9c]"}>{data.area || '-'}</span>
                        </div>
                        {activeShape === 'circle' ? (
                            <div className="flex justify-between gap-4">
                                <span className={theme.isDark ? "text-gray-500" : "text-gray-600"}>Circum</span>
                                <span className={theme.isDark ? "text-[#a855f7]" : "text-[#8b3dce]"}>{data.c || '-'}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between gap-4">
                                <span className={theme.isDark ? "text-gray-500" : "text-gray-600"}>Perimeter</span>
                                <span className={theme.isDark ? "text-[#a855f7]" : "text-[#8b3dce]"}>{data.perimeter || '-'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/50 text-red-600 text-xs px-3 py-1.5 rounded font-mono">
                        {error}
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="mt-4 flex gap-3">
                <button
                    onClick={() => { setData({}); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 ${theme.isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300' : 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-700'} border py-3 rounded-xl transition-all font-orbitron text-sm uppercase`}
                >
                    <RotateCcw size={16} /> Clear
                </button>
                <button
                    onClick={handleSolve}
                    className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-[#00f5ff]/20 to-[#a855f7]/20 hover:from-[#00f5ff]/40 hover:to-[#a855f7]/40 border border-[#00f5ff]/30 text-black dark:text-white py-3 rounded-xl transition-all font-orbitron tracking-wider shadow-[0_0_15px_rgba(0,245,255,0.2)]"
                >
                    <Calculator size={18} /> Solve Missing
                </button>
                </div>
            </>
            )}
        </div>
    );
};

export default GeometryBuilder;
