import { createContext, useContext } from "react";
import { THEMES } from "../styles/themes";

export const ThemeContext = createContext(THEMES.dark);
export const useTheme = () => useContext(ThemeContext);
