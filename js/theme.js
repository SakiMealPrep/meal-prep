(function () {
  function applyTheme() {
    document.body.classList.toggle("dark-mode", localStorage.getItem("darkMode") === "1");
  }

  function bindToggle() {
    const toggle = document.getElementById("darkToggle");
    if (!toggle) return;

    toggle.checked = localStorage.getItem("darkMode") === "1";
    toggle.addEventListener("change", () => {
      localStorage.setItem("darkMode", toggle.checked ? "1" : "0");
      applyTheme();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applyTheme();
      bindToggle();
    });
  } else {
    applyTheme();
    bindToggle();
  }
})();
