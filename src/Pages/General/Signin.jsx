import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import ReactWorldFlags from 'react-world-flags';

const Flag = (props) => {
    const Component = typeof ReactWorldFlags === 'function'
        ? ReactWorldFlags
        : (typeof ReactWorldFlags?.default === 'function'
            ? ReactWorldFlags.default
            : ReactWorldFlags?.default?.default || ReactWorldFlags);

    if (typeof Component === 'function') {
        return <Component {...props} />;
    }
    return <span style={{ width: '20px', display: 'inline-block' }}>🏳️</span>;
};
import { useLanguage } from '../../Context/LanguageContext';
import { getLanguageOptions } from '../../constants/languages';
import { useAuth } from '../../Middleware/Auth';
import '../../Scss/General/signin.scss';
import AlertMessage from '../Custom/AlertMessage';
import WarningModal from '../Custom/WarningModal';
import CheckToken from '../../utils/CheckToken';
import { getBrowserAndDeviceDetails, getIpAndLocation } from '../../utils/deviceDetails';
import { setEncryptedRole } from '../../utils/cryptoStorage';

const OwnerLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { storetoken, logoutUser } = useAuth();
    const { translations } = useLanguage();
    const [alertMessage, setAlertMessage] = useState("");
    const BackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [isLanguageDropdownVisible, setLanguageDropdownVisible] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const FALLBACK_LOGO = `${import.meta.env.BASE_URL}logo.png`;
    const [logoUrl, setLogoUrl] = useState(FALLBACK_LOGO);
    const softwareName = 'SavoryOps';
    const HOME_URL = import.meta.env.VITE_HOME_URL || '/';

    const languages = getLanguageOptions();

    const toggleLanguageDropdown = () => setLanguageDropdownVisible(!isLanguageDropdownVisible);

    useEffect(() => {
        if (translations.signin) document.title = translations.signin;
    }, [translations]);

    const handleLanguageSelect = (language) => {
        setSelectedLanguage(language.name);
        localStorage.setItem('selectedLanguage', language.name);
        setLanguageDropdownVisible(false);
        window.location.reload();
    };

    const handleClickOutside = (event) => {
        const languageDropdown = document.querySelector('.language-dropdown');
        if (languageDropdown && !languageDropdown.contains(event.target)) setLanguageDropdownVisible(false);
    };

    useEffect(() => {
        if (isLanguageDropdownVisible) document.addEventListener('mousedown', handleClickOutside);
        else document.removeEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isLanguageDropdownVisible]);

    useEffect(() => {
        const messageParam = searchParams.get('message');
        if (messageParam) {
            setAlertMessage(decodeURIComponent(messageParam));
            setSearchParams({}, { replace: true });
        } else if (location.state && location.state.message) {
            setAlertMessage(location.state.message);
            navigate(location.pathname, { replace: true });
        }
        if (location.state && location.state.warning) {
            setWarningMessage(location.state.warning);
            setShowWarning(true);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate, searchParams, setSearchParams]);

    const checkToken = async () => {
        if (!CheckToken(token, logoutUser, navigate)) return;

        try {
            let response = await fetch(`${BackendPath}/admin/verify-token`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });

            if (response.status === 404) {
                response = await fetch(`${BackendPath}/General/admin/verify-token`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
            }

            if (response.ok) {
                const data = await response.json();
                const userRole = data.role || data.employee?.role || data.admin?.role;
                if (userRole) {
                    setEncryptedRole(userRole);
                }
                const employeeId = data.employee?._id;
                if (employeeId) {
                    localStorage.setItem('EmployeeID', employeeId);
                }
                const isEmp = (userRole || '').trim().toLowerCase() === 'employee';
                navigate(isEmp ? '/Home/EmployeeDashboard' : '/Home/Dashboard');
            }
            else {
                logoutUser();
                navigate("/Signin");
            }
        } catch {
            logoutUser();
            navigate("/Signin");
        }
    };

    useEffect(() => {
        checkToken();
    }, [BackendPath, navigate, token, logoutUser, tokenname]);

    useEffect(() => {
        const fetchLandingPageSettings = async () => {
            try {
                const response = await fetch(`${BackendPath}/System/GetGeneralSetting_landingpage`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                const data = await response.json();
                if (!response.ok || !data) return;
            } catch {
                /* keep defaults when API fails */
            }
        };

        fetchLandingPageSettings();
    }, [BackendPath]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setFormError('');
        try {
            const { browserdetails, device } = getBrowserAndDeviceDetails();
            let ipaddress = "Unknown";
            let location = "Unknown";
            try {
                const ipLocation = await getIpAndLocation();
                if (ipLocation) {
                    ipaddress = ipLocation.ipaddress || "Unknown";
                    location = ipLocation.location || "Unknown";
                }
            } catch {
                // Fallback to unknown if network lookup fails
            }

            let response;

            response = await fetch(`${BackendPath}/admin/Signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, browserdetails, device, ipaddress, location }),
            });

            const data = await response.json();
            if (response.ok) {
                const authToken = data.employee?.Token || data.token;
                const userRole = data.role || data.employee?.role || "Employee";
                const employeeId = data.employee?._id;
                storetoken(authToken, userRole, employeeId);
                setEncryptedRole(userRole);
                if (employeeId) {
                    localStorage.setItem('EmployeeID', employeeId);
                }
                if (data.employee?.permissions) {
                    localStorage.setItem('EMPLOYEE_PERMISSIONS', JSON.stringify(data.employee.permissions));
                } else {
                    localStorage.removeItem('EMPLOYEE_PERMISSIONS');
                }
                const isEmp = (userRole || '').trim().toLowerCase() === 'employee';
                navigate(isEmp ? '/Home/EmployeeDashboard' : '/Home/Dashboard');
            }
            else {
                const errorMessages = {
                    "Invalid Email": translations.Invalidemail,
                    "All fields are required": translations.allfieldrequired,
                    "Invalid Password": translations.invalidpassword,
                };
                setFormError(errorMessages[data.message] || data.message || translations.servererror);
            }
        } catch {
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        } finally {
            setIsLoading(false);
        }
    };


    return (<>
        {showWarning && <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />}
        {alertMessage && <AlertMessage message={alertMessage} onClose={() => setAlertMessage("")} />}
        <div className="full-page">
            {languages.length > 1 && (
                <div className="language-container">
                    <div className="language-dropdown" onClick={toggleLanguageDropdown}>
                        <button type="button">
                            <Flag
                                code={languages.find(lang => lang.name === selectedLanguage)?.code}
                                style={{ width: '20px' }}
                                alt={selectedLanguage}
                            />
                            <span className="language-dropdown__name">{selectedLanguage.substring(0, 3)}</span>
                        </button>
                        {isLanguageDropdownVisible && (
                            <div className="language-dropdown-menu">
                                <ul>
                                    {languages.map((language, index) => (
                                        <li
                                            key={index}
                                            className={language.name === selectedLanguage ? 'selected' : ''}
                                            onClick={() => handleLanguageSelect(language)}
                                        >
                                            <Flag code={language.code} style={{ width: '20px' }} alt={language.name} />
                                            <span className="language-dropdown__name">{language.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="login-container">
                <div className="logo-container">
                    <a href={HOME_URL} className="logo-button">
                        <img
                            src={logoUrl}
                            className="logo"
                            alt={translations.logo}
                            onError={() => setLogoUrl(FALLBACK_LOGO)}
                        />
                        <h2>{softwareName}</h2>
                    </a>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>{translations.Email}</label>
                        <input
                            type="email"
                            placeholder={translations.enteremail}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>{translations.password}</label>
                        <input
                            type="password"
                            placeholder={translations.passwordplaceholder}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {formError && <div className="error-message">{formError}</div>}
                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? translations.signingin : (translations.signin)}
                    </button>
                </form>
            </div>
        </div>
    </>);
};

export default OwnerLogin;