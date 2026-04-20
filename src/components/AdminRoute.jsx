import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
    const { user, loading, signOut } = useAuth();

    if (loading) {
        return <div className="h-screen bg-neutral-900 flex items-center justify-center text-white font-inter animate-pulse">Scanning Bio-metrics...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AdminRoute;

