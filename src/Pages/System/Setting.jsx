import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import General from '../../Components/System/Setting/General';
import "../../Scss/System/Setting/setting.scss";
import AlertMessage from '../Custom/AlertMessage';
import WarningModal from '../Custom/WarningModal';
import { useLanguage } from '../../Context/LanguageContext';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FiscalYear from '../../Components/System/Setting/FiscalYear';
import Misc from '../../Components/System/Setting/Misc';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';

/** Lower priority number = shown first in the tab list. */
const LEGACY_TAB_INDEX_TO_ID = [
    'general',
    'misc',
    'fiscalyear',
];

const Setting = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { translations, isRtl } = useLanguage();
    const [alertMessage, setAlertMessage] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const [activeTabId, setActiveTabId] = useState('general');

    useEffect(() => {
        if (translations.Setting) document.title = translations.Setting;
    }, [translations]);

    const tabs = useMemo(
        () =>
            [
                {
                    id: 'general',
                    priority: 1,
                    title: translations.generalsettings,
                    icon: <SettingsSuggestIcon />,
                    content: <General />,
                },
                {
                    id: 'misc',
                    priority: 2,
                    title: translations.miscsetting,
                    icon: <MiscellaneousServicesIcon />,
                    content: <Misc />,
                },
                {
                    id: 'fiscalyear',
                    priority: 3,
                    title: translations.fiscalyear,
                    icon: <CalendarMonthIcon />,
                    content: <FiscalYear />,
                },
            ].sort((a, b) => a.priority - b.priority),
        [translations],
    );

    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

    useEffect(() => {
        if (location.state && location.state.message) {
            setAlertMessage(location.state.message);
            navigate(location.pathname, { replace: true, state: { ...location.state, message: undefined } });
        }
        if (location.state && location.state.warning) {
            setWarningMessage(location.state.warning);
            navigate(location.pathname, { replace: true, state: { ...location.state, warning: undefined } });
        }
        if (location.state?.activeTab !== undefined && location.state?.activeTab !== null) {
            const tabState = location.state.activeTab;
            if (typeof tabState === 'string' && tabs.some((tab) => tab.id === tabState)) {
                setActiveTabId(tabState);
            } else if (typeof tabState === 'number' && LEGACY_TAB_INDEX_TO_ID[tabState]) {
                setActiveTabId(LEGACY_TAB_INDEX_TO_ID[tabState]);
            }
            navigate(location.pathname, { replace: true, state: { ...location.state, activeTab: undefined } });
        }
    }, [location, navigate, tabs]);

    return (
        <div className={`setting-container-fluid ${isRtl ? 'rtl-setting' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="setting-container">
                <h6 className="setting-headingname">{translations.Setting}</h6>
                {alertMessage && <AlertMessage message={alertMessage} onClose={() => setAlertMessage("")} />}
                {warningMessage && <WarningModal message={warningMessage} onClose={() => setWarningMessage("")} />}

                <div className="setting-card">
                    <aside className="setting-sidebar">
                        <ul className="setting-nav">
                            {tabs.map((tab) => (
                                <li key={tab.id} className="setting-nav-item">
                                    <button
                                        type="button"
                                        className={`setting-nav-link ${activeTab.id === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTabId(tab.id)}
                                    >
                                        <span className="setting-tab-icon">{tab.icon}</span>
                                        <span className="setting-tab-title">{tab.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>

                    <section className="setting-content">
                        <div className="setting-pane-body">
                            {activeTab.content}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Setting;