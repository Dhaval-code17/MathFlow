import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Send, Image as ImageIcon, Loader, UploadCloud, Lightbulb, Plus, Trash2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useMath } from '../context/MathContext';
import { useTheme } from '../context/ThemeContext';

const AiMathSolver = ({ isOpen, onClose, initialImage }) => {
    const { aiHistory, setAiHistory, aiSessions, activeSessionId, setActiveSessionId, createNewSession, deleteSession } = useMath();
    const theme = useTheme();
    const [image, setImage] = useState(initialImage || null);
    const [preview, setPreview] = useState(initialImage || null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Ensure a new chat session is started every time the modal is opened
            createNewSession();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && initialImage) {
            setImage(initialImage);
            setPreview(initialImage);
        } else if (!isOpen) {
            setImage(null);
            setPreview(null);
            setMessage('');
        }
    }, [isOpen, initialImage]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiHistory, loading]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setPreview(reader.result);
                        setImage(reader.result);
                    };
                    reader.readAsDataURL(file);
                }
                break;
            }
        }
    };

    const handleSend = async (overrideMessage = null) => {
        const msgToSend = typeof overrideMessage === 'string' ? overrideMessage : message;
        if (!msgToSend.trim() && !image) return;

        const newUserMessage = { role: 'user', text: msgToSend, image: preview };
        setAiHistory(prev => [...prev, newUserMessage]);
        
        const currentImg = image;
        
        setMessage('');
        setImage(null);
        setPreview(null);
        setLoading(true);

        try {
            // we don't send the full history image base64s to save bandwidth, just text history
            const historyForApi = aiHistory.map(h => ({ role: h.role, text: h.text }));

            const res = await axios.post('/api/ai/chat', {
                message: msgToSend,
                image: currentImg,
                history: historyForApi
            });

            setAiHistory(prev => [...prev, { role: 'model', text: res.data.text }]);
        } catch (error) {
            const errorMsg = error.response?.data?.error || "Failed to connect to AI server. Did you set GEMINI_API_KEY?";
            setAiHistory(prev => [...prev, { role: 'model', text: `**Error**: ${errorMsg}` }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl overflow-hidden border"
                style={{
                    background: theme.card,
                    borderColor: theme.cardBorder,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(0,245,255,0.1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10" style={{ background: theme.displayBg }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#a855f7]/20 border border-[#a855f7]/40">
                            <Camera className="w-5 h-5 text-[#a855f7]" />
                        </div>
                        <div>
                            <h2 className="font-orbitron text-lg text-white">AI Math Solver</h2>
                            <p className="text-xs text-gray-400 font-mono">Powered by Gemini Vision</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                        <X size={20} />
                    </button>
                </div>

                {/* Main Body */}
                <div className="flex flex-1 overflow-hidden h-full">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-white/10 bg-black/40 flex-col hidden md:flex">
                        <div className="p-3">
                            <button onClick={() => { createNewSession(); setImage(null); setPreview(null); }} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-2 transition-colors text-white text-sm font-mono">
                                <Plus size={16} /> New Chat
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 p-2 scrollbar-hide">
                            {aiSessions.map(session => (
                                <div key={session.id} onClick={() => setActiveSessionId(session.id)} className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-colors ${activeSessionId === session.id ? 'bg-[#00f5ff]/20 border border-[#00f5ff]/30' : 'hover:bg-white/5 border border-transparent'}`}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <MessageSquare size={14} className={activeSessionId === session.id ? "text-[#00f5ff]" : "text-gray-500"} />
                                        <span className={`text-sm truncate ${activeSessionId === session.id ? "text-white" : "text-gray-400"}`}>{session.title || 'New Chat'}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        {/* Chat History */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                            {aiHistory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-8 opacity-60">
                                    <UploadCloud size={48} className="mb-4 text-[#00f5ff]" />
                                    <p className="text-gray-300 font-mono mb-2">Upload a picture of a math problem to get started.</p>
                                    <p className="text-sm text-gray-500">You can also just ask a math question directly!</p>
                                </div>
                            ) : (
                                aiHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#00f5ff]/10 border border-[#00f5ff]/20 text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'}`}>
                                            {msg.image && (
                                                <img src={msg.image} alt="Upload" className="max-w-full h-auto rounded-lg mb-3 border border-white/10" style={{ maxHeight: '200px' }} />
                                            )}
                                            {msg.text && (
                                                <div className="prose prose-invert prose-sm max-w-none math-prose">
                                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                        {msg.text}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 text-gray-200 rounded-2xl rounded-tl-sm p-4 flex items-center gap-3">
                                        <Loader className="w-5 h-5 animate-spin text-[#a855f7]" />
                                        <span className="font-mono text-sm text-gray-400">Analyzing problem...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-black/20">
                            {preview && (
                                <div className="relative inline-block mb-3">
                                    <img src={preview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-[#00f5ff]/40" />
                                    <button onClick={() => { setPreview(null); setImage(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg">
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer p-3 text-gray-400 hover:text-[#00f5ff] hover:bg-[#00f5ff]/10 rounded-xl transition-all border border-transparent hover:border-[#00f5ff]/20">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    <ImageIcon size={20} />
                                </label>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    onPaste={handlePaste}
                                    placeholder="Ask a question or upload a math problem..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-[#00f5ff]/50 transition-colors font-mono text-sm"
                                />
                                <button
                                    onClick={() => handleSend("Based on my current image/problem, please suggest a similar but new geometry or math question. Include a description of what the new image would look like, or provide an SVG representation of it.")}
                                    className="p-3 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 border border-indigo-500/30 hover:text-white rounded-xl transition-colors"
                                    title="Suggest Similar Problem"
                                >
                                    <Lightbulb size={20} />
                                </button>
                                <button 
                                    onClick={() => handleSend()}
                                    disabled={loading || (!message.trim() && !image)}
                                    className="p-3 bg-[#a855f7] hover:bg-[#b06cf7] disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:shadow-none"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AiMathSolver;
