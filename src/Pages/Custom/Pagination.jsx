import "../../Scss/Custom/pagination.scss";
import { useLanguage } from "../../Context/LanguageContext";

const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    onPageChange = () => {},
    pageSizeOptions = [10, 15, 20, 50],
    selectedPageSize,
    pageSize,
    onPageSizeChange = () => {},
    totalRecords = 0
}) => {
    const { translations = {}, isRtl } = useLanguage();
    const activePageSize = Number(selectedPageSize || pageSize || 10);
    const maxPagesToShow = 3;
    let startPage, endPage;

    const safeTotalPages = Math.max(1, totalPages || 1);

    if (safeTotalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = safeTotalPages;
    } else {
        if (currentPage === 1) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage >= safeTotalPages) {
            startPage = safeTotalPages - (maxPagesToShow - 1);
            endPage = safeTotalPages;
        } else {
            startPage = currentPage - 1;
            endPage = currentPage + 1;
        }
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * activePageSize + 1;
    const endRecord = totalRecords === 0 ? 0 : Math.min(currentPage * activePageSize, totalRecords);

    const showingText = translations.showing;
    const toText = translations.to;
    const ofText = translations.of;
    const entriesText = translations.entries;
    const previousText = translations.previous;
    const nextText = translations.next;

    return (
        <div className={`d-flex justify-content-between align-items-center paginationdiv ${isRtl ? 'rtl-pagination' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Left side dropdown for page size */}
            <div className="page-size-dropdown">
                <select
                    id="pageSize"
                    className="form-select"
                    value={activePageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                    {(pageSizeOptions || [10, 15, 20, 50]).map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </div>

            <div className="records-info">
                {showingText} {startRecord} {toText} {endRecord} {ofText} {totalRecords} {entriesText}
            </div>

            {/* Pagination controls */}
            <nav aria-label={translations.pagenavigation}>
                <ul className="pagination justify-content-end">
                    <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            {previousText}
                        </button>
                    </li>
                    {pageNumbers.map((number) => (
                        <li
                            key={number}
                            className={`page-item ${currentPage === number ? 'active' : ''}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => onPageChange(number)}
                            >
                                {number}
                            </button>
                        </li>
                    ))}
                    <li className={`page-item ${currentPage >= safeTotalPages || safeTotalPages <= 1 ? 'disabled' : ''}`}>
                        <button
                            className="page-link"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage >= safeTotalPages || safeTotalPages <= 1}
                        >
                            {nextText}
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Pagination;
