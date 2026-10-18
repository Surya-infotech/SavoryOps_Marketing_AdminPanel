import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../Context/LanguageContext';
import GetSubscribers from '../../Components/Support/Subscribers/GetSubscribers';
import AlertMessage from '../Custom/AlertMessage';
import WarningModal from '../Custom/WarningModal';
import SearchInput from '../Custom/SearchInput';
import "../../Scss/Support/Subscribers/subscribers.scss";

const Subscribers = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { translations } = useLanguage();
    const [alertMessage, setAlertMessage] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const [searchValue, setSearchValue] = useState("");

    useEffect(() => {
        if (translations.Subscribers) document.title = translations.Subscribers;
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
        <div className="Subscribers-container">
            <div className="subscribers-container">
                <h6 className="subscribers-headingname">{translations.Subscribers}</h6>
                <div className="subscribers-form-container">
                    {alertMessage && <AlertMessage message={alertMessage} onClose={() => setAlertMessage("")} />}
                    {warningMessage && <WarningModal message={warningMessage} onClose={() => setWarningMessage("")} />}
                    <div className="subscribers-header">
                        <SearchInput
                            placeholder={translations.searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </div>
                    <GetSubscribers searchValue={searchValue} />
                </div>
            </div>
        </div>
    );
};

export default Subscribers;
