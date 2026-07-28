const THEME_STORAGE_KEY = 'guaro-theme';
const THEME_COLORS = {
    dark: '#161616',
    light: '#F5F5F5'
};

export function getTheme() {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme, { persist = true } = {}) {
    const nextTheme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', THEME_COLORS[nextTheme]);
    if (persist)
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
        const isDark = nextTheme === 'dark';
        button.setAttribute('aria-checked', String(isDark));
        button.setAttribute('aria-label', isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro');
        button.setAttribute('title', isDark ? 'Usar modo claro' : 'Usar modo escuro');
    });
}

applyTheme(getTheme(), { persist: false });
