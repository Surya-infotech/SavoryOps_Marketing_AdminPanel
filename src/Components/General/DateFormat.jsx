import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useEffect, useRef, useState } from "react";
import "../../Scss/Custom/General/dropdown.scss";
import { useLanguage } from "../../Context/LanguageContext";

const DateFormat = ({ selectedDateFormat, onFormatChange }) => {
    const { translations } = useLanguage();
    const dateFormats = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD", "MMMM DD, YYYY"];
    const [selectedFormat, setSelectedFormat] = useState(selectedDateFormat || "");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleDropdownToggle = () => setIsDropdownOpen((prev) => !prev);

    const handleFormatSelect = (format) => {
        setSelectedFormat(format);
        setIsDropdownOpen(false);
        onFormatChange(format);
    };

    useEffect(() => {
        setSelectedFormat(selectedDateFormat);
    }, [selectedDateFormat]);

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
            <label>{translations.dateformat}</label>
            <div className="dropdown" ref={dropdownRef}>
                <button
                    className="btn btn-secondary dropdown-toggle dropdownbtn"
                    type="button"
                    onClick={handleDropdownToggle}
                    aria-expanded={isDropdownOpen ? "true" : "false"}
                >
                    {selectedFormat || translations.selectdateformat}
                    {isDropdownOpen ? (
                        <KeyboardArrowUpIcon className="dropdown-icon" />
                    ) : (
                        <KeyboardArrowDownIcon className="dropdown-icon" />
                    )}
                </button>
                {isDropdownOpen && (
                    <ul className="dropdown-menu dropdownul" aria-labelledby="dropdownMenuButton">
                        {dateFormats.map((format, index) => (
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

export default DateFormat;