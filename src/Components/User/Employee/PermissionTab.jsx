import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SecurityIcon from '@mui/icons-material/Security';
import BadgeIcon from '@mui/icons-material/Badge';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import RemoveDoneIcon from '@mui/icons-material/RemoveDone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { Checkbox, CircularProgress } from '@mui/material';
import { useLanguage } from '../../../Context/LanguageContext';
import { useAuth } from '../../../Middleware/Auth';
import CheckToken from '../../../utils/CheckToken';
import HandleUnauthorized from '../../../utils/HandleUnauthorized';
import AlertMessage from '../../../Pages/Custom/AlertMessage';
import WarningModal from '../../../Pages/Custom/WarningModal';
import LoadingSpinner from '../../../Pages/Custom/LoadingSpinner';

const ACTIONS = ['view', 'add', 'edit', 'delete'];

const getPageActions = (page) => {
    if (!page.hiddenActions) return ACTIONS;
    return ACTIONS.filter((act) => !page.hiddenActions.includes(act));
};

const PermissionTab = ({ employeeData }) => {
    const { translations } = useLanguage();
    const { logoutUser } = useAuth();
    const navigate = useNavigate();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [permissionsState, setPermissionsState] = useState({});
    const [initialPermissions, setInitialPermissions] = useState({});
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [warningMessage, setWarningMessage] = useState('');
    const [showWarning, setShowWarning] = useState(false);

    const permissionPages = useMemo(() => [
        {
            id: 'contactUs',
            name: translations.ContactUs || 'Contact Us',
            category: translations.Support || 'Content & Support',
            categoryKey: 'support',
            icon: ContactMailIcon,
            hiddenActions: ['add']
        },
        {
            id: 'subscribers',
            name: translations.Subscribers || 'Subscribers',
            category: translations.Support || 'Content & Support',
            categoryKey: 'support',
            icon: MarkEmailReadIcon,
            hiddenActions: ['add', 'edit']
        }
    ], [translations]);

    const categories = useMemo(() => [
        { id: 'all', label: translations.allpages || 'All Pages' },
        { id: 'support', label: translations.Support || 'Content & Support' }
    ], [translations]);

    // Build default permissions matrix (all applicable set to true)
    const buildDefaultMatrix = useMemo(() => {
        const matrix = {};
        permissionPages.forEach((p) => {
            const applicable = getPageActions(p);
            matrix[p.id] = {
                view: applicable.includes('view'),
                add: applicable.includes('add'),
                edit: applicable.includes('edit'),
                delete: applicable.includes('delete')
            };
        });
        return matrix;
    }, [permissionPages]);

    // Fetch saved permissions on mount
    useEffect(() => {
        const employeeId = employeeData?._id;
        if (!employeeId) {
            setFetching(false);
            return;
        }

        if (!CheckToken(token, logoutUser, navigate)) return;

        const fetchPermissions = async () => {
            setFetching(true);
            try {
                const response = await fetch(`${adminPanelBackendPath}/User/GetEmployeePermissions/${employeeId}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                if (HandleUnauthorized(data, logoutUser, navigate)) return;

                const sourcePermissions = (response.ok && data?.permissions && Object.keys(data.permissions).length > 0)
                    ? data.permissions
                    : (employeeData?.permissions && Object.keys(employeeData.permissions).length > 0 ? employeeData.permissions : null);

                if (sourcePermissions) {
                    const merged = {};
                    permissionPages.forEach((p) => {
                        const applicable = getPageActions(p);
                        const sourcePerm = sourcePermissions[p.id];
                        if (sourcePerm) {
                            merged[p.id] = {
                                view: applicable.includes('view') ? Boolean(sourcePerm?.view) : false,
                                add: applicable.includes('add') ? Boolean(sourcePerm?.add) : false,
                                edit: applicable.includes('edit') ? Boolean(sourcePerm?.edit) : false,
                                delete: applicable.includes('delete') ? Boolean(sourcePerm?.delete) : false
                            };
                        } else {
                            merged[p.id] = {
                                view: applicable.includes('view'),
                                add: applicable.includes('add'),
                                edit: applicable.includes('edit'),
                                delete: applicable.includes('delete')
                            };
                        }
                    });
                    setPermissionsState(merged);
                    setInitialPermissions(JSON.parse(JSON.stringify(merged)));
                } else {
                    setPermissionsState(buildDefaultMatrix);
                    setInitialPermissions(JSON.parse(JSON.stringify(buildDefaultMatrix)));
                }
            } catch {
                setPermissionsState(buildDefaultMatrix);
                setInitialPermissions(JSON.parse(JSON.stringify(buildDefaultMatrix)));
            } finally {
                setFetching(false);
            }
        };

        fetchPermissions();
    }, [employeeData?._id, employeeData?.permissions, token, logoutUser, navigate, adminPanelBackendPath, buildDefaultMatrix, permissionPages]);

    // Filtered pages for table display
    const filteredPages = useMemo(() => {
        if (selectedCategory === 'all') return permissionPages;
        return permissionPages.filter((item) => item.categoryKey === selectedCategory);
    }, [permissionPages, selectedCategory]);

    const isDirty = useMemo(() => {
        return JSON.stringify(permissionsState) !== JSON.stringify(initialPermissions);
    }, [permissionsState, initialPermissions]);

    // Checkbox Handlers
    const handlePermissionChange = (pageId, actionKey, checked) => {
        setPermissionsState((prev) => ({
            ...prev,
            [pageId]: {
                ...(prev[pageId] || { view: false, add: false, edit: false, delete: false }),
                [actionKey]: checked
            }
        }));
    };

    // Row Bulk Toggle
    const isRowAllChecked = (page) => {
        const row = permissionsState[page.id] || {};
        const applicableActions = getPageActions(page);
        return applicableActions.length > 0 && applicableActions.every((act) => Boolean(row[act]));
    };

    const handleRowToggle = (page) => {
        const allChecked = isRowAllChecked(page);
        const nextVal = !allChecked;
        const applicableActions = getPageActions(page);

        setPermissionsState((prev) => ({
            ...prev,
            [page.id]: {
                view: applicableActions.includes('view') ? nextVal : false,
                add: applicableActions.includes('add') ? nextVal : false,
                edit: applicableActions.includes('edit') ? nextVal : false,
                delete: applicableActions.includes('delete') ? nextVal : false
            }
        }));
    };

    // Global Grant All
    const handleGrantAll = () => {
        setPermissionsState((prev) => {
            const next = { ...prev };
            permissionPages.forEach((p) => {
                const applicable = getPageActions(p);
                next[p.id] = {
                    view: applicable.includes('view'),
                    add: applicable.includes('add'),
                    edit: applicable.includes('edit'),
                    delete: applicable.includes('delete')
                };
            });
            return next;
        });
    };

    // Global Revoke All
    const handleRevokeAll = () => {
        setPermissionsState((prev) => {
            const next = { ...prev };
            permissionPages.forEach((p) => {
                next[p.id] = { view: false, add: false, edit: false, delete: false };
            });
            return next;
        });
    };

    // Reset back to initial
    const handleReset = () => {
        setPermissionsState(JSON.parse(JSON.stringify(initialPermissions)));
    };

    // Save Permissions API
    const handleSavePermissions = async () => {
        const employeeId = employeeData?._id;
        if (!employeeId) return;

        if (!CheckToken(token, logoutUser, navigate)) return;
        setSaving(true);
        setAlertMessage('');

        try {
            const sanitizedPermissions = {};
            permissionPages.forEach((p) => {
                const applicable = getPageActions(p);
                const row = permissionsState[p.id] || {};
                sanitizedPermissions[p.id] = {
                    view: applicable.includes('view') ? Boolean(row.view) : false,
                    add: applicable.includes('add') ? Boolean(row.add) : false,
                    edit: applicable.includes('edit') ? Boolean(row.edit) : false,
                    delete: applicable.includes('delete') ? Boolean(row.delete) : false
                };
            });

            const response = await fetch(`${adminPanelBackendPath}/User/UpdateEmployeePermissions/${employeeId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    permissions: sanitizedPermissions
                })
            });

            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser, navigate)) return;

            if (response.ok) {
                setPermissionsState(sanitizedPermissions);
                setInitialPermissions(JSON.parse(JSON.stringify(sanitizedPermissions)));
                setAlertMessage(translations.permissionssavedsuccessfully);
            } else {
                setWarningMessage(data.message || translations.servererror);
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        } finally {
            setSaving(false);
        }
    };

    if (fetching) {
        return (
            <div className="permissions-loading-wrapper">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <>
            {alertMessage && <AlertMessage message={alertMessage} onClose={() => setAlertMessage('')} />}
            {showWarning && <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />}

            <div className="permission-tab-content">
                {/* Header Banner */}
                <div className="permission-header-banner">
                    <div className="banner-left">
                        <div className="shield-icon-wrapper">
                            <SecurityIcon className="shield-icon" />
                        </div>
                        <div className="banner-info">
                            <div className="banner-title-row">
                                <h5 className="banner-title">{translations.pagespermission}</h5>
                                <span className="role-chip">
                                    <BadgeIcon className="role-chip-icon" />
                                    {translations.Employee}
                                </span>
                            </div>
                            <p className="banner-subtitle">
                                {translations.employeepermissiondesc}
                            </p>
                        </div>
                    </div>

                    {/* Save Button Header Action */}
                    <div className="banner-right-actions">
                        {isDirty && (
                            <button
                                type="button"
                                className="permission-btn reset-btn"
                                onClick={handleReset}
                                disabled={saving}
                            >
                                <RestartAltIcon className="btn-icon" />
                                {translations.reset}
                            </button>
                        )}
                        <button
                            type="button"
                            className={`permission-btn save-btn ${isDirty ? 'is-dirty' : ''}`}
                            onClick={handleSavePermissions}
                            disabled={saving || !isDirty}
                        >
                            {saving ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                <SaveIcon className="btn-icon" />
                            )}
                            <span>{translations.savepermissions}</span>
                        </button>
                    </div>
                </div>

                {/* Filter, Search & Bulk Actions Bar */}
                <div className="permission-toolbar">
                    <div className="category-pills">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                className={`pill-button ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="toolbar-right-group">
                        <div className="bulk-actions-group">
                            <button
                                type="button"
                                className="bulk-action-btn grant-btn"
                                onClick={handleGrantAll}
                                title={translations.grantall}
                            >
                                <DoneAllIcon className="btn-icon" />
                                <span>{translations.grantall}</span>
                            </button>
                            <button
                                type="button"
                                className="bulk-action-btn revoke-btn"
                                onClick={handleRevokeAll}
                                title={translations.revokeall}
                            >
                                <RemoveDoneIcon className="btn-icon" />
                                <span>{translations.revokeall}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Permissions Matrix Table */}
                <div className="permission-table-wrapper">
                    {filteredPages.length > 0 ? (
                        <div className="tablediv">
                            <table className="permission-table">
                                <thead>
                                    <tr>
                                        <th className="th-page">{translations.pages}</th>
                                        <th className="th-category">{translations.category}</th>
                                        <th className="th-action text-center">{translations.view}</th>
                                        <th className="th-action text-center">{translations.add}</th>
                                        <th className="th-action text-center">{translations.edit}</th>
                                        <th className="th-action text-center">{translations.delete}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPages.map((page) => {
                                        const IconComponent = page.icon;
                                        const rowPerms = permissionsState[page.id] || {};
                                        const hasView = Boolean(rowPerms.view);
                                        const hasAdd = Boolean(rowPerms.add);
                                        const hasEdit = Boolean(rowPerms.edit);
                                        const hasDelete = Boolean(rowPerms.delete);

                                        return (
                                            <tr key={page.id} className="permission-row">
                                                <td className="td-page">
                                                    <div className="page-cell">
                                                        <div className="page-icon-wrapper">
                                                            <IconComponent className="page-icon" />
                                                        </div>
                                                        <span className="page-title">{page.name}</span>
                                                        <button
                                                            type="button"
                                                            className={`row-toggle-pill ${isRowAllChecked(page) ? 'all-on' : 'some-off'}`}
                                                            onClick={() => handleRowToggle(page)}
                                                            title={translations.toggleallpagepermissions}
                                                        >
                                                            {isRowAllChecked(page) ? (
                                                                <CheckCircleIcon className="pill-check-icon" />
                                                            ) : (
                                                                <span className="pill-dot-icon">●</span>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="td-category">
                                                    <span className="category-badge">{page.category}</span>
                                                </td>

                                                {/* Interactive Checkbox Cells */}
                                                <td className="td-action text-center">
                                                    {!page.hiddenActions?.includes('view') ? (
                                                        <Checkbox
                                                            size="medium"
                                                            checked={hasView}
                                                            onChange={(e) => handlePermissionChange(page.id, 'view', e.target.checked)}
                                                            className={`perm-cell-checkbox ${hasView ? 'perm-checked' : 'perm-unchecked'}`}
                                                        />
                                                    ) : (
                                                        <span className="perm-disabled-dash">—</span>
                                                    )}
                                                </td>
                                                <td className="td-action text-center">
                                                    {!page.hiddenActions?.includes('add') ? (
                                                        <Checkbox
                                                            size="medium"
                                                            checked={hasAdd}
                                                            onChange={(e) => handlePermissionChange(page.id, 'add', e.target.checked)}
                                                            className={`perm-cell-checkbox ${hasAdd ? 'perm-checked' : 'perm-unchecked'}`}
                                                        />
                                                    ) : (
                                                        <span className="perm-disabled-dash">—</span>
                                                    )}
                                                </td>
                                                <td className="td-action text-center">
                                                    {!page.hiddenActions?.includes('edit') ? (
                                                        <Checkbox
                                                            size="medium"
                                                            checked={hasEdit}
                                                            onChange={(e) => handlePermissionChange(page.id, 'edit', e.target.checked)}
                                                            className={`perm-cell-checkbox ${hasEdit ? 'perm-checked' : 'perm-unchecked'}`}
                                                        />
                                                    ) : (
                                                        <span className="perm-disabled-dash">—</span>
                                                    )}
                                                </td>
                                                <td className="td-action text-center">
                                                    {!page.hiddenActions?.includes('delete') ? (
                                                        <Checkbox
                                                            size="medium"
                                                            checked={hasDelete}
                                                            onChange={(e) => handlePermissionChange(page.id, 'delete', e.target.checked)}
                                                            className={`perm-cell-checkbox ${hasDelete ? 'perm-checked' : 'perm-unchecked'}`}
                                                        />
                                                    ) : (
                                                        <span className="perm-disabled-dash">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-data-message">
                            <p>{translations.norecordfound}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PermissionTab;