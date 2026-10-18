import { useEffect, useRef, useState } from 'react';
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useLocation, useNavigate } from "react-router-dom";
import { Country, State, City } from 'country-state-city';
import profilePlaceholder from '../../assets/profile-placeholder.png';
import { useLanguage } from '../../Context/LanguageContext';
import { useAuth } from '../../Middleware/Auth';
import '../../Scss/General/profile.scss';
import CheckToken from '../../utils/CheckToken';
import HandleUnauthorized from '../../utils/HandleUnauthorized';
import AlertMessage from '../Custom/AlertMessage';
import WarningModal from '../Custom/WarningModal';
import Dropdown from '../../Components/Dropdown/Dropdown';

const Profile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logoutUser } = useAuth();
    const { translations } = useLanguage();
    const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
    const tokenname = import.meta.env.VITE_AdminTOKEN_NAME;
    const token = localStorage.getItem(tokenname);
    const EmployeeId = localStorage.getItem("EmployeeID");
    const [alertMessage, setAlertMessage] = useState("");
    const [warningMessage, setWarningMessage] = useState("");
    const [showWarning, setShowWarning] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [profileData, setProfileData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        address: '',
        image: null,
        country: '',
        state: '',
        city: '',
        gender: 'Male'
    });
    const [imagePreview, setImagePreview] = useState(profilePlaceholder);
    const fileInputRef = useRef(null);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        if (translations.Profile) document.title = translations.Profile;
    }, [translations]);

    useEffect(() => {
        if (location.state && location.state.message) {
            setAlertMessage(location.state.message);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        if (location.state && location.state.warning) {
            setWarningMessage(location.state.warning);
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        const fetchAdminDetails = async () => {
            if (!CheckToken(token, logoutUser, navigate)) return;
            try {
                let endpoint = `${adminPanelBackendPath}/admin/GetAdminDetails/${EmployeeId}`;
                let response = await fetch(endpoint, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });

                const data = await response.json();
                if (HandleUnauthorized(data, logoutUser, navigate)) return;

                if (response.ok && data) {
                    const admin = data.admin || data;
                    let countryIsoCode = '';
                    let stateIsoCode = '';

                    if (admin.countryname) {
                        const allCountries = Country.getAllCountries();
                        const foundCountry = allCountries.find(c => c.name === admin.countryname);
                        if (foundCountry) {
                            countryIsoCode = foundCountry.isoCode;
                        }
                    }

                    if (admin.statename && countryIsoCode) {
                        const countryStates = State.getStatesOfCountry(countryIsoCode);
                        const foundState = countryStates.find(s => s.name === admin.statename);
                        if (foundState) {
                            stateIsoCode = foundState.isoCode;
                        }
                    }

                    setProfileData({
                        firstname: admin.firstname || admin.adminfirstname || '',
                        lastname: admin.lastname || admin.adminlastname || '',
                        email: admin.email || '',
                        phone: admin.phone || '',
                        address: admin.address || '',
                        image: admin.profileimage || admin.image || null,
                        country: countryIsoCode,
                        state: stateIsoCode,
                        city: admin.cityname || '',
                        gender: admin.gender || 'Male'
                    });
                    if (admin.profileimage) setImagePreview(admin.profileimage);
                } else {
                    const fallbackResponse = await fetch(`${adminPanelBackendPath}/System/GetGeneralSetting`, {
                        method: "GET",
                        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    });
                    const fallbackData = await fallbackResponse.json();
                    if (HandleUnauthorized(fallbackData, logoutUser, navigate)) return;

                    if (fallbackResponse.ok && fallbackData) {
                        setProfileData(prev => ({
                            ...prev,
                            email: fallbackData.email || '',
                            phone: fallbackData.phone || '',
                            address: fallbackData.address || '',
                        }));
                    }
                    setWarningMessage(translations.adminprofilenotavailable);
                    setShowWarning(true);
                }
            } catch {
                setWarningMessage(translations.servererror);
                setShowWarning(true);
            }
        };

        fetchAdminDetails();
    }, [token, adminPanelBackendPath, translations, logoutUser, navigate, EmployeeId]);

    useEffect(() => {
        const allCountries = Country.getAllCountries().map(country => ({
            isoCode: country.isoCode,
            name: country.name
        }));
        setCountries(allCountries);
    }, []);

    useEffect(() => {
        if (profileData.country) {
            const countryStates = State.getStatesOfCountry(profileData.country).map(state => ({
                isoCode: state.isoCode,
                name: state.name
            }));
            setStates(countryStates);
        } else {
            setStates([]);
            setCities([]);
        }
    }, [profileData.country]);

    useEffect(() => {
        if (profileData.country && profileData.state) {
            const stateCities = City.getCitiesOfState(profileData.country, profileData.state).map(city => ({
                name: city.name
            }));
            setCities(stateCities);
        } else {
            setCities([]);
        }
    }, [profileData.country, profileData.state]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (value) => {
        setProfileData((prev) => ({ ...prev, phone: value || '' }));

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

    const handleCountryChange = (value) => {
        setProfileData((prev) => ({ ...prev, country: value, state: '', city: '' }));
    };

    const handleStateChange = (value) => {
        setProfileData((prev) => ({ ...prev, state: value, city: '' }));
    };

    const handleCityChange = (value) => {
        setProfileData((prev) => ({ ...prev, city: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedExtensions = ['jpg', 'jpeg', 'png'];
            const fileExtension = file.name.split('.').pop().toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                setWarningMessage(translations.invalidfileextension);
                setShowWarning(true);
                e.target.value = '';
                return;
            }

            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                setWarningMessage(translations.filesizetoolarge);
                setShowWarning(true);
                e.target.value = '';
                return;
            }

            setProfileData((prev) => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleUploadClick = () => fileInputRef.current.click();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!profileData.firstname && !profileData.lastname && !profileData.email && !profileData.phone && !profileData.address) {
            setWarningMessage(translations.pleasefillatleastonefield);
            setShowWarning(true);
            return;
        }

        let isPhoneValid = true;
        if (profileData.phone && profileData.phone.trim() !== '') {
            try {
                isPhoneValid = isValidPhoneNumber(profileData.phone);
            } catch {
                isPhoneValid = false;
            }
        }

        if (profileData.phone && profileData.phone.trim() !== '' && !isPhoneValid) {
            setPhoneError(translations.invalidphonenumber);
            setWarningMessage(translations.invalidphonenumber);
            setShowWarning(true);
            return;
        }

        setPhoneError("");

        const formDataToSend = new FormData();
        if (profileData.firstname) formDataToSend.append("firstname", profileData.firstname);
        if (profileData.lastname) formDataToSend.append("lastname", profileData.lastname);
        if (profileData.email) formDataToSend.append("email", profileData.email);
        if (profileData.phone) formDataToSend.append("phone", profileData.phone);
        if (profileData.address) formDataToSend.append("address", profileData.address);
        if (profileData.gender) formDataToSend.append("gender", profileData.gender);

        if (profileData.country) {
            const selectedCountry = countries.find(c => c.isoCode === profileData.country);
            if (selectedCountry) {
                formDataToSend.append("countryname", selectedCountry.name);
            }
        }
        if (profileData.state) {
            const selectedState = states.find(s => s.isoCode === profileData.state);
            if (selectedState) {
                formDataToSend.append("statename", selectedState.name);
            }
        }
        if (profileData.city) {
            formDataToSend.append("cityname", profileData.city);
        }
        if (profileData.image) formDataToSend.append("image", profileData.image);

        try {
            let endpoint = `${adminPanelBackendPath}/admin/UpdateAdminDetails/${EmployeeId}`;
            let response = await fetch(endpoint, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formDataToSend,
            });

            const data = await response.json();

            if (response.ok) {
                setAlertMessage(data.message || translations.profileupdatedsuccessfully);
                if (data.admin?.profileimage) {
                    setImagePreview(data.admin.profileimage);
                    setProfileData((prev) => ({ ...prev, image: data.admin.profileimage }));
                }
                window.dispatchEvent(new Event("adminProfileUpdated"));
            } else {
                setWarningMessage(data.message || translations.servererror);
                setShowWarning(true);
            }
        } catch {
            setWarningMessage(translations.servererror);
            setShowWarning(true);
        }
    };

    return (
        <>
            {alertMessage && <AlertMessage message={alertMessage} onClose={() => setAlertMessage("")} />}
            {showWarning && <WarningModal message={warningMessage} onClose={() => setShowWarning(false)} />}
            <div className="Profile-container">
                <div className="profile-container">
                    <h6 className="profile-headingname">{translations.Profile}</h6>
                    <div className="profile-form-container">
                        <form onSubmit={handleSubmit}>
                            <div className='imageflex'>
                                <div className='formdiv'>
                                    <div className="form-group">
                                        <label htmlFor="firstname">{translations.firstname}</label>
                                        <input
                                            type="text"
                                            name="firstname"
                                            autoComplete='off'
                                            placeholder={translations.firstnameplaceholder}
                                            value={profileData.firstname}
                                            onChange={handleChange}
                                            onInput={(e) => (e.target.value = e.target.value.replace(/^\s+/, ""))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lastname">{translations.lastname}</label>
                                        <input
                                            type="text"
                                            name="lastname"
                                            autoComplete='off'
                                            placeholder={translations.lastnameplaceholder}
                                            value={profileData.lastname}
                                            onChange={handleChange}
                                            onInput={(e) => (e.target.value = e.target.value.replace(/^\s+/, ""))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email">{translations.Email}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            autoComplete='off'
                                            placeholder={translations.enteremail}
                                            value={profileData.email}
                                            onChange={handleChange}
                                            onInput={(e) => (e.target.value = e.target.value.replace(/^\s+/, ""))}
                                        />
                                    </div>
                                </div>
                                <div className='imagediv'>
                                    <div className="form-group">
                                        <div className='imgpreview'>
                                            {imagePreview && (
                                                <div className="image-preview-container">
                                                    <img
                                                        src={imagePreview}
                                                        alt={translations.profilepreview}
                                                        className="image-preview"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = profilePlaceholder;
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <button type="button" className="btn btn-primary upload-btn" onClick={handleUploadClick}>
                                                {translations.upload}
                                            </button>
                                            <input
                                                type="file"
                                                id="profileimage"
                                                name="image"
                                                accept="image/*"
                                                ref={fileInputRef}
                                                onChange={handleImageChange}
                                                style={{ display: "none" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group phone-group">
                                    <label>{translations.Phone}</label>
                                    <div className={`phone-input-wrapper ${phoneError ? 'has-phone-error' : ''}`}>
                                        <PhoneInput
                                            international
                                            defaultCountry="IN"
                                            value={profileData.phone}
                                            onChange={handlePhoneChange}
                                            placeholder={translations.Phone}
                                        />
                                        {phoneError && (
                                            <div className="phone-error-message">{phoneError}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{translations.gender}</label>
                                    <div className="radio-group">
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="Male"
                                                checked={profileData.gender === 'Male'}
                                                onChange={(e) => setProfileData((prev) => ({ ...prev, gender: e.target.value }))}
                                            />
                                            {translations.male}
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="Female"
                                                checked={profileData.gender === 'Female'}
                                                onChange={(e) => setProfileData((prev) => ({ ...prev, gender: e.target.value }))}
                                            />
                                            {translations.female}
                                        </label>
                                        <label className="radio-label">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="Intersex"
                                                checked={profileData.gender === 'Intersex'}
                                                onChange={(e) => setProfileData((prev) => ({ ...prev, gender: e.target.value }))}
                                            />
                                            {translations.intersex}
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="address">{translations.Address}</label>
                                    <input
                                        type="text"
                                        name="address"
                                        autoComplete='off'
                                        placeholder={translations.enteraddress}
                                        value={profileData.address}
                                        onChange={handleChange}
                                        onInput={(e) => (e.target.value = e.target.value.replace(/^\s+/, ""))}
                                    />
                                </div>
                                <div className="form-group">
                                    <Dropdown
                                        label={translations.Country}
                                        options={countries}
                                        labelKey="name"
                                        valueKey="isoCode"
                                        selectedValue={profileData.country}
                                        onValueChange={handleCountryChange}
                                        placeholder={translations.countryselect}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <Dropdown
                                        label={translations.State}
                                        options={states}
                                        labelKey="name"
                                        valueKey="isoCode"
                                        selectedValue={profileData.state}
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
                                        selectedValue={profileData.city}
                                        onValueChange={handleCityChange}
                                        placeholder={translations.cityselect}
                                    />
                                </div>
                            </div>
                            <div className="button-group">
                                <button type="submit" className="btn btn-success submit-btn">{translations.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
