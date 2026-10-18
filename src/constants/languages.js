const LANGUAGE_OPTIONS = [
    { name: 'English', code: 'GB' },
];

export const isRtlLanguage = (lang) => {
    if (!lang) return false;
    const lower = String(lang).trim().toLowerCase();
    return lower === 'arabic' || lower === 'ar' || lower === 'sa';
};

export const getLanguageOptions = () => [...LANGUAGE_OPTIONS].sort((a, b) => a.name.localeCompare(b.name));

export default LANGUAGE_OPTIONS;