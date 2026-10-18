import CustomSwitch from '../../../Pages/Custom/CustomSwitch';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../Context/LanguageContext";
import { useAuth } from '../../../Middleware/Auth';
import LoadingSpinner from '../../../Pages/Custom/LoadingSpinner';
import WarningModal from '../../../Pages/Custom/WarningModal';
import "../../../Scss/User/Employee/addemployee.scss";
import CheckToken from '../../../utils/CheckToken';
import HandleUnauthorized from '../../../utils/HandleUnauthorized';
import Dropdown from '../../Dropdown/Dropdown';
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

const EditEmployee = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { logoutUser } = useAuth();
    const { translations, isRtl } = useLanguage();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenName = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenName);

    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState(true);
    const [phoneError, setPhoneError] = useState("");

    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        phone: "",
        role: "Employee"
    });

    const roleOptions = [
        { label: translations.Admin, value: "Admin" },
        { label: translations.Employee, value: "Employee" }
    ];

    useEffect(() => {
        if (translations.editemployee) document.title = translations.editemployee;
    }, [translations]);

    useEffect(() => {
        if (!CheckToken(token, logoutUser, navigate)) return;

        const fetchEmployeeDetails = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${adminPanelBackendPath}/User/EditEmployee/${id}`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` }
                });

                const result = await response.json();
                if (HandleUnauthorized(result, logoutUser, navigate)) return;

                if (response.ok) {
                    setFormData({
                        firstname: result.firstname || "",
                        lastname: result.lastname || "",
                        email: result.email || "",
                        phone: result.phone || "",
                        role: result.role || "Employee"
                    });
                    setStatus(result.status !== undefined ? result.status : true);
                } else {
                    const errorMessages = {
                        "Employee not found": translations.employeenotfound,
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

        fetchEmployeeDetails();
    }, [id, token, navigate, logoutUser, adminPanelBackendPath, translations]);

    const handleSwitchChange = (event) => setStatus(event.target.checked);

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

        if (!formData.firstname.trim() || !formData.lastname.trim() || !formData.email.trim() || !formData.role) {
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
            const response = await fetch(`${adminPanelBackendPath}/User/UpdateEmployee/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstname: formData.firstname.trim(),
                    lastname: formData.lastname.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone,
                    role: formData.role,
                    status
                }),
            });

            const result = await response.json();
            if (HandleUnauthorized(result, logoutUser, navigate)) return;

            if (response.ok) {
                navigate(`/User/Employee`, {
                    state: { message: translations.updateemployeesuccessfull }
                });
            } else {
                const errorMessages = {
                    "All fields are required": translations.allfieldrequired,
                    "Email Already Exists": translations.emailalreadyexists,
                    "Employee not found": translations.employeenotfound,
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
                        {translations.editemployee}
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
                                        <label>{translations.status}</label>
                                        <div className="switch-wrapper">
                                            <CustomSwitch checked={status} onChange={handleSwitchChange} />
                                        </div>
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

export default EditEmployee;
