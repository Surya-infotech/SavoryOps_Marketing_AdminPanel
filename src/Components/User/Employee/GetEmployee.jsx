import { ArrowDownward, ArrowUpward, UnfoldMore } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import EditButton from '../../../Pages/Custom/EditButton';
import DeleteButton from '../../../Pages/Custom/DeleteButton';
import CustomSwitch from '../../../Pages/Custom/CustomSwitch';
import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../../Middleware/Auth';
import AlertMessage from '../../../Pages/Custom/AlertMessage';
import DeleteModal from '../../../Pages/Custom/DeleteModal';
import LoadingSpinner from '../../../Pages/Custom/LoadingSpinner';
import Pagination from '../../../Pages/Custom/Pagination';
import WarningModal from '../../../Pages/Custom/WarningModal';
import "../../../Scss/User/Employee/getemployee.scss";
import { useLanguage } from "../../../Context/LanguageContext";
import CheckToken from '../../../utils/CheckToken';
import HandleUnauthorized from '../../../utils/HandleUnauthorized';
import profilePlaceholder from '../../../assets/profile-placeholder.png';

const GetEmployee = ({ searchValue = "" }) => {
    const { logoutUser } = useAuth();
    const navigate = useNavigate();
    const { translations } = useLanguage();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);

    const [loading, setLoading] = useState(true);
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (!CheckToken(token, logoutUser, navigate)) return;

        const loadEmployees = async () => {
            try {
                const response = await fetch(`${adminPanelBackendPath}/User/GetEmployees`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                });
                const data = await response.json();
                if (HandleUnauthorized(data, logoutUser, navigate)) return;
                if (!isMounted) return;
                if (response.ok) {
                    setEmployees(data.employees || []);
                } else {
                    setWarningMessage(data.message || translations.servererror);
                    setShowWarning(true);
                }
            } catch {
                if (isMounted) {
                    setWarningMessage(translations.servererror);
                    setShowWarning(true);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadEmployees();

        return () => {
            isMounted = false;
        };
    }, [adminPanelBackendPath, logoutUser, navigate, token, translations]);

    const sortEmployees = (column) => {
        const direction = sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
        setSortColumn(column);
        setSortDirection(direction);
        setEmployees([...employees].sort((a, b) => {
            let valA = a[column] ?? "";
            let valB = b[column] ?? "";

            if (column === "status") {
                valA = a[column] ? 1 : 0;
                valB = b[column] ? 1 : 0;
            } else if (column === "name") {
                valA = `${a.firstname || ''} ${a.lastname || ''}`.trim().toLowerCase();
                valB = `${b.firstname || ''} ${b.lastname || ''}`.trim().toLowerCase();
            } else if (column === "role") {
                valA = (a.role || "").toString().toLowerCase();
                valB = (b.role || "").toString().toLowerCase();
            } else {
                valA = valA.toString().toLowerCase();
                valB = valB.toString().toLowerCase();
            }

            if (valA < valB) return direction === "asc" ? -1 : 1;
            if (valA > valB) return direction === "asc" ? 1 : -1;
            return 0;
        }));
    };

    const renderSortIcon = (column) => (
        sortColumn !== column ? (
            <UnfoldMore fontSize="small" />
        ) : sortDirection === "asc" ? (
            <ArrowUpward fontSize="small" />
        ) : (
            <ArrowDownward fontSize="small" />
        )
    );

    const filteredEmployees = employees.filter((employee) => {
        const search = (searchValue || "").toLowerCase().trim();
        if (!search) return true;
        const fullName = `${employee.firstname || ''} ${employee.lastname || ''}`.toLowerCase();
        return (
            fullName.includes(search) ||
            (employee.firstname && employee.firstname.toLowerCase().includes(search)) ||
            (employee.lastname && employee.lastname.toLowerCase().includes(search)) ||
            (employee.email && employee.email.toLowerCase().includes(search)) ||
            (employee.phone && employee.phone.toLowerCase().includes(search)) ||
            (employee.role && employee.role.toLowerCase().includes(search)) ||
            (employee.employeetype && employee.employeetype.toLowerCase().includes(search))
        );
    });

    const totalRecords = filteredEmployees.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const visibleEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleEditClick = (_id) => navigate(`/User/EditEmployee/${_id}`);
    const handleEmployeeNameClick = (_id) => navigate(`/User/EmployeeOverview/${_id}`);

    const handleDeleteClick = (employee) => {
        setIsModalOpen(true);
        setSelectedEmployee(employee);
    };

    const handleStatusChange = async (employee) => {
        if (!CheckToken(token, logoutUser, navigate)) return;
        try {
            const updatedStatus = !employee.status;
            const empId = employee._id || employee.employeeid;
            const response = await fetch(`${adminPanelBackendPath}/User/UpdateEmployeeStatus/${empId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: updatedStatus }),
            });

            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser, navigate)) return;

            if (response.ok) {
                setEmployees(prev =>
                    prev.map(emp => (emp._id === employee._id || emp.employeeid === employee.employeeid ? { ...emp, status: updatedStatus } : emp))
                );
                setSuccessMessage(
                    updatedStatus
                        ? (translations.employeestatusactive)
                        : (translations.employeestatusinactive)
                );
            } else {
                setWarningMessage(data.message || translations.servererror);
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        }
    };

    const DeleteEmployee = async (employeeId) => {
        if (!CheckToken(token, logoutUser, navigate)) return;
        try {
            setIsDeleting(true);
            const response = await fetch(`${adminPanelBackendPath}/User/DeleteEmployee/${employeeId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });

            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser, navigate)) return;

            if (response.ok) {
                setEmployees(prev => prev.filter(emp => emp._id !== employeeId && emp.employeeid !== employeeId));
                setIsModalOpen(false);
                setSelectedEmployee(null);
                setSuccessMessage(translations.deleteemployeesuccessfull);
            } else {
                setWarningMessage(data.message || translations.servererror);
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        } finally {
            setIsDeleting(false);
            setIsModalOpen(false);
        }
    };

    return (
        <>
            {showWarning && <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />}
            <div className="tablediv">
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <table className="employeetable">
                        <thead>
                            <tr>
                                <th onClick={() => sortEmployees("name")}>
                                    {translations.name} {renderSortIcon("name")}
                                </th>
                                <th onClick={() => sortEmployees("email")}>
                                    {translations.Email} {renderSortIcon("email")}
                                </th>
                                <th onClick={() => sortEmployees("phone")}>
                                    {translations.Phone} {renderSortIcon("phone")}
                                </th>
                                <th onClick={() => sortEmployees("role")}>
                                    {translations.role} {renderSortIcon("role")}
                                </th>
                                <th onClick={() => sortEmployees("status")}>
                                    {translations.status} {renderSortIcon("status")}
                                </th>
                                <th>{translations.action}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleEmployees.length > 0 ? (
                                visibleEmployees.map((employee) => {
                                    const role = employee.role || "Employee";
                                    return (
                                        <tr key={employee._id || employee.employeeid}>
                                            <td>
                                                <div
                                                    className="employee-name-container"
                                                    onClick={() => handleEmployeeNameClick(employee._id || employee.employeeid)}
                                                >
                                                    <img
                                                        src={employee.profileimage || profilePlaceholder}
                                                        alt={`${employee.firstname || ''} ${employee.lastname || ''}`.trim()}
                                                        className="employee-avatar"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = profilePlaceholder;
                                                        }}
                                                    />
                                                    <Tooltip
                                                        title={translations.viewdetails}
                                                        arrow
                                                        placement="bottom"
                                                    >
                                                        <strong>{`${employee.firstname || ''} ${employee.lastname || ''}`.trim()}</strong>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                            <td>{employee.email}</td>
                                            <td>{employee.phone || "-"}</td>
                                            <td>
                                                <span className={`badge-role badge-${role.toLowerCase()}`}>
                                                    {role}
                                                </span>
                                            </td>
                                            <td>
                                                <CustomSwitch
                                                    checked={employee.status}
                                                    onChange={() => handleStatusChange(employee)}
                                                />
                                            </td>
                                            <td>
                                                <EditButton onClick={() => handleEditClick(employee._id || employee.employeeid)} />
                                                <DeleteButton onClick={() => handleDeleteClick(employee)} />
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "24px 0" }}>
                                        {translations.nodatafound}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
            {!loading && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                    pageSizeOptions={[10, 15, 20, 50]}
                    selectedPageSize={pageSize}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                    totalRecords={totalRecords}
                />
            )}
            {isModalOpen && (
                <DeleteModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onDelete={() => DeleteEmployee(selectedEmployee._id || selectedEmployee.employeeid)}
                    name={`${selectedEmployee?.firstname || ''} ${selectedEmployee?.lastname || ''}`.trim()}
                    message={translations.Employee}
                    headingname={translations.deleteemployee}
                    isLoading={isDeleting}
                />
            )}
            {successMessage && <AlertMessage message={successMessage} onClose={() => setSuccessMessage("")} />}
        </>
    );
};

export default GetEmployee;
