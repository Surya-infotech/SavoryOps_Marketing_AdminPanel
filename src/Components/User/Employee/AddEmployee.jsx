import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../../Middleware/Auth';
import LoadingSpinner from '../../../Pages/Custom/LoadingSpinner';
import WarningModal from '../../../Pages/Custom/WarningModal';
import "../../../Scss/User/Employee/addemployee.scss";
import { useLanguage } from "../../../Context/LanguageContext";
import CheckToken from '../../../utils/CheckToken';
import HandleUnauthorized from '../../../utils/HandleUnauthorized';
import Dropdown from '../../Dropdown/Dropdown';
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const AddEmployee = () => {
    const navigate = useNavigate();
    const { translations, isRtl } = useLanguage();
    const { logoutUser } = useAuth();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);

    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [phoneError, setPhoneError] = useState("");

    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        phone: "",
        role: "Employee"
    });

    const roleOptions = [
        { label: translations.Admin, value: "Admin" },
        { label: translations.Employee, value: "Employee" }
    ];

    useEffect(() => {
        if (translations.addemployee) document.title = translations.addemployee;
    }, [translations]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (value) => {
        setFormData((prev) => ({ ...prev, phone: value || '' }));

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
                    setPhoneError(translations.invalidphonenumber);
                } else {
                    setPhoneError("");
                }
            }
        } catch {
            if (value.length >= 10) {
                setPhoneError(translations.invalidphonenumber);
            } else {
                setPhoneError("");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.firstname.trim() || !formData.lastname.trim() || !formData.email.trim() || !formData.password || !formData.role) {
            setWarningMessage(translations.allfieldrequired);
            setShowWarning(true);
            return;
        }

        let isPhoneValid = true;
        if (formData.phone && formData.phone.trim() !== '') {
            try {
                isPhoneValid = isValidPhoneNumber(formData.phone);
            } catch {
                isPhoneValid = false;
            }
        }

        if (formData.phone && formData.phone.trim() !== '' && !isPhoneValid) {
            setPhoneError(translations.invalidphonenumber);
            setWarningMessage(translations.invalidphonenumber);
            setShowWarning(true);
            return;
        }

        setIsLoading(true);
        if (!CheckToken(token, logoutUser, navigate)) return;

        try {
            const response = await fetch(`${adminPanelBackendPath}/User/AddEmployee`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            if (HandleUnauthorized(result, logoutUser, navigate)) return;

            if (response.ok) {
                navigate(`/User/Employee`, {
                    state: { message: translations.addemployeesuccessfull }
                });
            } else {
                const errorMessages = {
                    "All fields are required": translations.allfieldrequired,
                    "Email Already Exists": translations.emailalreadyexists,
                    "Server error": translations.servererror
                };
                setWarningMessage(errorMessages[result.message] || result.message || translations.servererror);
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => navigate(`/User/Employee`);

    return (
        <>
            {showWarning && <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />}
            <div className={`AddEmployee-container ${isRtl ? 'rtl-addemployee' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="Addemployee-container">
                    <h6 className="Addemployee-headingname">
                        {translations.addemployee}
                    </h6>
                    <div className="Addemployee-form-container">
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="firstname">
                                            {translations.firstname} <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="firstname"
                                            name="firstname"
                                            autoComplete="off"
                                            placeholder={translations.enterfirstname}
                                            autoFocus
                                            required
                                            value={formData.firstname}
                                            onChange={handleInputChange}
                                            onInput={(e) => (e.target.value = e.target.value.replace(/^\s+/, ""))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lastname">
                                            {translations.lastname} <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="lastname"
                                            name="lastname"
                                            autoComplete="off"
                                            placeholder={translations.enterlastname}
                                            required
                                            value={formData.lastname}
                                            onChange={handleInputChange}
                                            onInput={(e) => (e.target.value = e.target.value.replace(/^\s+/, ""))}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="email">
                                            {translations.Email} <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            autoComplete="off"
                                            placeholder={translations.enteremail}
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onInput={(e) => (e.target.value = e.target.value.replace(/^\s+/, ""))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="password">
                                            {translations.password} <span style={{ color: "red" }}>*</span>
                                        </label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                name="password"
                                                autoComplete="new-password"
                                                placeholder={translations.enterpassword}
                                                required
                                                value={formData.password}
                                                onChange={handleInputChange}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-icon"
                                                onClick={() => setShowPassword(prev => !prev)}
                                                tabIndex="-1"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group phone-group">
                                        <label>{translations.Phone}</label>
                                        <div className={`phone-input-wrapper ${phoneError ? 'has-phone-error' : ''}`}>
                                            <PhoneInput
                                                international
                                                defaultCountry="IN"
                                                value={formData.phone}
                                                onChange={handlePhoneChange}
                                                placeholder={translations.Phone}
                                            />
                                            {phoneError && (
                                                <div className="phone-error-message">{phoneError}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <Dropdown
                                            label={<>{translations.role} <span style={{ color: "red" }}>*</span></>}
                                            options={roleOptions}
                                            selectedValue={formData.role}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
                                            labelKey="label"
                                            valueKey="value"
                                            placeholder={translations.selectrole}
                                            showSearch={false}
                                        />
                                    </div>
                                </div>

                                <div className="button-group">
                                    <button
                                        type="button"
                                        className="btn btn-secondary cancelbtn"
                                        onClick={handleCancel}
                                        disabled={isLoading}
                                    >
                                        {translations.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success submit-btn"
                                        disabled={isLoading}
                                    >
                                        {translations.save}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddEmployee;
