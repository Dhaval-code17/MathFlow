import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('calc-theme');
        return saved ? saved === 'dark' : true; // default dark
    });

    useEffect(() => {
        localStorage.setItem('calc-theme', isDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = () => setIsDark(prev => !prev);

    const theme = {
        isDark,
        toggleTheme,
        // Colors
        bg: isDark ? '#050816' : '#f0f2f5',
        bgGradient: isDark
            ? 'linear-gradient(135deg, #050816, #0a0f1f)'
            : 'linear-gradient(135deg, #e8ecf1, #f5f7fa)',
        card: isDark ? 'rgba(15, 20, 35, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        cardBorder: isDark ? 'rgba(0, 245, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        text: isDark ? '#e2e8f0' : '#1a202c',
        textSecondary: isDark ? '#94a3b8' : '#64748b',
        textMuted: isDark ? '#475569' : '#94a3b8',
        accent: '#00f5ff',
        accentPurple: '#a855f7',
        displayBg: isDark
            ? 'linear-gradient(135deg, rgba(5, 8, 22, 0.95), rgba(10, 15, 31, 0.9))'
            : 'linear-gradient(135deg, rgba(240, 242, 245, 0.95), rgba(255, 255, 255, 0.9))',
        displayBorder: isDark ? 'rgba(0, 245, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        buttonBg: isDark ? '#111827' : '#e5e7eb',
        buttonHover: isDark ? '#1e293b' : '#d1d5db',
        buttonText: isDark ? '#e2e8f0' : '#1f2937',
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
