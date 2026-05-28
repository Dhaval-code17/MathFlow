import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Calculator from '../components/Calculator';
import HistoryPanel from '../components/HistoryPanel';
import DynamicUniverseEngine from '../components/DynamicUniverseEngine';
import FloatingFormulas from '../components/FloatingFormulas';
import XPSystem from '../components/XPSystem';
import RobotCharacter from '../components/RobotCharacter';
import AnalyticsPanel from '../components/AnalyticsPanel';
import PracticeMode from '../components/PracticeMode';
import BackgroundClickNumbers from '../components/BackgroundClickNumbers';
import FloatingShapes from '../components/FloatingShapes';
import CompetitiveMode from '../components/CompetitiveMode';
import { LogOut, Sun, Moon } from 'lucide-react';
import { gsap } from 'gsap';

const Dashboard = () => {
    const { logout, user } = useAuth();
    const theme = useTheme();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [refreshHistory, setRefreshHistory] = useState(0);
    const contentRef = useRef(null);

    useEffect(() => {
        if (contentRef.current) {
            gsap.fromTo(
                contentRef.current,
                { opacity: 0, scale: 0.97 },
                { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }
            );
        }
    }, []);

    const handleCalculationComplete = () => {
        setRefreshHistory(prev => prev + 1);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500"
            style={{ background: theme.bgGradient }}
        >
            <DynamicUniverseEngine />
            <FloatingFormulas />
            <XPSystem />
            <AnalyticsPanel />
            <PracticeMode />
            <BackgroundClickNumbers />
            <FloatingShapes />
            <CompetitiveMode />

            <div ref={contentRef} className="w-full h-full">
                {/* Top bar — theme toggle, user, logout */}
                <div className="absolute top-4 right-4 flex items-center gap-3 z-40">
                    {/* Theme Toggle */}
                    <button
                        onClick={theme.toggleTheme}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300"
                        style={{
                            background: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                        title={theme.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {theme.isDark ? (
                            <Sun className="w-4 h-4 text-yellow-400" />
                        ) : (
                            <Moon className="w-4 h-4 text-gray-600" />
                        )}
                    </button>

                    <span className="text-sm hidden md:inline" style={{ color: theme.textSecondary }}>
                        <span style={{ color: theme.accent }} className="font-orbitron">{user?.username}</span>
                    </span>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> <span className="hidden md:inline">Logout</span>
                    </button>
                </div>

                <div className="flex gap-8 items-center justify-center relative z-10 w-full min-h-screen">
                    <div className="relative">
                        <RobotCharacter />
                        <Calculator
                            onHistoryClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            onCalculationComplete={handleCalculationComplete}
                        />
                    </div>

                    <HistoryPanel
                        isOpen={isHistoryOpen}
                        onClose={() => setIsHistoryOpen(false)}
                        key={refreshHistory}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
