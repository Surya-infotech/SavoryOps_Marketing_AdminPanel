import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment-timezone';
import {
    CalendarMonth,
    WorkOutlined,
    PersonOutlined,
    VerifiedUser,
    Phone,
    Email,
    Edit as EditIcon
} from '@mui/icons-material';
import { useLanguage } from '../../Context/LanguageContext';
import { useAuth } from '../../Middleware/Auth';
import LoadingSpinner from '../Custom/LoadingSpinner';
import WarningModal from '../Custom/WarningModal';
import CheckToken from '../../utils/CheckToken';
import HandleUnauthorized from '../../utils/HandleUnauthorized';
import "../../Scss/Home/Dashboard/employeedashboard.scss";

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const { translations, isRtl } = useLanguage();
    const { logoutUser, employeeId: authEmployeeId } = useAuth();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);
    const employeeId = authEmployeeId || localStorage.getItem("EmployeeID");

    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        if (!employeeId || !CheckToken(token, logoutUser, navigate)) return;

        const fetchEmployeeDetails = async () => {
            setLoading(true);
            try {
                let response = await fetch(`${adminPanelBackendPath}/User/GetEmployeeDetails/${employeeId}`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });

                if (response.status === 404) {
                    response = await fetch(`${adminPanelBackendPath}/User/EditEmployee/${employeeId}`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    });
                }

                const data = await response.json();
                if (HandleUnauthorized(data, logoutUser, navigate)) return;

                if (response.ok) {
                    setEmployeeData(data);
                } else {
                    setWarningMessage(data.message || translations.servererror);
                    setShowWarning(true);
                }
            } catch {
                setWarningMessage(translations.servererror);
                setShowWarning(true);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeeDetails();
    }, [employeeId, adminPanelBackendPath, token, logoutUser, navigate, translations]);

    const employeeFullName = employeeData
        ? `${employeeData.firstname || ''} ${employeeData.lastname || ''}`.trim()
        : '';

    const getInitials = (name) => {
        if (!name || name === '-') return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    useEffect(() => {
        if (translations.Dashboard) document.title = translations.Dashboard;
    }, [translations]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const misc = employeeData?.miscSettings;
        const timeZone = misc?.timeZone;
        const dateFormat = misc?.dateFormat;
        const timeFormat = misc?.timeFormat;
        try {
            if (timeZone && dateFormat) {
                const m = moment.tz(dateString, timeZone);
                if (m.isValid()) {
                    return timeFormat ? m.format(`${dateFormat} ${timeFormat}`) : m.format(dateFormat);
                }
            } else if (dateFormat) {
                const m = moment(dateString);
                if (m.isValid()) {
                    return timeFormat ? m.format(`${dateFormat} ${timeFormat}`) : m.format(dateFormat);
                }
            }
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return translations.goodmorning;
        if (hour < 18) return translations.goodafternoon;
        return translations.goodevening;
    };

    const todayDateString = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    if (loading) {
        return <LoadingSpinner />;
    }

    const role = employeeData?.role || employeeData?.employeetype || 'Employee';
    const isActive = Boolean(employeeData?.status);

    return (
        <>
            {showWarning && <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />}
            <div className={`EmployeeDashboard-container ${isRtl ? 'rtl-employeedashboard' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="employeedashboard-content">
                    {/* Header Row */}
                    <div className="dashboard-header-row">
                        <h6 className="dashboard-heading">
                            {translations.Dashboard}
                        </h6>
                        <div className="current-date-badge">
                            <CalendarMonth className="date-icon" />
                            <span>{todayDateString}</span>
                        </div>
                    </div>

                    {/* 1. Hero Profile Banner */}
                    <div className="employee-hero-card">
                        <div className="hero-left-wrapper">
                            <div className="avatar-container">
                                <div className="employee-avatar-badge" aria-label={employeeFullName || "Employee"}>
                                    {getInitials(employeeFullName)}
                                </div>
                                {isActive && <span className="online-status-dot" title="Active Account" />}
                            </div>

                            <div className="hero-details">
                                <span className="welcome-greeting">
                                    {getGreeting()}, {employeeData?.firstname || 'Employee'}
                                </span>
                                <div className="employee-name-row">
                                    <h4 className="employee-name">{employeeFullName || '-'}</h4>
                                </div>

                                <div className="contact-chips-row">
                                    {employeeData?.phone && (
                                        <a href={`tel:${employeeData.phone}`} className="contact-chip">
                                            <Phone className="chip-icon" />
                                            <span>{employeeData.phone}</span>
                                        </a>
                                    )}
                                    {employeeData?.email && (
                                        <a href={`mailto:${employeeData.email}`} className="contact-chip">
                                            <Email className="chip-icon" />
                                            <span>{employeeData.email}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="hero-right-actions">
                            <span className={`status-chip ${isActive ? 'active' : 'inactive'}`}>
                                <span className="status-dot" />
                                {isActive ? (translations.active) : (translations.inactive)}
                            </span>
                            <button
                                type="button"
                                className="profile-edit-btn"
                                onClick={() => navigate('/Home/Profile')}
                            >
                                <EditIcon fontSize="small" />
                                <span>{translations.editprofile}</span>
                            </button>
                        </div>
                    </div>

                    {/* 2. Key Metrics Grid */}
                    <div className="metrics-cards-grid">
                        <div className="metric-stat-card">
                            <div className="stat-icon-wrapper theme-blue">
                                <WorkOutlined className="stat-icon" />
                            </div>
                            <div className="stat-meta">
                                <span className="stat-label">{translations.role}</span>
                                <span className="stat-value">{role}</span>
                            </div>
                        </div>

                        <div className="metric-stat-card">
                            <div className="stat-icon-wrapper theme-purple">
                                <PersonOutlined className="stat-icon" />
                            </div>
                            <div className="stat-meta">
                                <span className="stat-label">{translations.gender}</span>
                                <span className="stat-value">{employeeData?.gender || '-'}</span>
                            </div>
                        </div>

                        <div className="metric-stat-card">
                            <div className="stat-icon-wrapper theme-emerald">
                                <VerifiedUser className="stat-icon" />
                            </div>
                            <div className="stat-meta">
                                <span className="stat-label">{translations.status}</span>
                                <span className="stat-value" style={{ color: isActive ? '#059669' : '#dc2626' }}>
                                    {isActive ? (translations.active) : (translations.inactive)}
                                </span>
                            </div>
                        </div>

                        <div className="metric-stat-card">
                            <div className="stat-icon-wrapper theme-amber">
                                <CalendarMonth className="stat-icon" />
                            </div>
                            <div className="stat-meta">
                                <span className="stat-label">{translations.createdat}</span>
                                <span className="stat-value">{formatDate(employeeData?.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Detailed Information Cards Row */}
                    <div className="info-panels-row">
                        <div className="info-panel-card">
                            <div className="panel-header">
                                <PersonOutlined className="panel-header-icon" />
                                <h5 className="panel-title">{translations.employeeoverview || 'Employee Overview'}</h5>
                            </div>
                            <div className="panel-body">
                                <div className="info-list">
                                    <div className="info-row">
                                        <span className="info-key">{translations.employeeid}</span>
                                        <span className="info-val">{employeeData?.employeeid || employeeData?._id || '-'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-key">{translations.role}</span>
                                        <span className="info-val">{role}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-key">{translations.gender}</span>
                                        <span className="info-val">{employeeData?.gender || '-'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-key">{translations.createdat}</span>
                                        <span className="info-val">{formatDate(employeeData?.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmployeeDashboard;