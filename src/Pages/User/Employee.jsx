import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import "../../Scss/User/Employee/employee.scss";
import { useLanguage } from '../../Context/LanguageContext';
import AlertMessage from '../Custom/AlertMessage';
import WarningModal from '../Custom/WarningModal';
import GetEmployee from '../../Components/User/Employee/GetEmployee';
import SearchInput from '../Custom/SearchInput';

const Employee = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { translations, isRtl } = useLanguage();
    const [alertMessage, setAlertMessage] = useState(location.state?.message || "");
    const [warningMessage, setWarningMessage] = useState(location.state?.warning || "");
    const [searchValue, setSearchValue] = useState("");

    useEffect(() => {
        if (translations.Employee) document.title = translations.Employee;
    }, [translations]);

    useEffect(() => {
        if (location.state?.message || location.state?.warning) {
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const handleAddNewClick = () => navigate(`/User/AddEmployee`);

    return (
        <div className={`Employee-container ${isRtl ? 'rtl-employee' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="employee-container">
                <h6 className="employee-headingname">{translations.Employee}</h6>
                <div className="employee-form-container">
                    {alertMessage && <AlertMessage message={alertMessage} onClose={() => setAlertMessage("")} />}
                    {warningMessage && <WarningModal message={warningMessage} onClose={() => setWarningMessage("")} />}
                    <div className="employee-header">
                        <SearchInput
                            placeholder={translations.searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                        <button type="button" className="add-new-btn" onClick={handleAddNewClick}>
                            {translations.addNew}
                        </button>
                    </div>
                    <GetEmployee searchValue={searchValue} />
                </div>
            </div>
        </div>
    );
};

export default Employee;
