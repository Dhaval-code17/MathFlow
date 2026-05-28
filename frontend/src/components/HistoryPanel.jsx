import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Clock, X } from 'lucide-react';

const HistoryPanel = ({ isOpen, onClose, refreshTrigger }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, refreshTrigger]);

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get('/api/history');
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="fixed right-0 top-0 h-full w-80 glass-panel border-l border-neon-purple z-50 p-6 overflow-hidden flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-orbitron neon-text flex items-center gap-2">
                                <Clock className="w-5 h-5" /> History
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
                            {history.length === 0 ? (
                                <p className="text-center text-gray-500 mt-10">No calculations yet.</p>
                            ) : (
                                history.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-[#111827] p-3 rounded border border-[#00f5ff]/10 hover:border-[#00f5ff]/40 transition-colors"
                                    >
                                        <div className="text-sm text-gray-400 mb-1">{item.expression}</div>
                                        <div className="text-lg font-mono text-neon-green text-right">= {item.result}</div>
                                        <div className="text-xs text-gray-600 mt-1 text-right">
                                            {new Date(item.created_at).toLocaleString()}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default HistoryPanel;
