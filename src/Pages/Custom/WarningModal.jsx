import ErrorIcon from '@mui/icons-material/Error';
import { useLanguage } from '../../Context/LanguageContext';
import "../../Scss/Custom/deletemodal.scss";

const WarningModal = ({ message, onClose }) => {
    const { translations } = useLanguage();

    return (<>
        <div className="modal fade show" tabIndex="-1" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100005 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "460px", width: "100%", margin: 0 }}>
                <div className="modal-content">
                    <div className="modal-header" style={{ flexDirection: "column", alignItems: "center" }}>
                        <ErrorIcon style={{ fontSize: "48px", color: "red", marginBottom: "4px" }} />
                        <h5 className="modal-title" style={{ color: "red", margin: 0 }}>{translations.warning}</h5>
                    </div>
                    <div className="modal-body text-center">
                        <p style={{ marginBottom: 0 }}>{message || translations.somethingwentwrong}</p>
                    </div>
                    <div className="modal-footer justify-content-center">
                        <button type="button" className="btn btn-primary" onClick={onClose}>
                            {translations.okgotit}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div className="modal-backdrop fade show" style={{ zIndex: 100004 }}></div>
    </>);
};

export default WarningModal;