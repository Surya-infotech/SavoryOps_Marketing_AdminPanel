import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../Middleware/Auth";

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
    const { role, employeeId, token } = useAuth();
    const isEmployee = (role || '').trim().toLowerCase() === 'employee';
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

    const [permissions, setPermissions] = useState(() => {
        try {
            const cached = localStorage.getItem("EMPLOYEE_PERMISSIONS");
            return cached ? JSON.parse(cached) : {};
        } catch {
            return {};
        }
    });

    const [loading, setLoading] = useState(isEmployee);

    const fetchPermissions = useCallback(async () => {
        if (!isEmployee || !employeeId || !token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${adminPanelBackendPath}/User/GetEmployeePermissions/${employeeId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            const data = await response.json();
            if (response.ok && data?.permissions) {
                setPermissions(data.permissions);
                localStorage.setItem("EMPLOYEE_PERMISSIONS", JSON.stringify(data.permissions));
            }
        } catch (err) {
            console.error("Error fetching employee permissions:", err);
        } finally {
            setLoading(false);
        }
    }, [adminPanelBackendPath, employeeId, isEmployee, token]);

    useEffect(() => {
        if (isEmployee) {
            fetchPermissions();
        } else {
            setPermissions({});
            setLoading(false);
        }
    }, [fetchPermissions, isEmployee, employeeId]);

    const hasPermission = useCallback(
        (pageId, actionKey = "view") => {
            // Admin role always has full access
            if (!isEmployee) return true;
            if (!pageId) return true;
            const pagePerms = permissions[pageId];
            if (!pagePerms) {
                return false;
            }
            return Boolean(pagePerms[actionKey]);
        },
        [isEmployee, permissions]
    );

    const canView = useCallback((pageId) => hasPermission(pageId, "view"), [hasPermission]);
    const canAdd = useCallback((pageId) => hasPermission(pageId, "add"), [hasPermission]);
    const canEdit = useCallback((pageId) => hasPermission(pageId, "edit"), [hasPermission]);
    const canDelete = useCallback((pageId) => hasPermission(pageId, "delete"), [hasPermission]);

    return (
        <PermissionContext.Provider
            value={{
                isEmployee,
                permissions,
                loading,
                hasPermission,
                canView,
                canAdd,
                canEdit,
                canDelete,
                refetchPermissions: fetchPermissions
            }}
        >
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error("usePermissions must be used within a PermissionProvider");
    }
    return context;
};

export default usePermissions;