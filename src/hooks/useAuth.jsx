import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useAlert } from '../context/AlertContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showAlert } = useAlert();

    useEffect(() => {
        const pinSession = localStorage.getItem('kb_admin_session');
        if (pinSession === 'active') {
             // Mock admin user since Anonymous Sign-in is disabled in Supabase
             setUser({ id: 'admin', email: 'admin@local', role: 'admin' });
             setLoading(false);
        } else {
            setLoading(false);
        }
    }, []);

    const loginWithPin = async (inputPin) => {
        if (!supabase) return false;
        
        try {
            const { data, error } = await supabase
                .from('global_settings')
                .select('*')
                .eq('id', 1)
                .single();

            const targetPin = data?.admin_password || '1945';

            if (inputPin === targetPin) {
                // Bypass Supabase Auth and use local session
                localStorage.setItem('kb_admin_session', 'active');
                setUser({ id: 'admin', email: 'admin@local', role: 'admin' });
                return true;
            } else {
                showAlert("Invalid Master PIN!", "error");
                return false;
            }
        } catch (err) {
            console.error(err);
            showAlert("Connection Error: " + err.message, "error");
            return false;
        }
    };

    const signOut = async () => {
        localStorage.removeItem('kb_admin_session');
        setUser(null);
        if (supabase) await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithPin, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
