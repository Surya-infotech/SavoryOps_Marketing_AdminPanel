import ArrowForward from "@mui/icons-material/ArrowForward";
import ContactMail from "@mui/icons-material/ContactMail";
import Groups from "@mui/icons-material/Groups";
import MarkEmailRead from "@mui/icons-material/MarkEmailRead";
import TrendingDown from "@mui/icons-material/TrendingDown";
import TrendingUp from "@mui/icons-material/TrendingUp";
import WorkspacePremium from "@mui/icons-material/WorkspacePremium";
import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from '../../Context/LanguageContext';
import { usePermissions } from "../../Hooks/usePermissions";
import { useAuth } from "../../Middleware/Auth";
import "../../Scss/Home/Dashboard/dashboard.scss";
import CheckToken from "../../utils/CheckToken";
import HandleUnauthorized from "../../utils/HandleUnauthorized";
import AlertMessage from "../Custom/AlertMessage";
import WarningModal from "../Custom/WarningModal";
import { useFiscalYear } from "../../Context/FiscalYearContext";

const initialDashboardState = {
    whiteLabelCount: 0,
    contactUsCount: 0,
    totalSubscriptionCount: 0,
    totalEmployeesCount: 0,
    activeEmployeesCount: 0,
    monthlySummary: [],
    kpiDifferences: {},
    recentWhiteLabels: [],
    recentEmployees: [],
    whiteLabelStatusCounts: {}
};

const getInitials = (name) => {
    if (!name) return "S";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    } catch {
        return dateStr;
    }
};

const InquiryTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="label">{`${label}`}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="tooltip-data" style={{ color: entry.stroke || entry.color || "#10b981" }}>
                        {`${entry.name}: ${entry.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const SubscriberTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="label">{`${label}`}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="tooltip-data" style={{ color: entry.fill || entry.color || "var(--primary-color)" }}>
                        {`${entry.name}: ${entry.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logoutUser } = useAuth();
    const { translations, isRtl } = useLanguage();
    const { isEmployee } = usePermissions();
    const { selectedFiscalYear } = useFiscalYear();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [dashboardData, setDashboardData] = useState(initialDashboardState);

    useEffect(() => {
        if (isEmployee) {
            navigate('/Home/EmployeeDashboard', { replace: true });
        }
    }, [isEmployee, navigate]);

    useEffect(() => {
        if (translations.Dashboard) document.title = translations.Dashboard;

        const successMessage = localStorage.getItem('loginSuccessMessage');
        if (successMessage) {
            setAlertMessage(successMessage);
            localStorage.removeItem('loginSuccessMessage');
        }
    }, [translations]);

    useEffect(() => {
        if (location.state && location.state.message) {
            setAlertMessage(location.state.message);
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

    useEffect(() => {
        if (isEmployee) return;
        if (!CheckToken(token, logoutUser, navigate)) return;

        const fetchDashboardData = async () => {
            try {
                const response = await fetch(`${adminPanelBackendPath}/Main/GetDashboard/${selectedFiscalYear || 'default'}`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                const data = await response.json();
                if (HandleUnauthorized(data, logoutUser, navigate)) return;

                if (response.ok) {
                    setDashboardData(prevData => ({
                        ...prevData,
                        ...data
                    }));
                } else {
                    const errorMessages = {
                        "Server error": translations.servererror
                    };
                    setWarningMessage(errorMessages[data.message] || data.message || translations.servererror);
                    setShowWarning(true);
                }
            } catch (err) {
                console.error("Dashboard fetch notice:", err);
            }
        };

        fetchDashboardData();
    }, [selectedFiscalYear, token, logoutUser, navigate, adminPanelBackendPath, translations]);

    const parseKpiNumber = (value) => {
        if (value === null || value === undefined || value === "") return null;
        const num = parseFloat(String(value).replace("+", "").replace("%", "").trim());
        return Number.isNaN(num) ? null : num;
    };

    const formatKpiDifference = (value) => {
        const num = parseKpiNumber(value);
        if (num === null) return null;
        const prefix = num > 0 ? "+" : "";
        return `${prefix}${num}%`;
    };

    const getKpiDifferenceClassName = (value) => {
        const num = parseKpiNumber(value);
        if (num === null || num === 0) return "neutral";
        return num > 0 ? "positive" : "negative";
    };

    const renderKpiDifferenceIcon = (value) => {
        const num = parseKpiNumber(value);
        if (num === null || num === 0) return null;
        if (num < 0) return <TrendingDown className="card-difference-icon" />;
        return <TrendingUp className="card-difference-icon" />;
    };

    const kpiDifferences = dashboardData.kpiDifferences || {};

    const cardData = [
        {
            name: translations.WhiteLabelInquiries,
            count: dashboardData.whiteLabelCount ?? 0,
            difference: kpiDifferences.whiteLabelDifference || "+100%",
            icon: <WorkspacePremium className="card-icon" />,
            onClick: () => navigate('/Support/WhiteLabel'),
            isClickable: true,
            variant: "highlight",
        },
        {
            name: translations.ContactUs,
            count: dashboardData.contactUsCount ?? 0,
            difference: kpiDifferences.contactUsDifference || "+100%",
            icon: <ContactMail className="card-icon" />,
            onClick: () => navigate('/Support/ContactUs'),
            isClickable: true,
            variant: "revenue",
        },
        {
            name: translations.Subscribers,
            count: dashboardData.totalSubscriptionCount ?? 0,
            difference: kpiDifferences.subscribersDifference || "+12%",
            icon: <MarkEmailRead className="card-icon" />,
            onClick: () => navigate('/Support/Subscribers'),
            isClickable: true,
            variant: "income",
        },
        {
            name: translations.Employees || translations.Employee,
            count: dashboardData.totalEmployeesCount ?? 0,
            difference: kpiDifferences.employeesDifference || "0%",
            icon: <Groups className="card-icon" />,
            onClick: () => navigate('/User/Employee'),
            isClickable: true,
            variant: "warning",
        },
    ];

    const monthNames = [
        translations.Jan,
        translations.Feb,
        translations.Mar,
        translations.Apr,
        translations.May,
        translations.Jun,
        translations.Jul,
        translations.Aug,
        translations.Sep,
        translations.Oct,
        translations.Nov,
        translations.Dec
    ];

    const initialChartData = monthNames.map((month) => ({
        month,
        whiteLabelCount: 0,
        contactUsCount: 0,
        totalInquiries: 0,
        subscriberCount: 0
    }));

    (dashboardData.monthlySummary || []).forEach((item) => {
        const monthIndex = (item._id ?? 0) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            initialChartData[monthIndex].whiteLabelCount = item.whiteLabelCount ?? 0;
            initialChartData[monthIndex].contactUsCount = item.contactUsCount ?? 0;
            initialChartData[monthIndex].totalInquiries = item.totalInquiries ?? ((item.whiteLabelCount ?? 0) + (item.contactUsCount ?? 0));
            initialChartData[monthIndex].subscriberCount = item.subscriberCount ?? 0;
        }
    });

    const chartData = [...initialChartData];

    const handleWarningClose = () => {
        setShowWarning(false);
        setWarningMessage("");
    };

    if (isEmployee) {
        return null;
    }

    const recentInquiries = dashboardData.recentWhiteLabels || dashboardData.recentOrders || [];
    const recentEmployees = dashboardData.recentEmployees || dashboardData.recentCustomers || [];

    return (<>
        {alertMessage && <AlertMessage message={alertMessage} onClose={() => setAlertMessage("")} />}
        {showWarning && <WarningModal message={warningMessage} onClose={handleWarningClose} />}
        <div className={`dashboard-container ${isRtl ? 'rtl-dashboard' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="kpi-summary-cards">
                {cardData.map((card, index) => (
                    <div
                        key={index}
                        className={`kpi-card ${card.variant || ''}`}
                        onClick={card.isClickable ? card.onClick : undefined}
                        style={{ cursor: card.isClickable ? 'pointer' : 'default' }}
                    >
                        <div className="kpi-info">
                            <span className="kpi-title">{card.name}</span>
                            <span className="kpi-value">{card.count}</span>
                            {card.difference !== undefined && card.difference !== null && formatKpiDifference(card.difference) && (
                                <div className={`card-difference-wrap ${getKpiDifferenceClassName(card.difference)}`}>
                                    {renderKpiDifferenceIcon(card.difference)}
                                    <span className="card-difference">
                                        {formatKpiDifference(card.difference)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="kpi-icon-box">{card.icon}</div>
                    </div>
                ))}
            </div>

            <div className="dashboard-row row-1">
                <div className="chart-container monthly-revenue-chart">
                    <Typography variant="h6" className="chart-title">
                        {translations.MonthlyInquiries}
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="whiteLabelGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="contactUsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" className="chart-axis" interval={0} axisLine={false} tickLine={false} />
                            <YAxis className="chart-axis" axisLine={false} tickLine={false} width={45} allowDecimals={false} tickFormatter={(value) => Math.round(value)} />
                            <Tooltip content={<InquiryTooltip />} />
                            <Legend className="chart-legend" />
                            <Area
                                type="monotone"
                                dataKey="whiteLabelCount"
                                stroke="var(--primary-color)"
                                fill="url(#whiteLabelGradient)"
                                strokeWidth={3}
                                name={translations.WhiteLabelInquiries}
                            />
                            <Area
                                type="monotone"
                                dataKey="contactUsCount"
                                stroke="#0284c7"
                                fill="url(#contactUsGradient)"
                                strokeWidth={2.5}
                                name={translations.ContactUs}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="recently-added-container">
                    <div className="section-header-wrap">
                        <Typography variant="h6" className="section-title">
                            {translations.RecentInquiries}
                        </Typography>
                        <button className="view-all-btn" onClick={() => navigate('/Support/WhiteLabel')}>
                            {translations.viewall} <ArrowForward />
                        </button>
                    </div>
                    {recentInquiries.length > 0 ? (
                        <div className="recent-orders-list">
                            {recentInquiries.map((inquiry, index) => {
                                const statusClass = (inquiry.status || "pending").toLowerCase().replace(/\s+/g, '-');
                                return (
                                    <div
                                        key={inquiry._id || index}
                                        className="order-item-card"
                                        onClick={() => navigate('/Support/WhiteLabel')}
                                    >
                                        <div className="order-left">
                                            <div className="order-icon-badge">
                                                <WorkspacePremium />
                                            </div>
                                            <div className="order-info">
                                                <div className="order-number">
                                                    {inquiry.fullName || "Inquiry Lead"}
                                                </div>
                                                <div className="order-customer" title={inquiry.email}>
                                                    {inquiry.company ? `${inquiry.company} • ` : ""}{inquiry.licenseModel || inquiry.email}
                                                </div>
                                                <div className="order-date">
                                                    {inquiry.formattedDate || formatDisplayDate(inquiry.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="order-right">
                                            <span className={`order-status-pill ${statusClass}`}>
                                                {inquiry.status || "Pending"}
                                            </span>
                                            {inquiry.timeline && (
                                                <div className="order-date" style={{ fontSize: '10.5px' }}>
                                                    {inquiry.timeline}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-data-message">
                            <Typography variant="body2">
                                {translations.NoRecentInquiries}
                            </Typography>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-row row-2">
                <div className="recently-added-container">
                    <div className="section-header-wrap">
                        <Typography variant="h6" className="section-title">
                            {translations.RecentEmployees}
                        </Typography>
                        <button className="view-all-btn" onClick={() => navigate('/User/Employee')}>
                            {translations.viewall} <ArrowForward />
                        </button>
                    </div>
                    {recentEmployees.length > 0 ? (
                        <div className="recent-clients-list">
                            {recentEmployees.map((emp, index) => (
                                <div
                                    key={emp._id || index}
                                    className="client-item-card"
                                    onClick={() => navigate('/User/Employee')}
                                >
                                    <div className="client-left">
                                        <div className="client-avatar">
                                            {getInitials(emp.fullname || `${emp.firstname || ''} ${emp.lastname || ''}`)}
                                        </div>
                                        <div className="client-info">
                                            <div className="client-name">
                                                {emp.fullname || `${emp.firstname || ''} ${emp.lastname || ''}`.trim() || emp.email}
                                            </div>
                                            <div className="client-email">
                                                {emp.email || ""}
                                            </div>
                                            <div className="client-phone">
                                                {emp.role || "Employee"}{emp.phone ? ` • ${emp.phone}` : ""}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="client-right">
                                        <div className="client-date">
                                            {emp.formattedDate || formatDisplayDate(emp.createdAt)}
                                        </div>
                                        <span className={`client-status-badge ${emp.status ? 'active' : 'inactive'}`}>
                                            {emp.status ? translations.active : translations.inactive}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-data-message">
                            <Typography variant="body2">
                                {translations.NoRecentEmployees}
                            </Typography>
                        </div>
                    )}
                </div>

                <div className="chart-container">
                    <Typography variant="h6" className="chart-title">
                        {translations.MonthlySubscribers}
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} barSize={24} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <XAxis dataKey="month" className="chart-axis" axisLine={false} tickLine={false} />
                            <YAxis className="chart-axis" axisLine={false} tickLine={false} width={45} allowDecimals={false} tickFormatter={(value) => Math.round(value)} />
                            <Tooltip content={<SubscriberTooltip />} />
                            <Legend className="chart-legend" />
                            <Bar dataKey="subscriberCount" fill="var(--primary-color)" name={translations.Subscribers} radius={[8, 8, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </>);
};

export default Dashboard;