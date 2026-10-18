import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../Context/LanguageContext";
import "../../../Scss/System/Setting/fiscalyear.scss";
import GetFiscalYear from "./GetFiscalYear";

const FiscalYear = () => {
    const navigate = useNavigate();
    const { translations } = useLanguage();
    const handleAddNewClick = () => navigate(`/System/Setting/AddFiscalYear`);

    useEffect(() => {
        if (translations.fiscalyear) document.title = translations.fiscalyear;
    }, [translations]);

    return (
        <div className="fiscal-year-container">
            <div className="add-new-button-section">
                <button type="button" className="add-new-btn" onClick={handleAddNewClick}>
                    {translations.addNew}
                </button>
            </div>
            <GetFiscalYear />
        </div>
    );
};

export default FiscalYear;