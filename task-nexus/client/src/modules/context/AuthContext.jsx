import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL + "/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('nexus_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(response => {
                    setUser(response.data);
                })
                .catch(() => {
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        const response = await axios.post(`${API_BASE}/auth/login`, { email, password });

        localStorage.setItem('nexus_token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);

        return response.data;
    };

    const register = async (username, email, password) => {
        const response = await axios.post(`${API_BASE}/auth/register`, { username, email, password });

        localStorage.setItem('nexus_token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);

        return response.data;
    };

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setToken(null);
        window.location.href = "/login";
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
