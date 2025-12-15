
import React, { createContext, useContext, useState } from 'react';
import { Translations } from '../constants/Translations';

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
    const [language, setLanguage] = useState<Language>('uz');

    const i18n = Translations[language];

    return (
        <LanguageContext.Provider value={{ language, setLanguage, i18n }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
