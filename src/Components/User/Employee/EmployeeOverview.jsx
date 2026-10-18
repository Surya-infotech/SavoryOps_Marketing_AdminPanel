import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../Context/LanguageContext';
import { useAuth } from '../../../Middleware/Auth';
import LoadingSpinner from '../../../Pages/Custom/LoadingSpinner';
import WarningModal from '../../../Pages/Custom/WarningModal';
import CheckToken from '../../../utils/CheckToken';
import HandleUnauthorized from '../../../utils/HandleUnauthorized';
import "../../../Scss/User/Employee/employeeoverview.scss";
import OverviewTab from './OverviewTab';
import PermissionTab from './PermissionTab';

const EmployeeOverview = () => {
    const navigate = useNavigate();
    const { translations, isRtl } = useLanguage();
    const { logoutUser } = useAuth();
    const { id } = useParams();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);

    const [activeTab, setActiveTab] = useState(0);
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        if (!id || !CheckToken(token, logoutUser, navigate)) return;

        const fetchEmployeeDetails = async () => {
            setLoading(true);
            try {
                let response = await fetch(`${adminPanelBackendPath}/User/GetEmployeeDetails/${id}`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });

                if (response.status === 404) {
                    response = await fetch(`${adminPanelBackendPath}/User/EditEmployee/${id}`, {
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
    }, [id, adminPanelBackendPath, token, logoutUser, navigate, translations]);

    const employeeFullName = employeeData
        ? `${employeeData.firstname || ''} ${employeeData.lastname || ''}`.trim()
        : '';

    useEffect(() => {
        if (translations.employeeoverview) document.title = translations.employeeoverview;
    }, [translations]);

    const handleBackClick = () => {
        navigate('/User/Employee');
    };

    const isEmployee = (employeeData?.role || employeeData?.employeetype || '').trim().toLowerCase() === 'employee';

    useEffect(() => {
        if (!isEmployee && activeTab > 0) {
            setActiveTab(0);
        }
    }, [isEmployee, activeTab]);

    const tabs = [
        {
            title: translations.overview,
            content: <OverviewTab employeeData={employeeData} />
        },
        ...(isEmployee ? [
            {
                title: translations.permissions,
                content: <PermissionTab employeeData={employeeData} />
            }
        ] : [])
    ];

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            {showWarning && <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />}
            <div className={`EmployeeOverview-container ${isRtl ? 'rtl-employeeoverview' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="employeeoverview-container">
                    <div className="employeeoverview-header">
                        <div className="employeeoverview-header__titles">
                            <h6 className="employeeoverview-headingname">
                                {employeeFullName ? `${employeeFullName} - ` : ''}{translations.employeeoverview}
                            </h6>
                        </div>
                        <button
                            type="button"
                            className="employeeoverview-back"
                            onClick={handleBackClick}
                        >
                            <ArrowBackIcon className="employeeoverview-back-icon" aria-hidden />
                            {translations.back}
                        </button>
                    </div>

                    <div className="tabs-container">
                        <div className="horizontal-tabs" role="tablist" aria-label={translations.employeeoverview}>
                            {tabs.map((tab, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === index}
                                    className={`tab-button ${activeTab === index ? 'active' : ''}`}
                                    onClick={() => setActiveTab(index)}
                                >
                                    {tab.title}
                                </button>
                            ))}
                        </div>
                        <div className="tab-content">
                            <div className="tab-content-body">{tabs[activeTab]?.content || tabs[0]?.content}</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmployeeOverview;