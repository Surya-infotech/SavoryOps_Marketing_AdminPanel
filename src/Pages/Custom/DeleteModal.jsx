import CircularProgress from '@mui/material/CircularProgress';
import { useLanguage } from '../../Context/LanguageContext';
import "../../Scss/Custom/deletemodal.scss";

const DeleteModal = ({
    open,
    onClose,
    onDelete,
    name,
    message,
    headingname,
    isLoading,
    confirmText,
    cancelText,
    customMessage,
    confirmBtnClass
}) => {
    const { translations = {} } = useLanguage();
    if (!open) return null;

    return (<>
        <div className="modal fade show delete-modal" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{headingname || translations.delete}</h5>
                        <button type="button" className="btn-close closebtn" onClick={onClose} disabled={isLoading} aria-label={translations.close}></button>
                    </div>
                    <div className="modal-body">
                        {isLoading ? (
                            <div className="delete-modal-loader">
                                <CircularProgress size={36} className="delete-spinner" />
                            </div>
                        ) : customMessage ? (
                            typeof customMessage === 'string' ? <p>{customMessage}</p> : customMessage
                        ) : (
                            <p>{translations.deletemsg} <strong>{name}</strong> {message}?</p>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary cancelbtn" onClick={onClose} disabled={isLoading}>
                            {cancelText || translations.cancel}
                        </button>
                        <button type="button" className={confirmBtnClass || "btn btn-danger deletebtn"} onClick={onDelete} disabled={isLoading}>
                            {confirmText || translations.delete}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div className="modal-backdrop fade show delete-modal-backdrop"></div>
    </>);
};

export default DeleteModal;