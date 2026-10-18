import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../Scss/Partials/adminfooter.scss";
import { useAuth } from '../../Middleware/Auth';
import { useLanguage } from '../../Context/LanguageContext';
import CheckToken from '../../utils/CheckToken';
import HandleUnauthorized from '../../utils/HandleUnauthorized';
import WarningModal from '../Custom/WarningModal';

const AdminFooter = () => {
    const navigate = useNavigate();
    const { logoutUser } = useAuth();
    const { translations, isRtl } = useLanguage();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [copyright, setCopyright] = useState("© 2026 SavoryOps. All rights reserved.");
    const [maintainedBy, setMaintainedBy] = useState("SavoryOps");
    const [version, setVersion] = useState("v1.0.0");

    useEffect(() => {
        if (!CheckToken(token, logoutUser, navigate)) return;

        const fetchFooterData = async () => {
            try {
                const response = await fetch(`${adminPanelBackendPath}/System/GetGeneralSetting`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                const data = await response.json();
                if (HandleUnauthorized(data, logoutUser, navigate)) return;
                if (response.ok && data) {
                    if (data.copyright) setCopyright(data.copyright);
                    if (data.maintainedby) setMaintainedBy(data.maintainedby);
                    if (data.version) setVersion(data.version);
                }
            } catch {
                setWarningMessage(translations.servererror);
                setShowWarning(true);
            }
        };

        fetchFooterData();
    }, [token, navigate, logoutUser, adminPanelBackendPath]);

    const handleWarningClose = () => setShowWarning(false);

    return (<>
        {showWarning && <WarningModal message={warningMessage} onClose={handleWarningClose} />}
        <footer className={`footer ${isRtl ? 'rtl-footer' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="footer-layout">
                <div className="footer-left">
                    <span>{isRtl && copyright ? copyright.replace(/All Rights reserved/i, 'جميع الحقوق محفوظة') : copyright}</span>
                </div>
                {maintainedBy?.trim() && (
                    <div className="footer-center">
                        <span>
                            {translations.maintainedby} <strong>{maintainedBy}</strong>
                        </span>
                    </div>
                )}
                {version?.trim() && (
                    <div className="footer-right">
                        <span className="version-value">V ({version})</span>
                    </div>
                )}
            </div>
        </footer>
    </>);
};

export default AdminFooter;