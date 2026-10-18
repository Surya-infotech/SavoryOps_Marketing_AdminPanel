import { ArrowDownward, ArrowUpward, UnfoldMore } from '@mui/icons-material';
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
import '../../../Scss/Support/Subscribers/getsubscribers.scss';

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

const GetSubscribers = ({ searchValue }) => {
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
    const [subscriberList, setSubscriberList] = useState([]);

    const fetchSubscribers = async () => {
        if (!CheckToken(token, logoutUser, navigate)) return;
        try {
            setLoading(true);
            const response = await fetch(`${adminPanelBackendPath}/Support/GetSubscribers`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser, navigate)) return;

            if (response.ok) {
                const list = Array.isArray(data) ? data : (data != null ? [data] : []);
                setSubscriberList(list);
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

    useEffect(() => {
        fetchSubscribers();
    }, [token, navigate, logoutUser, adminPanelBackendPath]);

    const renderSortIcon = (column) => {
        if (sortColumn !== column) return <UnfoldMore fontSize="small" />;
        return sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />;
    };

    const getSortValue = (item, column) => {
        return (item[column] ?? '').toString().toLowerCase();
    };

    const handleSort = (column) => {
        const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(direction);
    };

    const filteredAndSortedSubscribers = useMemo(() => {
        const lowerSearch = (searchValue || '').trim().toLowerCase();
        let filtered = subscriberList;
        if (lowerSearch) {
            filtered = subscriberList.filter((item) =>
                (item.email || '').toLowerCase().includes(lowerSearch) ||
                (item.source || '').toLowerCase().includes(lowerSearch)
            );
        }

        return [...filtered].sort((a, b) => {
            let valA = getSortValue(a, sortColumn);
            let valB = getSortValue(b, sortColumn);
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [subscriberList, searchValue, sortColumn, sortDirection]);

    const totalRecords = filteredAndSortedSubscribers.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const visibleSubscribers = filteredAndSortedSubscribers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const handleWarningClose = () => setShowWarning(false);
    const handleCloseAlert = () => setSuccessMessage('');

    return (
        <>
            {showWarning && <WarningModal message={warningMessage} onClose={handleWarningClose} />}
            {successMessage && <AlertMessage message={successMessage} onClose={handleCloseAlert} />}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="tablediv">
                    <table className="subscriberstable">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                                    {translations.Email} {renderSortIcon('email')}
                                </th>
                                <th onClick={() => handleSort('source')} style={{ cursor: 'pointer' }}>
                                    {translations.Source} {renderSortIcon('source')}
                                </th>
                                <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                                    {translations.SubscriptionDate} {renderSortIcon('createdAt')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleSubscribers.length > 0 ? (
                                visibleSubscribers.map((subscriber) => (
                                    <tr key={subscriber._id}>
                                        <td className="subscriber-email-cell">
                                            {subscriber.email || '-'}
                                        </td>
                                        <td className="subscriber-source-cell">
                                            {subscriber.source || 'Website'}
                                        </td>
                                        <td>
                                            {formatDate(subscriber.createdAt)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                                        {translations.nodatafound}
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
        </>
    );
};

export default GetSubscribers;
