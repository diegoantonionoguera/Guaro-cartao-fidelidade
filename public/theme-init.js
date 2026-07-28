(function initializeTheme() {
  const storedTheme = localStorage.getItem('guaro-theme');
  const theme = storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : 'dark';

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}());
