import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useEffect, useRef, useState } from "react";
import "../../Scss/Custom/General/dropdown.scss";
import { useLanguage } from "../../Context/LanguageContext";

const TimeFormat = ({ selectedTimeFormat, onFormatChange }) => {
    const { translations } = useLanguage();
    const timeFormats = ["hh:mm:ss A", "HH:mm:ss", "hh:mm A", "HH:mm"];
    const [selected, setSelected] = useState(selectedTimeFormat || "");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleDropdownToggle = () => setIsDropdownOpen((prev) => !prev);

    const handleFormatSelect = (format) => {
        setSelected(format);
        onFormatChange(format);
        setIsDropdownOpen(false);
    };

    useEffect(() => {
        setSelected(selectedTimeFormat);
    }, [selectedTimeFormat]);

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

    return (
        <div>
            <label>{translations.timeformat}</label>
            <div className="dropdown" ref={dropdownRef}>
                <button
                    className="btn btn-secondary dropdown-toggle dropdownbtn"
                    type="button"
                    onClick={handleDropdownToggle}
                    aria-expanded={isDropdownOpen ? "true" : "false"}
                >
                    {selected || translations.selecttimeformat}
                    {isDropdownOpen ? (
                        <KeyboardArrowUpIcon className="dropdown-icon" />
                    ) : (
                        <KeyboardArrowDownIcon className="dropdown-icon" />
                    )}
                </button>
                {isDropdownOpen && (
                    <ul className="dropdown-menu dropdownul" aria-labelledby="dropdownMenuButton">
                        {timeFormats.map((format, index) => (
                            <li key={index}>
                                <a
                                    className="dropdown-item"
                                    onClick={() => handleFormatSelect(format)}
                                >
                                    {format}
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default TimeFormat;