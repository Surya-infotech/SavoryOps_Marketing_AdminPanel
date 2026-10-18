import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../Context/LanguageContext";
import { useAuth } from '../../../Middleware/Auth';
import WarningModal from '../../../Pages/Custom/WarningModal';
import "../../../Scss/System/Setting/addfiscalyear.scss";
import CheckToken from '../../../utils/CheckToken';
import HandleUnauthorized from '../../../utils/HandleUnauthorized';

const AddFiscalYear = () => {
    const navigate = useNavigate();
    const { translations } = useLanguage();
    const { logoutUser } = useAuth();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const token = localStorage.getItem(tokenname);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    useEffect(() => {
        if (translations.addfiscalyear) document.title = translations.addfiscalyear;
    }, [translations]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!CheckToken(token, logoutUser, navigate)) return;
        const formatDateForBackend = (date) => {
            if (!date) return null;
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const formattedFromDate = formatDateForBackend(fromDate);
        const formattedToDate = formatDateForBackend(toDate);

        if (!fromDate || !toDate) {
            setWarningMessage(translations.bothdatesrequired);
            setShowWarning(true);
            return;
        }

        if (fromDate && toDate && fromDate > toDate) {
            setWarningMessage(translations.todatecannotbeforefromdate);
            setShowWarning(true);
            return;
        }

        try {
            const response = await fetch(`${adminPanelBackendPath}/System/AddFiscalYear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ fromDate: formattedFromDate, toDate: formattedToDate }),
            });
            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser, navigate)) return;
            if (response.ok) navigate(`/System/Setting`, { state: { activeTab: 'fiscalyear', message: translations.addfiscalyearsuccessfull } });
            else {
                const errorMessages = {
                    "End date cannot be before start date.": translations.enddatecannotbeforestartdate,
                    "The selected date range overlaps with an existing fiscal year": translations.theselecteddatemustbewithinfiscalyear,
                    "Server error": translations.servererror
                };
                setWarningMessage(errorMessages[data.message] || translations.servererror);
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        }
    };

    const handleCancel = () => navigate(`/System/Setting`, { state: { activeTab: 'fiscalyear' } });

    return (<>
        {showWarning && <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />}
        <div className="AddFiscal-container">
            <div className="Addfiscal-container">
                <h6 className="Addfiscal-headingname">{translations.addfiscalyear}</h6>
                <div className="Addfiscal-form-container">
                    <form onSubmit={handleSubmit}>
                        <div className='form-row'>
                            <div className="form-group">
                                <label htmlFor="fromDate">{translations.startdate}</label>
                                <DatePicker
                                    id="fromDate"
                                    selected={fromDate}
                                    onChange={(date) => setFromDate(date)}
                                    dateFormat="yyyy/MM/dd"
                                    placeholderText={translations.startdateplaceholder}
                                    showYearDropdown
                                    scrollableYearDropdown
                                    autoComplete='off'
                                    dropdownMode="select"
                                    minDate={new Date()}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="toDate">{translations.enddate}</label>
                                <DatePicker
                                    id="toDate"
                                    selected={toDate}
                                    onChange={(date) => setToDate(date)}
                                    dateFormat="yyyy/MM/dd"
                                    placeholderText={translations.enddateplaceholder}
                                    showYearDropdown
                                    scrollableYearDropdown
                                    autoComplete='off'
                                    dropdownMode="select"
                                    minDate={fromDate}
                                    required
                                />
                            </div>
                        </div>
                        <div className="button-group">
                            <button type="button" className="btn btn-secondary cancelbtn" onClick={handleCancel}>{translations.cancel}</button>
                            <button type="submit" className="btn btn-success submit-btn">{translations.save}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </>);
}

export default AddFiscalYear;