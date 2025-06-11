"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing token in localStorage
        const token = localStorage.getItem('token');
        if (token) {
            setUser({ token });
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            setUser({ token: data.access_token });
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const register = async (username, password, role = 'user') => {
        try {
            const response = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, role }),
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            return true;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
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
        return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            getAuthHeader,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 