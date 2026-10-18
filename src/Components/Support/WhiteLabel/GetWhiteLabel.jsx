import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import UnfoldMore from '@mui/icons-material/UnfoldMore';
import ViewIcon from '@mui/icons-material/Visibility';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
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
import '../../../Scss/Support/WhiteLabel/getwhitelabel.scss';

const GetWhiteLabel = ({ searchValue }) => {
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
    const [sortColumn, setSortColumn] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const [inquiryList, setInquiryList] = useState([]);
    const [viewModalInquiry, setViewModalInquiry] = useState(null);

    const fetchInquiries = async () => {
        if (!CheckToken(token, logoutUser, navigate)) return;
        try {
            setLoading(true);
            const response = await fetch(`${adminPanelBackendPath}/Support/GetWhiteLabel`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser, navigate)) return;

            if (response.ok) {
                const list = Array.isArray(data)
                    ? data
                    : (Array.isArray(data?.inquiries)
                        ? data.inquiries
                        : (Array.isArray(data?.data) ? data.data : (data != null ? [data] : [])));
                setInquiryList(list);
            } else {
                setWarningMessage(translations.servererror || "Failed to load inquiries");
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror || "Failed to connect to server");
            setShowWarning(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, navigate, logoutUser, adminPanelBackendPath]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const response = await fetch(`${adminPanelBackendPath}/Support/UpdateWhiteLabelStatus/${id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await response.json();
            if (response.ok) {
                setInquiryList((prev) =>
                    prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
                );
                if (viewModalInquiry && viewModalInquiry._id === id) {
                    setViewModalInquiry((prev) => ({ ...prev, status: newStatus }));
                }
                setSuccessMessage(translations.statusupdatedsuccessfully || "Status updated successfully.");
            } else {
                setWarningMessage(data.message || "Failed to update status");
                setShowWarning(true);
            }
        } catch {
            setWarningMessage("Error updating status");
            setShowWarning(true);
        }
    };


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

    const filteredAndSortedInquiries = useMemo(() => {
        const q = (searchValue || '').toLowerCase().trim();
        let list = inquiryList.filter((item) => {
            if (!q) return true;
            return (
                (item.fullName && item.fullName.toLowerCase().includes(q)) ||
                (item.company && item.company.toLowerCase().includes(q)) ||
                (item.email && item.email.toLowerCase().includes(q)) ||
                (item.phone && item.phone.toLowerCase().includes(q)) ||
                (item.licenseModel && item.licenseModel.toLowerCase().includes(q)) ||
                (item.timeline && item.timeline.toLowerCase().includes(q)) ||
                (item.status && item.status.toLowerCase().includes(q)) ||
                ((item.formattedDate || item.createdAt || '').toLowerCase().includes(q))
            );
        });

        list.sort((a, b) => {
            let valA = a[sortColumn] ?? '';
            let valB = b[sortColumn] ?? '';
            if (sortColumn === 'createdAt') {
                valA = new Date(valA).getTime() || 0;
                valB = new Date(valB).getTime() || 0;
            }
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [inquiryList, searchValue, sortColumn, sortDirection]);

    const totalRecords = filteredAndSortedInquiries.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const visibleInquiries = filteredAndSortedInquiries.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const getStatusClass = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'contacted':
                return 'status-contacted';
            case 'in progress':
                return 'status-in-progress';
            case 'closed':
                return 'status-closed';
            default:
                return 'status-pending';
        }
    };

    const openWhatsAppDirect = (phone, name) => {
        const cleanNumber = (phone || '').replace(/[^0-9]/g, '');
        const text = encodeURIComponent(`Hello ${name || 'there'}, thank you for inquiring about SavoryOps White-Label License.`);
        window.open(`https://wa.me/${cleanNumber}?text=${text}`, '_blank');
    };

    return (
        <>
            {showWarning && (
                <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />
            )}
            {successMessage && (
                <AlertMessage message={successMessage} onClose={() => setSuccessMessage('')} />
            )}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="tablediv">
                    <table className="whitelabeltable">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('fullName')}>
                                    {translations.FullName || "Full Name"} {renderSortIcon('fullName')}
                                </th>
                                <th onClick={() => handleSort('company')}>
                                    {translations.Company || "Company"} {renderSortIcon('company')}
                                </th>
                                <th onClick={() => handleSort('email')}>
                                    {translations.Email || "Email"} {renderSortIcon('email')}
                                </th>
                                <th onClick={() => handleSort('phone')}>
                                    {translations.Phone || "Phone / WhatsApp"} {renderSortIcon('phone')}
                                </th>
                                <th onClick={() => handleSort('licenseModel')}>
                                    {translations.LicenseModel || "License Plan"} {renderSortIcon('licenseModel')}
                                </th>
                                <th onClick={() => handleSort('timeline')}>
                                    {translations.Timeline || "Timeline"} {renderSortIcon('timeline')}
                                </th>
                                <th onClick={() => handleSort('status')}>
                                    {translations.Status || "Status"} {renderSortIcon('status')}
                                </th>
                                <th onClick={() => handleSort('createdAt')}>
                                    {translations.InquiryDate || "Date"} {renderSortIcon('createdAt')}
                                </th>
                                <th>{translations.Action || "Actions"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleInquiries.length > 0 ? (
                                visibleInquiries.map((inquiry) => (
                                    <tr key={inquiry._id}>
                                        <td>
                                            <strong>{inquiry.fullName || '-'}</strong>
                                        </td>
                                        <td>{inquiry.company || '-'}</td>
                                        <td>
                                            <a href={`mailto:${inquiry.email}`}>{inquiry.email || '-'}</a>
                                        </td>
                                        <td>{inquiry.phone || '-'}</td>
                                        <td>
                                            <span className="badge-plan" title={inquiry.licenseModel}>
                                                {inquiry.licenseModel || 'Source Code License'}
                                            </span>
                                        </td>
                                        <td>{inquiry.timeline || '-'}</td>
                                        <td>
                                            <select
                                                value={inquiry.status || 'Pending'}
                                                onChange={(e) => handleStatusChange(inquiry._id, e.target.value)}
                                                className={`badge-status ${getStatusClass(inquiry.status)}`}
                                                style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Closed">Closed</option>
                                            </select>
                                        </td>
                                        <td>{inquiry.formattedDate || inquiry.createdAt || '-'}</td>
                                        <td>
                                            <div className="whitelabel-actions">
                                                <IconButton
                                                    onClick={() => setViewModalInquiry(inquiry)}
                                                    size="small"
                                                    title={translations.View || "View Details"}
                                                    className="view-icon"
                                                >
                                                    <ViewIcon fontSize="small" />
                                                </IconButton>

                                                {inquiry.phone && (
                                                    <IconButton
                                                        onClick={() => openWhatsAppDirect(inquiry.phone, inquiry.fullName)}
                                                        size="small"
                                                        title="Chat on WhatsApp"
                                                        className="wa-icon-btn"
                                                    >
                                                        <WhatsAppIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '24px 0' }}>
                                        {translations.nodatafound || "No white-label inquiries found"}
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
            {viewModalInquiry && (
                <div className="modal fade show whitelabel-view-modal" style={{ display: 'block' }} tabIndex="-1" role="dialog" aria-modal="true">
                    <div className="whitelabel-view-modal-backdrop" onClick={() => setViewModalInquiry(null)} />
                    <div className="whitelabel-view-modal-dialog-wrapper">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {translations.InquiryDetails || "White-Label Inquiry Details"}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setViewModalInquiry(null)}
                                        aria-label={translations.Close || "Close"}
                                    />
                                </div>
                                <div className="modal-body whitelabel-view-modal-body">
                                    <div className="whitelabel-view-item">
                                        <span className="view-label">{translations.FullName || "Full Name"}</span>
                                        <span className="view-value">{viewModalInquiry.fullName || '-'}</span>
                                    </div>
                                    <div className="whitelabel-view-item">
                                        <span className="view-label">{translations.Company || "Agency / Company"}</span>
                                        <span className="view-value">{viewModalInquiry.company || '-'}</span>
                                    </div>
                                    <div className="whitelabel-view-item">
                                        <span className="view-label">{translations.Email || "Email"}</span>
                                        <span className="view-value">
                                            <a href={`mailto:${viewModalInquiry.email}`}>{viewModalInquiry.email || '-'}</a>
                                        </span>
                                    </div>
                                    <div className="whitelabel-view-item">
                                        <span className="view-label">{translations.Phone || "Phone / WhatsApp"}</span>
                                        <span className="view-value">{viewModalInquiry.phone || '-'}</span>
                                    </div>
                                    <div className="whitelabel-view-item">
                                        <span className="view-label">{translations.LicenseModel || "License Plan"}</span>
                                        <span className="view-value">{viewModalInquiry.licenseModel || '-'}</span>
                                    </div>
                                    <div className="whitelabel-view-item">
                                        <span className="view-label">{translations.Timeline || "Deployment Timeline"}</span>
                                        <span className="view-value">{viewModalInquiry.timeline || '-'}</span>
                                    </div>
                                    <div className="whitelabel-view-item">
                                        <span className="view-label">{translations.Status || "Status"}</span>
                                        <select
                                            value={viewModalInquiry.status || 'Pending'}
                                            onChange={(e) => handleStatusChange(viewModalInquiry._id, e.target.value)}
                                            className="status-select"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Contacted">Contacted</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>
                                    <div className="whitelabel-view-item">
                                        <span className="view-label">{translations.InquiryDate || "Submitted Date"}</span>
                                        <span className="view-value">{viewModalInquiry.formattedDate || viewModalInquiry.createdAt || '-'}</span>
                                    </div>
                                    <div className="whitelabel-view-item full-row message-item">
                                        <span className="view-label">{translations.Requirements || "Custom Requirements or Questions"}</span>
                                        <span className="view-value">{viewModalInquiry.message || 'No additional requirements specified.'}</span>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    {viewModalInquiry.phone && (
                                        <button
                                            type="button"
                                            className="btn-wa-direct"
                                            onClick={() => openWhatsAppDirect(viewModalInquiry.phone, viewModalInquiry.fullName)}
                                        >
                                            <WhatsAppIcon fontSize="small" />
                                            <span>Chat with Lead on WhatsApp</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setViewModalInquiry(null)}
                                    >
                                        {translations.Close || "Close"}
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

export default GetWhiteLabel;
