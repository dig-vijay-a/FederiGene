import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
        welcome_title: "FederiGene",
        dashboard: "Dashboard",
        training: "Training Jobs",
        marketplace: "Marketplace",
        security: "Security Overview",
        admin_tools: "Admin Tools",
        logout: "Logout",
        search_placeholder: "Search modules...",
        equilibrium_index: "Equilibrium Index"
    },
    de: {
        welcome_title: "FederiGene",
        dashboard: "Instrumententafel",
        training: "Schulungsaufträge",
        marketplace: "Marktplatz",
        security: "Sicherheitsübersicht",
        admin_tools: "Admin-Tools",
        logout: "Abmelden",
        search_placeholder: "Module suchen...",
        equilibrium_index: "Gleichgewichtsindex"
    }
};

interface LanguageContextType {
    lang: string;
    setLang: (lang: string) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState<string>(() => localStorage.getItem('app-lang') || 'en');

    useEffect(() => {
        localStorage.setItem('app-lang', lang);
    }, [lang]);

    const t = (key: string) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) ? TRANSLATIONS[lang][key] : key;

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => useContext(LanguageContext);
