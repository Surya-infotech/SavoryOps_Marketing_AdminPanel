import { useEffect } from 'react';
import { useAuth } from '../../Middleware/Auth';
import { useLanguage } from '../../Context/LanguageContext';

const Logout = () => {
    const { logoutUser } = useAuth();
    const { translations } = useLanguage();
    const URL = import.meta.env.VITE_URL;

    useEffect(() => {
        logoutUser();
        const message = encodeURIComponent(translations.signoutsuccessful);
        window.location.href = `${URL}?message=${message}`;
    }, [logoutUser, translations, URL]);

    return null;
}

export default Logout;