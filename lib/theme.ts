// Plain module (no "use client"), so the root server layout can inline the
// script below: a constant exported from a client module reaches a server
// component as a client reference, not as the string.

/** design.md persists the choice as one of these three. */
export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "malaysianai-theme";

/**
 * Runs in <head> before first paint, so a stored choice is on <html> before any
 * colour resolves. "system" leaves the attribute off, and every `light-dark()`
 * token then follows the OS on its own.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}})();`;
