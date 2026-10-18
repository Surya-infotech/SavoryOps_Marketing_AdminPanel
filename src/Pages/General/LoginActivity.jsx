import { ArrowDownward, ArrowUpward, UnfoldMore } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment-timezone";
import { useAuth } from '../../Middleware/Auth';
import AlertMessage from '../Custom/AlertMessage';
import LoadingSpinner from '../Custom/LoadingSpinner';
import Pagination from '../Custom/Pagination';
import SearchInput from '../Custom/SearchInput';
import WarningModal from '../Custom/WarningModal';
import "../../Scss/General/loginactivity.scss";
import { useLanguage } from '../../Context/LanguageContext';
import CheckToken from '../../utils/CheckToken';
import HandleUnauthorized from '../../utils/HandleUnauthorized';

const LoginActivity = () => {
    const { logoutUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { translations, isRtl } = useLanguage();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const [loading, setLoading] = useState(true);
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);
    const EmployeeId = localStorage.getItem("EmployeeID");
    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState("asc");
    const [activities, setActivities] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [miscSettings, setMiscSettings] = useState(null);

    useEffect(() => {
        if (translations.LoginActivity) document.title = translations.LoginActivity;
    }, [translations]);

    useEffect(() => {
        if (location.state && location.state.message) {
            setSuccessMessage(location.state.message);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (location.state && location.state.warning) {
            setWarningMessage(location.state.warning);
            setShowWarning(true);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    const handleWarningClose = () => {
        setShowWarning(false);
        setWarningMessage("");
    };

    const handleCloseAlert = () => {
        setSuccessMessage("");
    };

    useEffect(() => {
        const fetchLoginActivity = async () => {
            if (!CheckToken(token, logoutUser, navigate)) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                let endpoint = `${adminPanelBackendPath}/admin/GetLoginActivity/${EmployeeId}`;

                let response = await fetch(endpoint, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = await response.json();
                if (HandleUnauthorized(data, logoutUser, navigate, response)) return;

                if (response.ok) {
                    const list = data.activities || data.activity || data.loginActivities || data.data || [];
                    setActivities(Array.isArray(list) ? list : []);
                    if (data.miscSettings) {
                        setMiscSettings(data.miscSettings);
                    }
                } else {
                    setActivities([]);
                    setWarningMessage(data.message || translations.servererror);
                    setShowWarning(true);
                }
            } catch (err) {
                console.error("Error fetching login activity:", err);
                setActivities([]);
                setWarningMessage(translations.servererror);
                setShowWarning(true);
            } finally {
                setLoading(false);
            }
        };

        fetchLoginActivity();
    }, [navigate, logoutUser, token, adminPanelBackendPath, translations, EmployeeId]);

    const sortActivities = (column) => {
        const direction = sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
        setSortColumn(column);
        setSortDirection(direction);
        setActivities([...activities].sort((a, b) => {
            if (column === "login") {
                const timeA = new Date(a.login || a.createdAt || 0).getTime();
                const timeB = new Date(b.login || b.createdAt || 0).getTime();
                return (timeA > timeB ? 1 : -1) * (direction === "asc" ? 1 : -1);
            }
            const valA = a[column] || '';
            const valB = b[column] || '';
            return (valA > valB ? 1 : -1) * (direction === "asc" ? 1 : -1);
        }));
    };

    const renderSortIcon = (column) => (
        sortColumn !== column ? <UnfoldMore fontSize="small" /> : sortDirection === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
    );

    const formatLoginTime = (activity) => {
        if (activity.loginFormatted) return activity.loginFormatted;
        const dateVal = activity.login || activity.createdAt || activity.logintime;
        if (!dateVal) return "—";
        if (miscSettings?.dateFormat && miscSettings?.timeFormat && miscSettings?.timeZone) {
            try {
                return moment.tz(dateVal, miscSettings.timeZone).format(`${miscSettings.dateFormat} ${miscSettings.timeFormat}`);
            } catch {
                return String(dateVal);
            }
        }
        try {
            return new Date(dateVal).toLocaleString();
        } catch {
            return String(dateVal);
        }
    };

    const filteredActivities = activities.filter((activity) => {
        const searchLower = searchValue.toLowerCase();
        const formattedTime = formatLoginTime(activity).toLowerCase();
        return (
            (activity.device && activity.device.toLowerCase().includes(searchLower)) ||
            (activity.ipaddress && activity.ipaddress.toLowerCase().includes(searchLower)) ||
            (activity.location && activity.location.toLowerCase().includes(searchLower)) ||
            (activity.browserdetails && activity.browserdetails.toLowerCase().includes(searchLower)) ||
            formattedTime.includes(searchLower)
        );
    });

    const totalRecords = filteredActivities.length;
    const totalPages = Math.max(1, Math.ceil(filteredActivities.length / pageSize));
    const visibleActivities = filteredActivities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <>
            {showWarning && <WarningModal message={warningMessage} onClose={handleWarningClose} />}
            {successMessage && <AlertMessage message={successMessage} onClose={handleCloseAlert} />}
            <div className={`LoginActivity-container ${isRtl ? 'rtl-loginactivity' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="login-activity-container">
                    <h6 className="login-activity-headingname">{translations.LoginActivity}</h6>
                    <div className="login-activity-form-container">
                        <div className="login-activity-header">
                            <SearchInput
                                placeholder={translations.searchPlaceholder}
                                value={searchValue}
                                onChange={(e) => {
                                    setSearchValue(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div className="tablediv">
                            {loading ? (
                                <LoadingSpinner />
                            ) : (
                                <table className="loginactivitytable">
                                    <thead>
                                        <tr>
                                            <th onClick={() => sortActivities("device")}>
                                                {translations.device} {renderSortIcon("device")}
                                            </th>
                                            <th onClick={() => sortActivities("ipaddress")}>
                                                {translations.ipaddress} {renderSortIcon("ipaddress")}
                                            </th>
                                            <th onClick={() => sortActivities("location")}>
                                                {translations.location} {renderSortIcon("location")}
                                            </th>
                                            <th onClick={() => sortActivities("browserdetails")}>
                                                {translations.browserdetails} {renderSortIcon("browserdetails")}
                                            </th>
                                            <th onClick={() => sortActivities("login")}>
                                                {translations.logintime} {renderSortIcon("login")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleActivities.length > 0 ? (
                                            visibleActivities.map((activity, index) => (
                                                <tr key={activity.loginacitivityid || activity._id || index}>
                                                    <td>{activity.device || "Unknown"}</td>
                                                    <td>{activity.ipaddress || "—"}</td>
                                                    <td>{activity.location || "—"}</td>
                                                    <td className="browser-details-td" title={activity.browserdetails}>
                                                        {activity.browserdetails || "—"}
                                                    </td>
                                                    <td>{formatLoginTime(activity)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '24px 0' }}>
                                                    {translations.nologinactivities}
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
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginActivity;
