import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { adminAuthService } from '../services/adminAuthService';
const AdminAuthContext = createContext(undefined);
export function AdminAuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const checkSession = async () => {
            const { user: sessionUser, error: sessionError } = await adminAuthService.getSession();
            setUser(sessionUser);
            if (sessionError)
                setError(sessionError);
            setLoading(false);
        };
        checkSession();
    }, []);
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        const { user: loginUser, error: loginError } = await adminAuthService.login(email, password);
        if (loginError) {
            setError(loginError);
            setUser(null);
        }
        else {
            setUser(loginUser);
            setError(null);
        }
        setLoading(false);
    };
    const logout = async () => {
        setLoading(true);
        const { error: logoutError } = await adminAuthService.logout();
        if (logoutError) {
            setError(logoutError);
        }
        else {
            setUser(null);
            setError(null);
        }
        setLoading(false);
    };
    return (_jsx(AdminAuthContext.Provider, { value: { user, loading, error, login, logout }, children: children }));
}
export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider');
    }
    return context;
}
