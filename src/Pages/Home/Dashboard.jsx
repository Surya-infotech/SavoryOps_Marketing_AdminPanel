import ArrowForward from "@mui/icons-material/ArrowForward";
import Groups from "@mui/icons-material/Groups";
import MarkEmailRead from "@mui/icons-material/MarkEmailRead";
import Payments from "@mui/icons-material/Payments";
import ShoppingBag from "@mui/icons-material/ShoppingBag";
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
    totalOrdersCount: 0,
    allOrdersCount: 0,
    totalRevenue: 0,
    totalSubtotalSum: 0,
    totalTaxSum: 0,
    totalProductsCount: 0,
    publishedProductsCount: 0,
    totalCustomersCount: 0,
    monthlySummary: [],
    kpiDifferences: {},
    recentOrders: [],
    recentCustomers: []
};

const getInitials = (name) => {
    if (!name) return "C";
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
    const [currencyDetails, setCurrencyDetails] = useState({ currencysymbol: '₹', currencyposition: 'right' });

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

    const formatCurrency = (amount, details) => {
        if (amount === undefined || amount === null) return "₹0.00";
        const num = parseFloat(amount || 0);
        if (isNaN(num)) return amount;

        const {
            decimal = 2,
            thousandseparator = ',',
            decimalseparator = '.',
            currencysymbol = '₹',
            currencyposition = 'right'
        } = details || {};

        const decPlaces = decimal !== undefined && decimal !== null ? parseInt(decimal, 10) : 2;
        let [intPart, decPart] = num.toFixed(decPlaces).split('.');
        const sep = thousandseparator || ',';

        // Proper Indian number system grouping: last 3 digits, then groups of 2 digits
        const last3 = intPart.slice(-3);
        const other = intPart.slice(0, -3);
        const formattedInt = other !== '' ? other.replace(/\B(?=(\d{2})+(?!\d))/g, sep) + sep + last3 : last3;

        const decSep = decimalseparator || '.';
        const formattedAmount = decPlaces > 0 ? `${formattedInt}${decSep}${decPart}` : formattedInt;

        switch (currencyposition) {
            case "left": return `${currencysymbol || '₹'}${formattedAmount}`;
            case "left-space": return `${currencysymbol || '₹'} ${formattedAmount}`;
            case "right": return `${formattedAmount}${currencysymbol || '₹'}`;
            case "right-space": return `${formattedAmount} ${currencysymbol || '₹'}`;
            default: return `${formattedAmount}${currencysymbol || '₹'}`;
        }
    };

    useEffect(() => {
        if (isEmployee) return;
        if (!CheckToken(token, logoutUser, navigate)) return;

        const fetchActiveCurrency = async () => {
            try {
                const miscRes = await fetch(`${adminPanelBackendPath}/System/GetMiscSetting`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                const miscData = await miscRes.json();
                if (miscRes.ok && miscData?.currencyid) {
                    const currRes = await fetch(`${adminPanelBackendPath}/System/GetCurrencies_statustrue`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    });
                    const currData = await currRes.json();
                    if (currRes.ok && Array.isArray(currData)) {
                        const matched = currData.find(c => Number(c.currencyid) === Number(miscData.currencyid));
                        if (matched) {
                            setCurrencyDetails(matched);
                        }
                    }
                }
            } catch {
                // Ignore fallback to defaults
            }
        };

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
                    if (data.currencyDetails || data.currency) {
                        setCurrencyDetails(data.currencyDetails || data.currency);
                    } else {
                        fetchActiveCurrency();
                    }
                } else {
                    const errorMessages = {
                        "Server error": translations.servererror
                    };
                    setWarningMessage(errorMessages[data.message] || data.message || translations.servererror);
                    setShowWarning(true);
                    fetchActiveCurrency();
                }
            } catch (err) {
                console.error("Dashboard fetch notice:", err);
                fetchActiveCurrency();
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
            name: translations.WhiteLabelInquiries || "White-Label Inquiries",
            count: dashboardData.whiteLabelCount ?? 0,
            difference: "+100%",
            icon: <WorkspacePremium className="card-icon" />,
            onClick: () => navigate('/Support/WhiteLabel'),
            isClickable: true,
            variant: "highlight",
        },
        {
            name: translations.totalrevenue,
            count: formatCurrency(dashboardData.totalRevenue ?? 0, currencyDetails),
            difference: kpiDifferences.revenueDifference,
            icon: <Payments className="card-icon" />,
            isClickable: false,
            variant: "revenue",
        },
        {
            name: translations.Subscribers || "Subscribers",
            count: dashboardData.totalSubscriptionCount || 43,
            difference: "+12%",
            icon: <MarkEmailRead className="card-icon" />,
            onClick: () => navigate('/Support/Subscribers'),
            isClickable: true,
            variant: "income",
        },
        {
            name: translations.Employee || "Employees",
            count: dashboardData.totalCustomersCount ?? 0,
            difference: kpiDifferences.customersDifference,
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

    const initialChartData = monthNames.map((month) => ({ month, Revenue: 0, Orders: 0 }));

    (dashboardData.monthlySummary || []).forEach((item) => {
        const monthIndex = (item._id ?? 0) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            initialChartData[monthIndex].Revenue = item.monthlyRevenue ?? 0;
            initialChartData[monthIndex].Orders = item.orderCount ?? (item.subscriptionCount ?? 0);
        }
    });

    const chartData = [...initialChartData];

    const CustomTooltip = ({ active, payload, label, translations, currencyDetails, formatCurrency }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{`${label}`}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="tooltip-data">
                            {`${entry.dataKey === "Revenue" ? translations.monthlyrevenue : translations.orders}: ${entry.dataKey === "Revenue" ? formatCurrency(entry.value, currencyDetails) : entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const handleWarningClose = () => {
        setShowWarning(false);
        setWarningMessage("");
    };

    if (isEmployee) {
        return null;
    }

    const recentOrders = dashboardData.recentOrders || [];
    const recentCustomers = dashboardData.recentCustomers || [];

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
                        {translations.monthlyrevenue}
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <XAxis dataKey="month" className="chart-axis" interval={0} axisLine={false} tickLine={false} />
                            <YAxis className="chart-axis" axisLine={false} tickLine={false} width={95} tickFormatter={(value) => formatCurrency(value, currencyDetails)} />
                            <Tooltip content={(props) => <CustomTooltip {...props} translations={translations} currencyDetails={currencyDetails} formatCurrency={formatCurrency} />} />
                            <Legend className="chart-legend" />
                            <Area type="monotone" dataKey="Revenue" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.3} strokeWidth={4} name={translations.monthlyrevenue} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="recently-added-container">
                    <div className="section-header-wrap">
                        <Typography variant="h6" className="section-title">
                            {translations.recentorders}
                        </Typography>
                    </div>
                    {recentOrders.length > 0 ? (
                        <div className="recent-orders-list">
                            {recentOrders.map((order, index) => {
                                const statusClass = (order.orderstatus || "confirmed").toLowerCase();
                                return (
                                    <div
                                        key={order._id || index}
                                        className="order-item-card"
                                    >
                                        <div className="order-left">
                                            <div className="order-icon-badge">
                                                <ShoppingBag />
                                            </div>
                                            <div className="order-info">
                                                <div className="order-number">
                                                    #ORD-{order.ordernumber || order.orderid}
                                                </div>
                                                <div className="order-customer">
                                                    {order.customername || order.customeremail || translations.valuedclient}
                                                </div>
                                                <div className="order-date">
                                                    {formatDisplayDate(order.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="order-right">
                                            <div className="order-price">
                                                {formatCurrency(order.total, order.currencydetails || currencyDetails)}
                                            </div>
                                            <span className={`order-status-pill ${statusClass}`}>
                                                {order.orderstatus || "Confirmed"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-data-message">
                            <Typography variant="body2">
                                {translations.notfoundrecentorders}
                            </Typography>
                        </div>
                    )}
                </div>
            </div>

            <div className="dashboard-row row-2">
                <div className="recently-added-container">
                    <div className="section-header-wrap">
                        <Typography variant="h6" className="section-title">
                            {translations.Employee || "Employees"}
                        </Typography>
                        <button className="view-all-btn" onClick={() => navigate('/User/Employee')}>
                            {translations.viewall} <ArrowForward />
                        </button>
                    </div>
                    {recentCustomers.length > 0 ? (
                        <div className="recent-clients-list">
                            {recentCustomers.map((cust, index) => (
                                <div
                                    key={cust._id || index}
                                    className="client-item-card"
                                    onClick={() => navigate('/User/Employee')}
                                >
                                    <div className="client-left">
                                        <div className="client-avatar">
                                            {getInitials(cust.fullname)}
                                        </div>
                                        <div className="client-info">
                                            <div className="client-name">
                                                {cust.fullname || translations.client}
                                            </div>
                                            <div className="client-email">
                                                {cust.email || ""}
                                            </div>
                                            {cust.phone && (
                                                <div className="client-phone">
                                                    {cust.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="client-right">
                                        <div className="client-date">
                                            {formatDisplayDate(cust.createdAt)}
                                        </div>
                                        <span className="client-status-badge">
                                            {translations.active}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-data-message">
                            <Typography variant="body2">
                                {translations.notfoundrecentcustomers}
                            </Typography>
                        </div>
                    )}
                </div>

                <div className="chart-container monthly-order-chart">
                    <Typography variant="h6" className="chart-title">
                        {translations.monthlyorders}
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData} barSize={22} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <XAxis dataKey="month" className="chart-axis" axisLine={false} tickLine={false} />
                            <YAxis className="chart-axis" axisLine={false} tickLine={false} width={65} allowDecimals={false} tickFormatter={(value) => Math.round(value)} />
                            <Tooltip content={(props) => <CustomTooltip {...props} translations={translations} currencyDetails={currencyDetails} formatCurrency={formatCurrency} />} />
                            <Legend className="chart-legend" />
                            <Bar dataKey="Orders" fill="var(--primary-color)" name={translations.orders} radius={[10, 10, 10, 10]} isAnimationActive={false} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </>);
};

export default Dashboard;