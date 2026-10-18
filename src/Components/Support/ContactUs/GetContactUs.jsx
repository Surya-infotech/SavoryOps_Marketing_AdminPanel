import { ArrowDownward, ArrowUpward, UnfoldMore, Visibility as ViewIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Middleware/Auth';
import { useLanguage } from '../../../Context/LanguageContext';
import CheckToken from '../../../utils/CheckToken';
import HandleUnauthorized from '../../../utils/HandleUnauthorized';
import LoadingSpinner from '../../../Pages/Custom/LoadingSpinner';
import Pagination from '../../../Pages/Custom/Pagination';
import WarningModal from '../../../Pages/Custom/WarningModal';
import AlertMessage from '../../../Pages/Custom/AlertMessage';
import '../../../Scss/Support/ContactUs/getcontactus.scss';

const MESSAGE_TRUNCATE_LENGTH = 50;

const truncateMessage = (text) => {
    if (!text) return '-';
    const str = String(text);
    if (str.length <= MESSAGE_TRUNCATE_LENGTH) return str;
    return str.slice(0, MESSAGE_TRUNCATE_LENGTH) + '...';
};

const GetContactUs = ({ searchValue }) => {
    const navigate = useNavigate();
    const { logoutUser } = useAuth();
    const { translations } = useLanguage();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);
    const [loading, setLoading] = useState(true);
    const [warningMessage, setWarningMessage] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortColumn, setSortColumn] = useState('updatedAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const [contactList, setContactList] = useState([]);
    const [viewModalContact, setViewModalContact] = useState(null);

    useEffect(() => {
        if (!CheckToken(token, logoutUser, navigate)) return;

        const fetchContactUs = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${adminPanelBackendPath}/Support/GetContactUs`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                if (HandleUnauthorized(data, logoutUser, navigate)) return;

                if (response.ok) {
                    const list = Array.isArray(data) ? data : (data != null ? [data] : []);
                    setContactList(list);
                } else {
                    setWarningMessage(translations.servererror);
                    setShowWarning(true);
                }
            } catch {
                setWarningMessage(translations.servererror);
                setShowWarning(true);
            } finally {
                setLoading(false);
            }
        };

        fetchContactUs();
    }, [token, navigate, logoutUser, adminPanelBackendPath, translations]);

    const renderSortIcon = (column) => {
        if (sortColumn !== column) return <UnfoldMore fontSize="small" />;
        return sortDirection === 'asc' ? (
            <ArrowUpward fontSize="small" />
        ) : (
            <ArrowDownward fontSize="small" />
        );
    };

    const getSortValue = (item, column) => {
        if (column === 'fullname') {
            return item.fullname || '';
        }
        return item[column] ?? '';
    };

    const sortContactList = (column) => {
        const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(direction);

        const sorted = [...contactList].sort((a, b) => {
            let valA = getSortValue(a, column);
            let valB = getSortValue(b, column);
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setContactList(sorted);
    };

    const filteredContacts = contactList.filter((item) => {
        const lowerCaseSearchValue = (searchValue || '').toLowerCase().trim();
        if (!lowerCaseSearchValue) return true;
        return Object.values(item).some((value) =>
            value?.toString().toLowerCase().includes(lowerCaseSearchValue)
        );
    });

    const totalRecords = filteredContacts.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const visibleContacts = filteredContacts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleWarningClose = () => setShowWarning(false);
    const handleCloseAlert = () => setSuccessMessage('');
    const handleCloseViewModal = () => setViewModalContact(null);

    return (
        <>
            {showWarning && (
                <WarningModal message={warningMessage} onClose={handleWarningClose} />
            )}
            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="tablediv">
                    <table className="contactustable">
                        <thead>
                            <tr>
                                <th onClick={() => sortContactList('fullname')}>
                                    {translations.FullName} {renderSortIcon('fullname')}
                                </th>
                                <th onClick={() => sortContactList('email')}>
                                    {translations.Email} {renderSortIcon('email')}
                                </th>
                                <th onClick={() => sortContactList('message')}>
                                    {translations.Message} {renderSortIcon('message')}
                                </th>
                                <th className="contactus-view-th">
                                    {translations.View}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleContacts.length > 0 ? (
                                visibleContacts.map((contact) => (
                                    <tr key={contact._id}>
                                        <td>
                                            {contact.fullname || '-'}
                                        </td>
                                        <td>
                                            {contact.email || '-'}
                                        </td>
                                        <td className="contactus-message-cell" title={contact.message || ''}>
                                            {truncateMessage(contact.message)}
                                        </td>
                                        <td>
                                            <IconButton
                                                onClick={() => setViewModalContact(contact)}
                                                aria-label={translations.View}
                                                className="view-icon"
                                                size="small"
                                            >
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: "center", padding: "24px 0" }}>{translations.nodatafound}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {!loading && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                    pageSizeOptions={[10, 15, 20, 50]}
                    selectedPageSize={pageSize}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                    totalRecords={totalRecords}
                />
            )}
            {successMessage && (
                <AlertMessage message={successMessage} onClose={handleCloseAlert} />
            )}

            {viewModalContact && (
                <div className="modal fade show contactus-view-modal" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="contactus-view-modal-title">
                    <div className="contactus-view-modal-backdrop" onClick={handleCloseViewModal} />
                    <div className="contactus-view-modal-dialog-wrapper">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 id="contactus-view-modal-title" className="modal-title">
                                        {translations.ContactDetails}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={handleCloseViewModal}
                                        aria-label={translations.Close}
                                    />
                                </div>
                                <div className="modal-body contactus-view-modal-body">
                                    <div className="contactus-view-row">
                                        <span className="contactus-view-label">
                                            {translations.FullName}:
                                        </span>
                                        <span className="contactus-view-value">
                                            {viewModalContact.fullname || '-'}
                                        </span>
                                    </div>
                                    <div className="contactus-view-row">
                                        <span className="contactus-view-label">{translations.Email}:</span>
                                        <span className="contactus-view-value">
                                            {viewModalContact.email || '-'}
                                        </span>
                                    </div>
                                    <div className="contactus-view-row contactus-view-row-message">
                                        <span className="contactus-view-label">
                                            {translations.Message}:
                                        </span>
                                        <span className="contactus-view-value contactus-view-message">
                                            {viewModalContact.message || '-'}
                                        </span>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleCloseViewModal}
                                    >
                                        {translations.Close}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GetContactUs;
