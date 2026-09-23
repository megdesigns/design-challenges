// Apply the saved theme before first paint to avoid a flash of the wrong colors.
try {
  const theme = localStorage.getItem("dcg:theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
} catch {}
