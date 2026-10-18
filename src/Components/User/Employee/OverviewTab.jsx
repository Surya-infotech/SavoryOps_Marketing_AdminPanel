import moment from 'moment-timezone';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { useLanguage } from '../../../Context/LanguageContext';

const OverviewTab = ({ employeeData }) => {
    const { translations } = useLanguage();

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const misc = employeeData?.miscSettings;
        const timeZone = misc?.timeZone;
        const dateFormat = misc?.dateFormat;
        const timeFormat = misc?.timeFormat;
        try {
            const m = moment.tz(dateString, timeZone);
            if (m.isValid()) {
                return m.format(`${dateFormat} ${timeFormat}`);
            }
            return String(dateString);
        } catch {
            return String(dateString);
        }
    };

    if (!employeeData) {
        return (
            <div className="no-data-message">
                <p>{translations.nodatafound}</p>
            </div>
        );
    }

    const fullName = `${employeeData.firstname || ''} ${employeeData.lastname || ''}`.trim() || '-';
    const role = employeeData.role || employeeData.employeetype || 'Employee';

    const getInitials = (name) => {
        if (!name || name === '-') return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div className="employeeoverview-card">
            <div className="employee-header-section">
                <div className="employee-image-container">
                    <div className="employee-overview-avatar" aria-label={fullName}>
                        {getInitials(fullName)}
                    </div>
                </div>
                <div className="employee-title-section">
                    <h4 className="employee-name-title">{fullName}</h4>
                    <p className="employee-business-title">{role}</p>
                    <div className="employee-contact-info">
                        {employeeData.phone && (
                            <p className="employee-mobile">
                                <PhoneIcon className="contact-icon" />
                                {employeeData.phone}
                            </p>
                        )}
                        {employeeData.email && (
                            <p className="employee-mobile">
                                <EmailIcon className="contact-icon" />
                                {employeeData.email}
                            </p>
                        )}
                    </div>
                </div>
                <span className={`status-badge ${employeeData.status ? 'active' : 'inactive'}`}>
                    {employeeData.status ? (translations.active) : (translations.inactive)}
                </span>
            </div>

            <div className="employee-details-section">
                <div className="details-grid">
                    <div className="detail-item">
                        <span className="detail-label">{translations.employeeid}</span>
                        <span className="detail-value">{employeeData.employeeid || employeeData._id || '-'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">{translations.gender}</span>
                        <span className="detail-value">{employeeData.gender || '-'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">{translations.createdat}</span>
                        <span className="detail-value">{formatDateTime(employeeData.createdAt)}</span>
                    </div>
                    {employeeData.updatedAt && (
                        <div className="detail-item">
                            <span className="detail-label">{translations.updatedat}</span>
                            <span className="detail-value">{formatDateTime(employeeData.updatedAt)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;