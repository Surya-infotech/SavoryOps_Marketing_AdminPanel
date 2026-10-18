import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../Context/LanguageContext";
import { useAuth } from "../../Middleware/Auth";
import CheckToken from "../../utils/CheckToken";
import HandleUnauthorized from "../../utils/HandleUnauthorized";
import AlertMessage from "../Custom/AlertMessage";
import WarningModal from "../Custom/WarningModal";
import "../../Scss/General/changepassword.scss";

const ChangePassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { translations, isRtl } = useLanguage();
    const { logoutUser } = useAuth();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);
    const EmployeeId = localStorage.getItem("EmployeeID");

    const [alertMessage, setAlertMessage] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);

    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [oldPasswordVerified, setOldPasswordVerified] = useState(false);
    const [oldPasswordStatus, setOldPasswordStatus] = useState("");
    const [isVerifyingOldPassword, setIsVerifyingOldPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (translations.ChangePassword) document.title = translations.ChangePassword;
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));

        if (name === "oldPassword") {
            setOldPasswordVerified(false);
            setOldPasswordStatus("");
        }
    };

    const handleVerifyOldPassword = async () => {
        const trimmedOldPassword = passwordData.oldPassword.trim();

        if (!trimmedOldPassword) {
            setOldPasswordVerified(false);
            setOldPasswordStatus("");
            return;
        }

        if (!CheckToken(token, logoutUser, navigate)) return;

        setIsVerifyingOldPassword(true);
        try {
            let endpoint = `${adminPanelBackendPath}/admin/VerifyOldPassword/${EmployeeId}`
            let response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ oldPassword: trimmedOldPassword }),
            });

            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser, navigate, response)) return;

            if (response.ok) {
                setOldPasswordVerified(true);
                setOldPasswordStatus(translations.oldpasswordmatched);
            } else {
                setOldPasswordVerified(false);
                setOldPasswordStatus(translations.oldpasswordincorrect);
            }
        } catch {
            setOldPasswordVerified(false);
            setOldPasswordStatus("");
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        } finally {
            setIsVerifyingOldPassword(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setWarningMessage(translations.allfieldrequired);
            setShowWarning(true);
            return;
        }

        if (!oldPasswordVerified) {
            setWarningMessage(translations.pleaseverifyoldpasswordfirst);
            setShowWarning(true);
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setWarningMessage(translations.newpasswordandconfirmpasswordnotmatch);
            setShowWarning(true);
            return;
        }

        if (!CheckToken(token, logoutUser, navigate)) return;

        setIsSaving(true);
        try {
            let endpoint = `${adminPanelBackendPath}/admin/ChangePassword/${EmployeeId}`
            let response = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newPassword: passwordData.newPassword }),
            });

            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser, navigate, response)) return;

            if (response.ok) {
                setAlertMessage(translations.passwordupdatedsuccessfully);
                setPasswordData({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
                setOldPasswordVerified(false);
                setOldPasswordStatus("");
            } else {
                setWarningMessage(data.message || translations.servererror);
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {alertMessage && <AlertMessage message={alertMessage} onClose={() => setAlertMessage("")} />}
            {showWarning && <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />}
            <div className={`ChangePassword-container ${isRtl ? "rtl-changepassword" : ""}`} dir={isRtl ? "rtl" : "ltr"}>
                <div className="change-password-container">
                    <h6 className="change-password-headingname">{translations.ChangePassword}</h6>
                    <div className="change-password-form-container">
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="oldPassword">{translations.oldpassword}</label>
                                    <input
                                        id="oldPassword"
                                        type="password"
                                        name="oldPassword"
                                        autoComplete="off"
                                        placeholder={translations.oldpasswordplaceholder}
                                        value={passwordData.oldPassword}
                                        onChange={handleChange}
                                        onBlur={handleVerifyOldPassword}
                                    />
                                    {isVerifyingOldPassword && (
                                        <span className="password-status checking">
                                            {translations.verifyingoldpassword}
                                        </span>
                                    )}
                                    {!isVerifyingOldPassword && oldPasswordStatus && (
                                        <span className={`password-status ${oldPasswordVerified ? "success" : "error"}`}>
                                            {oldPasswordStatus}
                                        </span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="newPassword">{translations.newpassword}</label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        name="newPassword"
                                        autoComplete="off"
                                        placeholder={translations.newpasswordplaceholder}
                                        value={passwordData.newPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">{translations.confirmpassword}</label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        name="confirmPassword"
                                        autoComplete="off"
                                        placeholder={translations.confirmpasswordplaceholder}
                                        value={passwordData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="button-group">
                                <button type="submit" className="btn btn-success submit-btn" disabled={isSaving}>
                                    {isSaving ? (translations.saving) : (translations.save)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChangePassword;
