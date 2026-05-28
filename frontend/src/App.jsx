import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiquidGlassDemo from './pages/LiquidGlassDemo';

import { MathProvider } from './context/MathContext';
import { ThemeProvider } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    return (
        <ThemeProvider>
            <MathProvider>
                <Router>

                    <AuthProvider>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/liquid-glass" element={<LiquidGlassDemo />} />
                            <Route
                                path="/calculator"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/" element={<Navigate to="/calculator" replace />} />
                        </Routes>
                    </AuthProvider>
                </Router>
            </MathProvider>
        </ThemeProvider>
    );
}

export default App;
