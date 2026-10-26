import { themeRegistry } from "../src/theme/registry";

export const labelForThemeKey = (key: string) =>
  key in themeRegistry
    ? themeRegistry[key as keyof typeof themeRegistry].label
    : key.replaceAll("_", " ");
