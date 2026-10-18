import { usePermissions } from "../Hooks/usePermissions";
import PageNotFound from "../Pages/Partials/PageNotFound";

/**
 * Route guard that checks if the logged-in user has permission for a page and action.
 * If user is Admin, access is always allowed.
 * If user is Employee, access is checked against permissions.
 */
export const PermissionGuard = ({ pageId, action = "view", children }) => {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
        return null;
    }

    if (!hasPermission(pageId, action)) {
        return <PageNotFound />;
    }

    return children;
};

/**
 * Route guard for routes that are exclusively accessible to Admin (hidden/forbidden for Employee).
 */
export const AdminOnlyGuard = ({ children }) => {
    const { isEmployee, loading } = usePermissions();

    if (loading) {
        return null;
    }

    if (isEmployee) {
        return <PageNotFound />;
    }

    return children;
};

export default PermissionGuard;
