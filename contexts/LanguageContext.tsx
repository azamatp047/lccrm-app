
import React, { createContext, useContext, useState } from 'react';
import { Translations } from '../constants/Translations';
import { setApiLanguage } from '../services/api';

type Language = 'uz' | 'ru' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    i18n: typeof Translations['uz'];
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'uz',
    setLanguage: () => { },
    i18n: Translations['uz'],
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('uz');

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        setApiLanguage(lang);
    };

    const i18n = Translations[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, i18n }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
