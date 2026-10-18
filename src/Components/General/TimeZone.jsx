import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import moment from "moment-timezone";
import { useEffect, useRef, useState } from "react";
import "../../Scss/Custom/General/dropdown.scss";
import { useLanguage } from "../../Context/LanguageContext";

const TimeZone = ({ selectedTimeZone, onTimeZoneChange, disabled = false }) => {
    const { translations } = useLanguage();
    const [timeZones, setTimeZones] = useState([]);
    const [selected, setSelected] = useState(selectedTimeZone || "");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setSelected(selectedTimeZone);
    }, [selectedTimeZone]);

    useEffect(() => {
        const zones = moment.tz.names();
        setTimeZones(zones);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    const getUTCOffset = (timeZone) => {
        try {
            const offsetMinutes = moment.tz(timeZone).utcOffset();
            const offsetHours = Math.floor(offsetMinutes / 60);
            const offsetRemainingMinutes = Math.abs(offsetMinutes % 60);
            const offsetSign = offsetHours >= 0 ? "+" : "-";
            return `${offsetSign}${String(Math.abs(offsetHours)).padStart(2, "0")}:${String(offsetRemainingMinutes).padStart(2, "0")}`;
        } catch {
            return "+00:00";
        }
    };

    const handleSelectTimeZone = (timeZone) => {
        setSelected(timeZone);
        onTimeZoneChange(timeZone);
        setIsDropdownOpen(false);
    };

    return (
        <div>
            <label>{translations.timezone}</label>
            <div className="dropdown" ref={dropdownRef}>
                <button
                    className="btn btn-secondary dropdown-toggle dropdownbtn"
                    type="button"
                    onClick={() => !disabled && setIsDropdownOpen((prev) => !prev)}
                    aria-expanded={isDropdownOpen ? "true" : "false"}
                    disabled={disabled}
                >
                    {selected ? `${selected} (UTC ${getUTCOffset(selected)})` : translations.selecttimezone}
                    {isDropdownOpen ? (
                        <KeyboardArrowUpIcon className="dropdown-icon" />
                    ) : (
                        <KeyboardArrowDownIcon className="dropdown-icon" />
                    )}
                </button>
                {isDropdownOpen && (
                    <ul className="dropdown-menu dropdownul">
                        {timeZones.map((tz) => (
                            <li key={tz}>
                                <a
                                    className="dropdown-item"
                                    onClick={() => handleSelectTimeZone(tz)}
                                >
                                    {tz} (UTC {getUTCOffset(tz)})
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default TimeZone;