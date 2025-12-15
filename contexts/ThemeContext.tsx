
import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => { },
    setTheme: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState<Theme>(systemScheme === 'dark' ? 'dark' : 'light');

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
