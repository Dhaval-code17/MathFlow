import React from 'react';
import { useMath } from '../context/MathContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';

const MathPersonality = () => {
    const { personalityComment } = useMath();

    return (
        <div className="absolute -right-64 top-0 w-60 z-20 hidden lg:block">
            <AnimatePresence mode='wait'>
                {personalityComment && (
                    <motion.div
                        key={personalityComment}
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="bg-black/80 border border-neon-purple p-4 rounded-xl rounded-tl-none relative shadow-[0_0_15px_rgba(188,19,254,0.2)]"
                    >
                        {/* Triangle Tail */}
                        <div className="absolute -left-2 top-0 w-0 h-0 border-t-[10px] border-t-neon-purple border-l-[10px] border-l-transparent transform rotate-0" />

                        <div className="flex items-start gap-3">
                            <Bot className="w-6 h-6 text-neon-purple flex-shrink-0 mt-1" />
                            <p className="text-sm text-gray-200 font-mono leading-relaxed">
                                "{personalityComment}"
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MathPersonality;
