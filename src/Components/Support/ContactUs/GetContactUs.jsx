import {
    ArrowDownward,
    ArrowUpward,
    UnfoldMore,
    Visibility as ViewIcon,
    Delete as DeleteIcon,
    WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../Middleware/Auth';
import { useLanguage } from '../../../Context/LanguageContext';
import CheckToken from '../../../utils/CheckToken';
import HandleUnauthorized from '../../../utils/HandleUnauthorized';
import LoadingSpinner from '../../../Pages/Custom/LoadingSpinner';
import Pagination from '../../../Pages/Custom/Pagination';
import WarningModal from '../../../Pages/Custom/WarningModal';
import AlertMessage from '../../../Pages/Custom/AlertMessage';
import DeleteModal from '../../../Pages/Custom/DeleteModal';
import '../../../Scss/Support/ContactUs/getcontactus.scss';

const MESSAGE_TRUNCATE_LENGTH = 45;

const truncateMessage = (text) => {
    if (!text) return '-';
    const str = String(text);
    if (str.length <= MESSAGE_TRUNCATE_LENGTH) return str;
    return str.slice(0, MESSAGE_TRUNCATE_LENGTH) + '...';
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateString;
    }
};

const GetContactUs = ({ searchValue }) => {
    const navigate = useNavigate();
    const { logoutUser } = useAuth();
    const { translations = {} } = useLanguage();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);

    const [loading, setLoading] = useState(true);
    const [warningMessage, setWarningMessage] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortColumn, setSortColumn] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const [contactList, setContactList] = useState([]);
    const [viewModalContact, setViewModalContact] = useState(null);

    // Delete state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchContactUs = async () => {
        if (!CheckToken(token, logoutUser, navigate)) return;
        try {
            setLoading(true);
            const response = await fetch(`${adminPanelBackendPath}/Support/GetContactUs`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });
            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser, navigate)) return;

            if (response.ok) {
                const list = Array.isArray(data) ? data : (data != null ? [data] : []);
                setContactList(list);
            } else {
                setWarningMessage(translations.servererror || 'Failed to load contact inquiries');
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror || 'Failed to load contact inquiries');
            setShowWarning(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContactUs();
    }, [token, navigate, logoutUser, adminPanelBackendPath]);

    const renderSortIcon = (column) => {
        if (sortColumn !== column) return <UnfoldMore fontSize="small" />;
        return sortDirection === 'asc' ? (
            <ArrowUpward fontSize="small" />
        ) : (
            <ArrowDownward fontSize="small" />
        );
    };

    const handleSort = (column) => {
        const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(direction);
    };

    const filteredAndSortedContacts = useMemo(() => {
        const query = (searchValue || '').toLowerCase().trim();
        let list = contactList.filter((item) => {
            if (!query) return true;
            return (
                (item.fullname && item.fullname.toLowerCase().includes(query)) ||
                (item.email && item.email.toLowerCase().includes(query)) ||
                (item.phone && item.phone.toLowerCase().includes(query)) ||
                (item.subject && item.subject.toLowerCase().includes(query)) ||
                (item.message && item.message.toLowerCase().includes(query))
            );
        });

        list.sort((a, b) => {
            let valA = a[sortColumn] ?? '';
            let valB = b[sortColumn] ?? '';

            if (sortColumn === 'createdAt') {
                valA = new Date(valA).getTime() || 0;
                valB = new Date(valB).getTime() || 0;
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [contactList, searchValue, sortColumn, sortDirection]);

    const totalRecords = filteredAndSortedContacts.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const visibleContacts = filteredAndSortedContacts.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const openWhatsAppDirect = (phone, name) => {
        const cleanNumber = (phone || '').replace(/[^0-9]/g, '');
        const text = encodeURIComponent(`Hello ${name || 'there'}, thank you for contacting SavoryOps.`);
        window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
    };

    const handleDeleteClick = (contact) => {
        setContactToDelete(contact);
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!contactToDelete || !contactToDelete._id) return;
        setIsDeleting(true);

        try {
            const response = await fetch(`${adminPanelBackendPath}/Support/DeleteContactUs/${contactToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.success !== false) {
                setContactList((prev) => prev.filter((item) => item._id !== contactToDelete._id));
                setSuccessMessage(data.message || 'Contact message deleted successfully.');
                setDeleteModalOpen(false);
                setContactToDelete(null);
            } else {
                setWarningMessage(data.message || 'Failed to delete message');
                setShowWarning(true);
            }
        } catch {
            setWarningMessage('Error deleting contact message');
            setShowWarning(true);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {showWarning && (
                <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />
            )}
            {successMessage && (
                <AlertMessage message={successMessage} onClose={() => setSuccessMessage('')} />
            )}

            {deleteModalOpen && (
                <DeleteModal
                    open={deleteModalOpen}
                    onClose={() => {
                        if (!isDeleting) {
                            setDeleteModalOpen(false);
                            setContactToDelete(null);
                        }
                    }}
                    onDelete={handleDeleteConfirm}
                    name={contactToDelete?.fullname || contactToDelete?.email || 'this message'}
                    message="contact message"
                    headingname="Delete Contact Message"
                    isLoading={isDeleting}
                />
            )}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="tablediv">
                    <table className="contactustable">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('fullname')}>
                                    {translations.FullName || 'Full Name'} {renderSortIcon('fullname')}
                                </th>
                                <th onClick={() => handleSort('email')}>
                                    {translations.Email || 'Email'} {renderSortIcon('email')}
                                </th>
                                <th onClick={() => handleSort('phone')}>
                                    {translations.Phone || 'Phone'} {renderSortIcon('phone')}
                                </th>
                                <th onClick={() => handleSort('subject')}>
                                    Subject {renderSortIcon('subject')}
                                </th>
                                <th onClick={() => handleSort('message')}>
                                    {translations.Message || 'Message'} {renderSortIcon('message')}
                                </th>
                                <th onClick={() => handleSort('createdAt')}>
                                    Date {renderSortIcon('createdAt')}
                                </th>
                                <th className="contactus-view-th" style={{ textAlign: 'center' }}>
                                    {translations.action || 'Actions'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleContacts.length > 0 ? (
                                visibleContacts.map((contact) => (
                                    <tr key={contact._id}>
                                        <td className="contactus-name-cell">
                                            <strong>{contact.fullname || '-'}</strong>
                                        </td>
                                        <td className="contactus-email-cell">
                                            <a href={`mailto:${contact.email}`}>{contact.email || '-'}</a>
                                        </td>
                                        <td className="contactus-phone-cell">
                                            {contact.phone ? (
                                                <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="contactus-subject-cell">
                                            <span className="contact-subject-badge">
                                                {contact.subject || 'General'}
                                            </span>
                                        </td>
                                        <td className="contactus-message-cell" title={contact.message || ''}>
                                            {truncateMessage(contact.message)}
                                        </td>
                                        <td className="contactus-date-cell">
                                            {formatDate(contact.createdAt)}
                                        </td>
                                        <td>
                                            <div className="contactus-actions">
                                                <IconButton
                                                    onClick={() => setViewModalContact(contact)}
                                                    aria-label={translations.View || 'View'}
                                                    title={translations.View || 'View'}
                                                    className="view-icon"
                                                    size="small"
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>

                                                {contact.phone && (
                                                    <IconButton
                                                        onClick={() => openWhatsAppDirect(contact.phone, contact.fullname)}
                                                        size="small"
                                                        title="Chat on WhatsApp"
                                                        className="wa-icon-btn"
                                                    >
                                                        <WhatsAppIcon fontSize="small" />
                                                    </IconButton>
                                                )}

                                                <IconButton
                                                    onClick={() => handleDeleteClick(contact)}
                                                    size="small"
                                                    title={translations.delete || 'Delete'}
                                                    className="delete-icon-btn"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px 0' }}>
                                        {translations.nodatafound || 'No inquiries found'}
                                    </td>
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

            {/* View Details Modal */}
            {viewModalContact && (
                <div
                    className="modal fade show contactus-view-modal"
                    style={{ display: 'block' }}
                    tabIndex="-1"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="contactus-view-modal-title"
                >
                    <div className="contactus-view-modal-backdrop" onClick={() => setViewModalContact(null)} />
                    <div className="contactus-view-modal-dialog-wrapper">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 id="contactus-view-modal-title" className="modal-title">
                                        Contact Inquiry Details
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setViewModalContact(null)}
                                        aria-label="Close"
                                    />
                                </div>
                                <div className="modal-body contactus-view-modal-body">
                                    <div className="contactus-view-row">
                                        <span className="contactus-view-label">
                                            {translations.FullName || 'Full Name'}:
                                        </span>
                                        <span className="contactus-view-value">
                                            <strong>{viewModalContact.fullname || '-'}</strong>
                                        </span>
                                    </div>
                                    <div className="contactus-view-row">
                                        <span className="contactus-view-label">
                                            {translations.Email || 'Email'}:
                                        </span>
                                        <span className="contactus-view-value">
                                            <a href={`mailto:${viewModalContact.email}`}>
                                                {viewModalContact.email || '-'}
                                            </a>
                                        </span>
                                    </div>
                                    <div className="contactus-view-row">
                                        <span className="contactus-view-label">
                                            {translations.Phone || 'Phone'}:
                                        </span>
                                        <span className="contactus-view-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {viewModalContact.phone ? (
                                                <>
                                                    <a href={`tel:${viewModalContact.phone}`}>
                                                        {viewModalContact.phone}
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => openWhatsAppDirect(viewModalContact.phone, viewModalContact.fullname)}
                                                        className="btn btn-sm btn-outline-success"
                                                        style={{ padding: '2px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <WhatsAppIcon style={{ fontSize: '14px' }} /> WhatsApp
                                                    </button>
                                                </>
                                            ) : (
                                                '-'
                                            )}
                                        </span>
                                    </div>
                                    <div className="contactus-view-row">
                                        <span className="contactus-view-label">Subject:</span>
                                        <span className="contactus-view-value">
                                            <span className="contact-subject-badge">
                                                {viewModalContact.subject || 'General'}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="contactus-view-row">
                                        <span className="contactus-view-label">Date Received:</span>
                                        <span className="contactus-view-value">
                                            {formatDate(viewModalContact.createdAt)}
                                        </span>
                                    </div>
                                    <div className="contactus-view-row contactus-view-row-message">
                                        <span className="contactus-view-label">
                                            {translations.Message || 'Message'}:
                                        </span>
                                        <div className="contactus-view-value contactus-view-message" style={{ background: 'rgba(0,0,0,0.04)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }}>
                                            {viewModalContact.message || '-'}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setViewModalContact(null)}
                                    >
                                        Close
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
