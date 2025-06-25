
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/LocalAuthContext';

const AppEntry = () => {
    const navigate = useNavigate();
    const { areas, currentAreaId } = useFinance();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (isLoading || !user) {
            return; // Wait for auth state to be resolved
        }

        if (areas.length === 0 || !currentAreaId) {
            navigate('/areas', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isLoading, areas, currentAreaId, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
          <div className="text-center animate-pulse">
            <h1 className="text-4xl font-bold mb-4">Line Manager App</h1>
            <p className="text-xl text-gray-600">Loading your workspace...</p>
          </div>
        </div>
    );
};

export default AppEntry;
