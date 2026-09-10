// DEWIFY Google Sheets configuration.
// Replace only the Web App URL below. Never put Google credentials here.
window.DEWIFY_CONFIG = {
  GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzt_qkckLmkAcAm10Wq1po9myzGh2SoPq-iQp01luZ_8drEobg4Z-LUMHpt13QR-Q0iQg/exec"
};

window.DEWIFY_CONFIGURED =
  typeof window.DEWIFY_CONFIG.GOOGLE_APPS_SCRIPT_URL === "string" &&
  window.DEWIFY_CONFIG.GOOGLE_APPS_SCRIPT_URL.startsWith("https://script.google.com/macros/s/");
