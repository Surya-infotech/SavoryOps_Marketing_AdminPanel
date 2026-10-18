import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Middleware/Auth';
import HandleUnauthorized from '../utils/HandleUnauthorized';

const FiscalYearContext = createContext();

export const FiscalYearProvider = ({ children }) => {
    const { token, logoutUser } = useAuth();
    const [fiscalYears, setFiscalYears] = useState([]);
    const [selectedFiscalYear, setSelectedFiscalYearState] = useState(() => localStorage.getItem('selectedFiscalYear') || '');
    const [loading, setLoading] = useState(false);

    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

    const setSelectedFiscalYear = (fiscalYearId) => {
        setSelectedFiscalYearState(fiscalYearId);
        if (fiscalYearId) {
            localStorage.setItem('selectedFiscalYear', fiscalYearId);
        } else {
            localStorage.removeItem('selectedFiscalYear');
        }
    };

    const fetchData = useCallback(async () => {
        if (!token) {
            setFiscalYears([]);
            setSelectedFiscalYearState('');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${adminPanelBackendPath}/System/GetFiscalYear`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            
            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser)) return;

            if (response.ok && Array.isArray(data)) {
                setFiscalYears(data);

                // Initialize or validate selectedFiscalYear
                const savedFiscal = localStorage.getItem('selectedFiscalYear');
                const fiscalExists = data.some(f => f.fiscalyearid === savedFiscal);
                if (fiscalExists) {
                    setSelectedFiscalYearState(savedFiscal);
                } else if (data.length > 0) {
                    setSelectedFiscalYearState(data[0].fiscalyearid);
                    localStorage.setItem('selectedFiscalYear', data[0].fiscalyearid);
                } else {
                    setSelectedFiscalYearState('');
                }
            }
        } catch (error) {
            console.error("Error fetching fiscal year data in context:", error);
        } finally {
            setLoading(false);
        }
    }, [adminPanelBackendPath, token]);

    // Periodically sync token or fetch data on mount
    useEffect(() => {
        fetchData();
        
        // Listen to storage events to keep selected fiscal year in sync across tabs if needed
        const handleStorageChange = (e) => {
            if (e.key === 'selectedFiscalYear') {
                setSelectedFiscalYearState(e.newValue || '');
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchData]);

    return (
        <FiscalYearContext.Provider
            value={{
                fiscalYears,
                selectedFiscalYear,
                setSelectedFiscalYear,
                loading,
                refreshData: fetchData
            }}
        >
            {children}
        </FiscalYearContext.Provider>
    );
};

export const useFiscalYear = () => {
    const context = useContext(FiscalYearContext);
    if (!context) {
        throw new Error('useFiscalYear must be used within a FiscalYearProvider');
    }
    return context;
};
