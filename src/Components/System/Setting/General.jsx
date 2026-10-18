import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Country, State, City } from 'country-state-city';
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "../../../Scss/System/Setting/general.scss";
import { useLanguage } from '../../../Context/LanguageContext';
import { useAuth } from '../../../Middleware/Auth';
import Dropdown from '../../Dropdown/Dropdown';
import LoadingSpinner from '../../../Pages/Custom/LoadingSpinner';
import WarningModal from '../../../Pages/Custom/WarningModal';
import AlertMessage from '../../../Pages/Custom/AlertMessage';
import CheckToken from '../../../utils/CheckToken';
import HandleUnauthorized from '../../../utils/HandleUnauthorized';

const General = () => {
    const navigate = useNavigate();
    const { logoutUser } = useAuth();
    const { translations } = useLanguage();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);
    const MAX_DESCRIPTION_LENGTH = 500;
    const [loading, setLoading] = useState(true);
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [softwareName, setSoftwareName] = useState("");
    const [copyright, setCopyright] = useState("");
    const [maintainedBy, setMaintainedBy] = useState("");
    const [version, setVersion] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [description, setDescription] = useState("");
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    useEffect(() => {
        if (translations.generalsettings) document.title = translations.generalsettings;
    }, [translations]);

    useEffect(() => {
        const allCountries = Country.getAllCountries().map(country => ({
            isoCode: country.isoCode,
            name: country.name
        }));
        setCountries(allCountries);
    }, []);

    useEffect(() => {
        if (!CheckToken(token, logoutUser, navigate)) return;

        const fetchGeneralSettings = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${adminPanelBackendPath}/System/GetGeneralSetting`, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                const data = await response.json();
                if (HandleUnauthorized(data, logoutUser, navigate, response)) return;

                if (response.ok && data) {
                    setSoftwareName(data.softwarename || "");
                    setCopyright(data.copyright || "");
                    setMaintainedBy(data.maintainedby || "");
                    setVersion(data.version || "");
                    setPhone(data.phone || "");
                    setEmail(data.email || "");
                    setAddress(data.address || "");
                    setPostalCode(data.postalcode || "");
                    setDescription(data.description || "");

                    if (data.countryname) {
                        const countryMatch = Country.getAllCountries().find(c => c.name === data.countryname);
                        if (countryMatch) {
                            setSelectedCountry(countryMatch.isoCode);

                            if (data.statename) {
                                const countryStates = State.getStatesOfCountry(countryMatch.isoCode);
                                const stateMatch = countryStates.find(s => s.name === data.statename);
                                if (stateMatch) {
                                    setSelectedState(stateMatch.isoCode);

                                    if (data.cityname) {
                                        const stateCities = City.getCitiesOfState(countryMatch.isoCode, stateMatch.isoCode);
                                        const cityMatch = stateCities.find(c => c.name === data.cityname);
                                        if (cityMatch) {
                                            setSelectedCity(cityMatch.name);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch {
                setWarningMessage(translations.servererror);
                setShowWarning(true);
            } finally {
                setLoading(false);
            }
        };

        fetchGeneralSettings();
    }, [token, navigate, logoutUser, adminPanelBackendPath, translations]);

    useEffect(() => {
        if (selectedCountry) {
            const countryStates = State.getStatesOfCountry(selectedCountry).map(state => ({
                isoCode: state.isoCode,
                name: state.name
            }));
            setStates(countryStates);
        } else {
            setStates([]);
            setCities([]);
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (selectedCountry && selectedState) {
            const stateCities = City.getCitiesOfState(selectedCountry, selectedState).map(city => ({
                name: city.name
            }));
            setCities(stateCities);
        } else {
            setCities([]);
        }
    }, [selectedCountry, selectedState]);

    const handleCountryChange = (value) => {
        setSelectedCountry(value);
        setSelectedState('');
        setSelectedCity('');
    };

    const handleStateChange = (value) => {
        setSelectedState(value);
        setSelectedCity('');
    };

    const handleCityChange = (value) => {
        setSelectedCity(value);
    };

    const handlePhoneChange = (value) => {
        setPhone(value || '');

        if (!value || value.trim() === '') {
            setPhoneError("");
            return;
        }

        try {
            const isValid = isValidPhoneNumber(value);

            if (isValid) {
                setPhoneError("");
            } else {
                if (value.length >= 10) {
                    setPhoneError(translations.invalidphonenumber);
                } else {
                    setPhoneError("");
                }
            }
        } catch {
            if (value.length >= 10) {
                setPhoneError(translations.invalidphonenumber);
            } else {
                setPhoneError("");
            }
        }
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);

        if (!value || value.trim() === '') {
            setEmailError("");
            return;
        }

        if (validateEmail(value)) {
            setEmailError("");
        } else {
            setEmailError(translations.invalidemail);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!CheckToken(token, logoutUser, navigate)) return;

        let isPhoneValid = false;
        if (phone && phone.trim() !== '') {
            try {
                isPhoneValid = isValidPhoneNumber(phone);
            } catch {
                isPhoneValid = false;
            }
        }

        if (!isPhoneValid || !phone || phone.trim() === '') {
            setPhoneError(translations.invalidphonenumber);
            setWarningMessage(translations.invalidphonenumber);
            setShowWarning(true);
            return;
        }

        setPhoneError("");

        if (!email || email.trim() === '' || !validateEmail(email)) {
            setEmailError(translations.invalidemail);
            setWarningMessage(translations.invalidemail);
            setShowWarning(true);
            return;
        }

        setEmailError("");

        try {
            const selectedCountryData = countries.find(c => c.isoCode === selectedCountry);
            const selectedStateData = states.find(s => s.isoCode === selectedState);

            const settingsData = {
                softwarename: softwareName,
                copyright,
                maintainedby: maintainedBy,
                version,
                phone,
                email,
                address,
                postalcode: postalCode,
                description,
                countryname: selectedCountryData?.name || "",
                statename: selectedStateData?.name || "",
                cityname: selectedCity || ""
            };

            const response = await fetch(`${adminPanelBackendPath}/System/UpdateGeneralSetting`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(settingsData),
            });

            const data = await response.json();
            if (HandleUnauthorized(data, logoutUser, navigate, response)) return;

            if (response.ok) {
                setSuccessMessage(translations.updategeneralsettingssuccessfull);
            } else {
                const errorMessages = {
                    "Server error": translations.servererror,
                    "All fields are required": translations.allfieldrequired
                };
                setWarningMessage(errorMessages[data.message] || data.message || translations.servererror);
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        }
    };

    const handleWarningClose = () => setShowWarning(false);
    const handleCloseAlert = () => setSuccessMessage("");

    return (<>
        {showWarning && <WarningModal message={warningMessage} onClose={handleWarningClose} />}
        {successMessage && <AlertMessage message={successMessage} onClose={handleCloseAlert} />}
        <div className="General-container">
            {loading ? (
                <LoadingSpinner />
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className='form-row'>
                        <div className="form-group">
                            <label htmlFor="softwareName">{translations.softwarename}</label>
                            <input
                                type="text"
                                id="softwareName"
                                className="form-control"
                                placeholder={translations.entersoftwarename}
                                autoComplete="off"
                                value={softwareName}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length === 1 && value === " ") return;
                                    setSoftwareName(value);
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">{translations.Email}</label>
                            <input
                                type="email"
                                id="email"
                                className={`form-control ${emailError ? 'is-invalid' : ''}`}
                                placeholder={translations.enteremail}
                                autoComplete="off"
                                value={email}
                                onChange={handleEmailChange}
                                required
                            />
                            {emailError && (
                                <div className="invalid-feedback">{emailError}</div>
                            )}
                        </div>
                    </div>
                    <div className='form-row'>
                        <div className="form-group phone-group">
                            <label>{translations.Phone}</label>
                            <div className={`phone-input-wrapper ${phoneError ? 'has-phone-error' : ''}`}>
                                <PhoneInput
                                    international
                                    placeholder={translations.phonenumberplaceholder}
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    defaultCountry="IN"
                                    required
                                />
                                {phoneError && (
                                    <div className="phone-error-message">{phoneError}</div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="version">{translations.Version}</label>
                            <input
                                type="text"
                                id="version"
                                className="form-control"
                                placeholder={translations.enterversion}
                                autoComplete="off"
                                value={version}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length === 1 && value === " ") return;
                                    setVersion(value);
                                }}
                            />
                        </div>
                    </div>
                    <div className='form-row'>
                        <div className="form-group">
                            <label htmlFor="copyright">{translations.Copyright}</label>
                            <input
                                type="text"
                                id="copyright"
                                className="form-control"
                                placeholder={translations.entercopyright}
                                autoComplete="off"
                                value={copyright}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length === 1 && value === " ") return;
                                    setCopyright(value);
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="maintainedBy">{translations.MaintainedBy}</label>
                            <input
                                type="text"
                                id="maintainedBy"
                                className="form-control"
                                placeholder={translations.entermaintainedby}
                                autoComplete="off"
                                value={maintainedBy}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length === 1 && value === " ") return;
                                    setMaintainedBy(value);
                                }}
                            />
                        </div>
                    </div>
                    <div className='form-row'>
                        <div className="form-group">
                            <label htmlFor="address">{translations.Address}</label>
                            <input
                                type="text"
                                id="address"
                                className="form-control"
                                placeholder={translations.enteraddress}
                                autoComplete="off"
                                value={address}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length === 1 && value === " ") return;
                                    setAddress(value);
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <Dropdown
                                label={translations.Country}
                                options={countries}
                                labelKey="name"
                                valueKey="isoCode"
                                selectedValue={selectedCountry}
                                onValueChange={handleCountryChange}
                                placeholder={translations.countryselect}
                            />
                        </div>
                    </div>
                    <div className='form-row form-row-three'>
                        <div className="form-group">
                            <Dropdown
                                label={translations.State}
                                options={states}
                                labelKey="name"
                                valueKey="isoCode"
                                selectedValue={selectedState}
                                onValueChange={handleStateChange}
                                placeholder={translations.stateselect}
                            />
                        </div>
                        <div className="form-group">
                            <Dropdown
                                label={translations.City}
                                options={cities}
                                labelKey="name"
                                valueKey="name"
                                selectedValue={selectedCity}
                                onValueChange={handleCityChange}
                                placeholder={translations.cityselect}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="postalCode">{translations.PostalCode}</label>
                            <input
                                type="text"
                                id="postalCode"
                                className="form-control"
                                placeholder={translations.enterpostalcode}
                                autoComplete="off"
                                value={postalCode}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value.length === 1 && value === " ") return;
                                    setPostalCode(value);
                                }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">{translations.Description}</label>
                        <textarea
                            id="description"
                            name="description"
                            className="form-control"
                            placeholder={translations.enterdescription}
                            autoComplete="off"
                            value={description}
                            rows={4}
                            maxLength={MAX_DESCRIPTION_LENGTH}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value.length === 1 && value === " ") return;
                                if (value.length <= MAX_DESCRIPTION_LENGTH) {
                                    setDescription(value);
                                }
                            }}
                        />
                        <div className={`description-counter ${description.length >= MAX_DESCRIPTION_LENGTH ? 'max-reached' : ''}`}>
                            {description.length}/{MAX_DESCRIPTION_LENGTH}
                        </div>
                    </div>
                    <div className="button-group">
                        <button type="submit" className="btn btn-success submit-btn">{translations.update}</button>
                    </div>
                </form>
            )}
        </div>
    </>);
}

export default General;