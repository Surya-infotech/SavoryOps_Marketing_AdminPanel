import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../Context/LanguageContext';
import GetWhiteLabel from '../../Components/Support/WhiteLabel/GetWhiteLabel';
import AlertMessage from '../Custom/AlertMessage';
import WarningModal from '../Custom/WarningModal';
import SearchInput from '../Custom/SearchInput';
import "../../Scss/Support/WhiteLabel/whitelabel.scss";

const WhiteLabel = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { translations } = useLanguage();
    const [alertMessage, setAlertMessage] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const [searchValue, setSearchValue] = useState("");

    useEffect(() => {
        const title = translations.WhiteLabelInquiries || translations.WhiteLabel || "White-Label Inquiries";
        document.title = title;
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

    return (
        <div className="WhiteLabel-container">
            <div className="whitelabel-container">
                <h6 className="whitelabel-headingname">
                    {translations.WhiteLabelInquiries || translations.WhiteLabel || "White-Label Inquiries"}
                </h6>
                <div className="whitelabel-form-container">
                    {alertMessage && <AlertMessage message={alertMessage} onClose={() => setAlertMessage("")} />}
                    {warningMessage && <WarningModal message={warningMessage} onClose={() => setWarningMessage("")} />}
                    <div className="whitelabel-header">
                        <SearchInput
                            placeholder={translations.searchPlaceholder || "Search inquiries..."}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </div>
                    <GetWhiteLabel searchValue={searchValue} />
                </div>
            </div>
        </div>
    );
};

export default WhiteLabel;
