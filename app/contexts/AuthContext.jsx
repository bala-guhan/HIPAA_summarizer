'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        if (token) {
            setUser({ token });
        }
        setLoading(false);
    }, []);

    const login = async (token) => {
        try {
            localStorage.setItem('token', token);
            setUser({ token });
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const register = async (username, password, userData) => {
        try {
            const response = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                    ...userData
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Registration failed');
            }

            return true;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            if (user?.token) {
                await fetch('http://localhost:8000/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : null;
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        getAuthHeader
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 