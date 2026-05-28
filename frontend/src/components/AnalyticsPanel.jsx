import React, { useState, useEffect, useCallback } from 'react';
import { useMath } from '../context/MathContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Zap, TrendingUp, Trophy, Flame, Target,
    BarChart3, Calendar, ChevronRight, ChevronLeft, Crown
} from 'lucide-react';

const AnalyticsPanel = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tab, setTab] = useState('overview'); // overview | competitive | leaderboard
    const { totalCalcs, highScore, xp, level, operatorStats } = useMath();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [compStats, setCompStats] = useState(null);
    const [calcAnalytics, setCalcAnalytics] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(false);

    const bg = isDark ? 'rgba(10, 15, 30, 0.97)' : 'rgba(255, 255, 255, 0.97)';
    const cardBg = isDark ? 'rgba(20, 25, 45, 0.8)' : 'rgba(240, 242, 245, 0.8)';
    const textColor = isDark ? '#e2e8f0' : '#1a202c';
    const subtextColor = isDark ? '#94a3b8' : '#64748b';
    const borderColor = isDark ? 'rgba(0, 245, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const [statsRes, analyticsRes, lbRes] = await Promise.all([
                axios.get('/api/competitive/mystats', { headers }).catch(() => ({ data: null })),
                axios.get('/api/analytics', { headers }).catch(() => ({ data: null })),
                axios.get('/api/competitive/leaderboard', { headers }).catch(() => ({ data: [] })),
            ]);
            setCompStats(statsRes.data);
            setCalcAnalytics(analyticsRes.data);
            setLeaderboard(lbRes.data || []);
        } catch (e) {
            console.error('Analytics fetch error:', e);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen, fetchData]);

    const TABS = [
        { key: 'overview', label: 'Overview', icon: Activity },
        { key: 'competitive', label: 'Compete', icon: Flame },
        { key: 'leaderboard', label: 'Ranks', icon: Crown },
    ];

    // Operator bar chart
    const maxOp = Math.max(...Object.values(operatorStats || {}), 1);
    const opLabels = { '+': 'Add', '-': 'Sub', '*': 'Mul', '/': 'Div' };
    const opColors = { '+': '#0aff00', '-': '#ef4444', '*': '#a855f7', '/': '#00f5ff' };

    // Daily activity sparkline
    const dailyData = calcAnalytics?.dailyActivity || [];
    const maxDaily = Math.max(...dailyData.map(d => d.count), 1);

    return (
        <div className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-[340px]'}`}>
            {/* Toggle Tab */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-l-lg transition-colors"
                style={{
                    background: isDark ? 'rgba(15,20,35,0.9)' : 'rgba(255,255,255,0.9)',
                    borderLeft: `1px solid ${borderColor}`,
                    borderTop: `1px solid ${borderColor}`,
                    borderBottom: `1px solid ${borderColor}`,
                }}
                title="Analytics"
            >
                {isOpen ? (
                    <ChevronRight className="w-4 h-4" style={{ color: '#00f5ff' }} />
                ) : (
                    <BarChart3 className="w-4 h-4" style={{ color: '#00f5ff' }} />
                )}
            </button>

            {/* Panel */}
            <div
                className="w-[340px] h-[520px] rounded-l-xl p-4 flex flex-col shadow-2xl overflow-hidden"
                style={{
                    background: bg,
                    backdropFilter: 'blur(20px)',
                    borderLeft: `1px solid ${borderColor}`,
                    borderTop: `1px solid ${borderColor}`,
                    borderBottom: `1px solid ${borderColor}`,
                }}
            >
                {/* Header */}
                <h3 className="text-sm font-orbitron font-bold mb-3 flex items-center gap-2" style={{ color: textColor }}>
                    <Activity className="w-4 h-4 text-[#00f5ff]" /> ANALYTICS
                </h3>

                {/* Tabs */}
                <div className="flex gap-1 mb-3 rounded-lg p-1" style={{ background: cardBg }}>
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-orbitron font-bold transition-all"
                            style={{
                                background: tab === t.key ? (isDark ? 'rgba(0,245,255,0.12)' : 'rgba(0,0,0,0.06)') : 'transparent',
                                color: tab === t.key ? '#00f5ff' : subtextColor,
                            }}
                        >
                            <t.icon className="w-3 h-3" /> {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {/* === OVERVIEW TAB === */}
                    {tab === 'overview' && (
                        <div className="space-y-3">
                            {/* Top stats */}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { icon: Zap, label: 'Total Calcs', value: totalCalcs, color: '#f59e0b' },
                                    { icon: TrendingUp, label: 'High Value', value: highScore > 1e6 ? (highScore / 1e6).toFixed(1) + 'M' : highScore, color: '#a855f7' },
                                    { icon: Trophy, label: 'XP', value: xp, color: '#00f5ff' },
                                    { icon: Target, label: 'Level', value: level, color: '#0aff00' },
                                ].map(s => (
                                    <div key={s.label} className="rounded-lg p-3" style={{ background: cardBg }}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <s.icon className="w-3 h-3" style={{ color: s.color }} />
                                            <span className="text-[9px] font-orbitron" style={{ color: subtextColor }}>{s.label}</span>
                                        </div>
                                        <div className="text-lg font-mono font-bold" style={{ color: textColor }}>{s.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Operator usage */}
                            <div className="rounded-lg p-3" style={{ background: cardBg }}>
                                <div className="text-[9px] font-orbitron mb-2" style={{ color: subtextColor }}>OPERATOR USAGE</div>
                                <div className="space-y-2">
                                    {['+', '-', '*', '/'].map(op => {
                                        const count = (operatorStats || {})[op] || 0;
                                        return (
                                            <div key={op} className="flex items-center gap-2">
                                                <span className="text-xs font-mono w-8" style={{ color: opColors[op] }}>{opLabels[op]}</span>
                                                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ background: opColors[op], width: `${(count / maxOp) * 100}%` }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(count / maxOp) * 100}%` }}
                                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-mono w-6 text-right" style={{ color: subtextColor }}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Daily activity */}
                            {dailyData.length > 0 && (
                                <div className="rounded-lg p-3" style={{ background: cardBg }}>
                                    <div className="text-[9px] font-orbitron mb-2" style={{ color: subtextColor }}>LAST 7 DAYS</div>
                                    <div className="flex items-end gap-1 h-12">
                                        {dailyData.map((d, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                                <motion.div
                                                    className="w-full rounded-sm"
                                                    style={{ background: '#00f5ff', height: `${(d.count / maxDaily) * 40}px`, minHeight: '2px' }}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${(d.count / maxDaily) * 40}px` }}
                                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                                />
                                                <span className="text-[7px]" style={{ color: subtextColor }}>
                                                    {new Date(d.day).toLocaleDateString('en', { weekday: 'narrow' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* === COMPETITIVE TAB === */}
                    {tab === 'competitive' && (
                        <div className="space-y-3">
                            {compStats ? (
                                <>
                                    {/* Personal bests */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: 'Best Score', value: compStats.stats?.bestScore || 0, color: '#f59e0b' },
                                            { label: 'Avg Score', value: Math.round(compStats.stats?.avgScore || 0), color: '#a855f7' },
                                            { label: 'Games', value: compStats.stats?.totalGames || 0, color: '#00f5ff' },
                                            { label: 'Best Streak', value: compStats.stats?.longestStreak || 0, color: '#ef4444' },
                                        ].map(s => (
                                            <div key={s.label} className="rounded-lg p-3" style={{ background: cardBg }}>
                                                <div className="text-[9px] font-orbitron mb-1" style={{ color: subtextColor }}>{s.label}</div>
                                                <div className="text-lg font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Rank */}
                                    <div className="rounded-lg p-4 text-center" style={{
                                        background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1))',
                                        border: '1px solid rgba(245,158,11,0.2)',
                                    }}>
                                        <Crown className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
                                        <div className="text-2xl font-orbitron font-bold" style={{ color: '#f59e0b' }}>
                                            #{compStats.rank}
                                        </div>
                                        <div className="text-[9px] font-orbitron" style={{ color: subtextColor }}>YOUR RANK</div>
                                    </div>

                                    {/* Accuracy */}
                                    <div className="rounded-lg p-3" style={{ background: cardBg }}>
                                        <div className="text-[9px] font-orbitron mb-2" style={{ color: subtextColor }}>AVG ACCURACY</div>
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12">
                                                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                                    <circle cx="18" cy="18" r="15" fill="none" stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth="3" />
                                                    <circle cx="18" cy="18" r="15" fill="none" stroke="#0aff00" strokeWidth="3"
                                                        strokeDasharray={`${(compStats.stats?.avgAccuracy || 0) * 0.94} 100`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: '#0aff00' }}>
                                                    {Math.round(compStats.stats?.avgAccuracy || 0)}%
                                                </div>
                                            </div>
                                            <div className="text-[10px]" style={{ color: subtextColor }}>
                                                Across {compStats.stats?.totalGames || 0} games
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent games */}
                                    {compStats.recentGames?.length > 0 && (
                                        <div className="rounded-lg p-3" style={{ background: cardBg }}>
                                            <div className="text-[9px] font-orbitron mb-2" style={{ color: subtextColor }}>RECENT GAMES</div>
                                            <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-hide">
                                                {compStats.recentGames.map((g, i) => (
                                                    <div key={i} className="flex items-center justify-between text-[10px] py-1 px-2 rounded"
                                                        style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                                                        <span className="font-mono font-bold" style={{ color: textColor }}>{g.score}</span>
                                                        <span style={{ color: subtextColor }}>{g.total_correct}/{g.total_attempted}</span>
                                                        <span className="text-[9px]" style={{
                                                            color: g.max_difficulty === 'hard' ? '#ef4444' : g.max_difficulty === 'medium' ? '#f59e0b' : '#0aff00'
                                                        }}>{g.max_difficulty}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-sm" style={{ color: subtextColor }}>
                                    {loading ? 'Loading...' : 'Play Competitive Mode to see your stats!'}
                                </div>
                            )}
                        </div>
                    )}

                    {/* === LEADERBOARD TAB === */}
                    {tab === 'leaderboard' && (
                        <div className="space-y-2">
                            {leaderboard.length > 0 ? (
                                leaderboard.map((entry, i) => {
                                    const isCurrentUser = entry.username === user?.username;
                                    const medals = ['🥇', '🥈', '🥉'];
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-3 rounded-lg p-2.5 transition-colors"
                                            style={{
                                                background: isCurrentUser
                                                    ? (isDark ? 'rgba(0,245,255,0.08)' : 'rgba(0,245,255,0.06)')
                                                    : cardBg,
                                                border: isCurrentUser ? '1px solid rgba(0,245,255,0.2)' : '1px solid transparent',
                                            }}
                                        >
                                            {/* Rank */}
                                            <div className="w-6 text-center font-bold text-sm" style={{
                                                color: i < 3 ? '#f59e0b' : subtextColor,
                                            }}>
                                                {i < 3 ? medals[i] : `#${i + 1}`}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold truncate" style={{
                                                    color: isCurrentUser ? '#00f5ff' : textColor,
                                                }}>
                                                    {entry.username} {isCurrentUser && '(you)'}
                                                </div>
                                                <div className="text-[9px]" style={{ color: subtextColor }}>
                                                    Streak: {entry.best_streak} · {Math.round(entry.accuracy)}%
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className="text-sm font-mono font-bold" style={{
                                                color: i === 0 ? '#f59e0b' : textColor,
                                            }}>
                                                {entry.score}
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-sm" style={{ color: subtextColor }}>
                                    {loading ? 'Loading...' : 'No scores yet. Be the first!'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPanel;
