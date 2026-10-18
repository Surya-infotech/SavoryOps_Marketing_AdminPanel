import { createContext, useContext, useState } from "react";
import { getDecryptedRole, setEncryptedRole } from "../utils/cryptoStorage";

export const AuthContext = createContext();

export const AuthProider = ({ children }) => {
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;

    const [token, setToken] = useState(localStorage.getItem(tokenname));
    const [role, setRole] = useState(() => getDecryptedRole());
    const [employeeId, setEmployeeId] = useState(() => localStorage.getItem("EmployeeID") || "");

    const storetoken = (serverToken, userRole, empId) => {
        localStorage.setItem(tokenname, serverToken);
        setToken(serverToken);
        if (userRole) {
            setEncryptedRole(userRole);
            setRole(userRole);
        }
        if (empId) {
            localStorage.setItem("EmployeeID", empId);
            setEmployeeId(empId);
        }
    };

    const logoutUser = () => {
        setToken("");
        setRole("");
        setEmployeeId("");
        localStorage.removeItem(tokenname);
        localStorage.removeItem("selectedFiscalYear");
        localStorage.removeItem("role");
        localStorage.removeItem("EmployeeID");
        localStorage.removeItem("EMPLOYEE_PERMISSIONS");
    };

    return (
        <AuthContext.Provider value={{ token, role, employeeId, storetoken, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const authContextValue = useContext(AuthContext);
    if (!authContextValue) {
        throw new Error("useAuth used outside of the Provider");
    }
    return authContextValue;
}