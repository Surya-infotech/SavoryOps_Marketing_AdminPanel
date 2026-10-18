import { useEffect, useState } from 'react';
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from '../../Context/LanguageContext';
import { useAuth } from '../../Middleware/Auth';
import '../../Scss/General/profile.scss';
import CheckToken from '../../utils/CheckToken';
import HandleUnauthorized from '../../utils/HandleUnauthorized';
import AlertMessage from '../Custom/AlertMessage';
import WarningModal from '../Custom/WarningModal';

const Profile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logoutUser } = useAuth();
    const { translations } = useLanguage();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);
    const EmployeeId = localStorage.getItem("EmployeeID");
    const [alertMessage, setAlertMessage] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [profileData, setProfileData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        gender: 'Male'
    });

    useEffect(() => {
        if (translations.Profile) document.title = translations.Profile;
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
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        const fetchAdminDetails = async () => {
            if (!CheckToken(token, logoutUser, navigate)) return;
            try {
                let endpoint = `${adminPanelBackendPath}/admin/GetAdminDetails/${EmployeeId}`;
                let response = await fetch(endpoint, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });

                const data = await response.json();
                if (HandleUnauthorized(data, logoutUser, navigate)) return;

                if (response.ok && data) {
                    const admin = data.admin || data;
                    setProfileData({
                        firstname: admin.firstname || admin.adminfirstname || '',
                        lastname: admin.lastname || admin.adminlastname || '',
                        email: admin.email || '',
                        phone: admin.phone || '',
                        gender: admin.gender || 'Male'
                    });
                } else {
                    const fallbackResponse = await fetch(`${adminPanelBackendPath}/System/GetGeneralSetting`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    });
                    const fallbackData = await fallbackResponse.json();
                    if (HandleUnauthorized(fallbackData, logoutUser, navigate)) return;

                    if (fallbackResponse.ok && fallbackData) {
                        setProfileData(prev => ({
                            ...prev,
                            email: fallbackData.email || '',
                            phone: fallbackData.phone || ''
                        }));
                    }
                    setWarningMessage(translations.adminprofilenotavailable || "Admin profile data not available.");
                    setShowWarning(true);
                }
            } catch {
                setWarningMessage(translations.servererror || "Server error");
                setShowWarning(true);
            }
        };

        fetchAdminDetails();
    }, [token, adminPanelBackendPath, translations, logoutUser, navigate, EmployeeId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (value) => {
        setProfileData((prev) => ({ ...prev, phone: value || '' }));

        if (!value || value.trim() === '') {
            setPhoneError("");
            return;
        }

        try {
            const isValid = isValidPhoneNumber(value);

            if (isValid) {
                setPhoneError("");
            } else {
                if (value.length >= 10) {
                    setPhoneError(translations.invalidphonenumber || "Invalid phone number");
                } else {
                    setPhoneError("");
                }
            }
        } catch {
            if (value.length >= 10) {
                setPhoneError(translations.invalidphonenumber || "Invalid phone number");
            } else {
                setPhoneError("");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!profileData.firstname && !profileData.lastname && !profileData.email && !profileData.phone) {
            setWarningMessage(translations.pleasefillatleastonefield || "Please fill at least one field to update.");
            setShowWarning(true);
            return;
        }

        let isPhoneValid = true;
        if (profileData.phone && profileData.phone.trim() !== '') {
            try {
                isPhoneValid = isValidPhoneNumber(profileData.phone);
            } catch {
                isPhoneValid = false;
            }
        }

        if (profileData.phone && profileData.phone.trim() !== '' && !isPhoneValid) {
            setPhoneError(translations.invalidphonenumber || "Invalid phone number");
            setWarningMessage(translations.invalidphonenumber || "Invalid phone number");
            setShowWarning(true);
            return;
        }

        setPhoneError("");

        const payload = {
            firstname: profileData.firstname.trim(),
            lastname: profileData.lastname.trim(),
            email: profileData.email.trim(),
            phone: (profileData.phone || "").trim(),
            gender: profileData.gender
        };

        try {
            let endpoint = `${adminPanelBackendPath}/admin/UpdateAdminDetails/${EmployeeId}`;
            let response = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setAlertMessage(data.message || translations.profileupdatedsuccessfully || "Profile updated successfully");
                window.dispatchEvent(new Event("adminProfileUpdated"));
            } else {
                setWarningMessage(data.message || translations.servererror);
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        }
    };

    return (
        <>
            {alertMessage && <AlertMessage message={alertMessage} onClose={() => setAlertMessage("")} />}
            {showWarning && <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />}
            <div className="Profile-container">
                <div className="profile-container">
                    <h6 className="profile-headingname">{translations.Profile}</h6>
                    <div className="profile-form-container">
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="firstname">{translations.firstname}</label>
                                    <input
                                        type="text"
                                        id="firstname"
                                        name="firstname"
                                        autoComplete='off'
                                        placeholder={translations.firstnameplaceholder}
                                        value={profileData.firstname}
                                        onChange={handleChange}
                                        onInput={(e) => (e.target.value = e.target.value.replace(/^\s+/, ""))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastname">{translations.lastname}</label>
                                    <input
                                        type="text"
                                        id="lastname"
                                        name="lastname"
                                        autoComplete='off'
                                        placeholder={translations.lastnameplaceholder}
                                        value={profileData.lastname}
                                        onChange={handleChange}
                                        onInput={(e) => (e.target.value = e.target.value.replace(/^\s+/, ""))}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">{translations.Email}</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        autoComplete='off'
                                        placeholder={translations.enteremail}
                                        value={profileData.email}
                                        onChange={handleChange}
                                        onInput={(e) => (e.target.value = e.target.value.replace(/^\s+/, ""))}
                                    />
                                </div>
                                <div className="form-group phone-group">
                                    <label>{translations.Phone}</label>
                                    <div className={`phone-input-wrapper ${phoneError ? 'has-phone-error' : ''}`}>
                                        <PhoneInput
                                            international
                                            defaultCountry="IN"
                                            value={profileData.phone}
                                            onChange={handlePhoneChange}
                                            placeholder={translations.Phone}
                                        />
                                        {phoneError && (
                                            <div className="phone-error-message">{phoneError}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>{translations.gender}</label>
                                    <div className="radio-group">
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="Male"
                                                checked={profileData.gender === 'Male'}
                                                onChange={(e) => setProfileData((prev) => ({ ...prev, gender: e.target.value }))}
                                            />
                                            {translations.male}
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="Female"
                                                checked={profileData.gender === 'Female'}
                                                onChange={(e) => setProfileData((prev) => ({ ...prev, gender: e.target.value }))}
                                            />
                                            {translations.female}
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="Intersex"
                                                checked={profileData.gender === 'Intersex'}
                                                onChange={(e) => setProfileData((prev) => ({ ...prev, gender: e.target.value }))}
                                            />
                                            {translations.intersex}
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="button-group">
                                <button type="submit" className="btn btn-success submit-btn">{translations.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
