# DEWIFY — Google Sheets Order Backend

## Architecture

Customer GitHub Pages site → Google Apps Script Web App → Google Sheet (`DEWIFY Orders`)

No Supabase, Firebase, paid server, Google credentials, or private API key is required in the customer website.

## Files

- `index.html` — storefront + checkout
- `app.js` — cart, validation, checkout and Google Apps Script `fetch()`
- `config.js` — only the public Apps Script Web App URL
- `styles.css` — existing design
- `terms.html`, `privacy.html`, `404.html` — existing pages
- `DEWIFY-APPS-SCRIPT.gs` — copy this into Google Apps Script

The existing admin panel is intentionally not connected in this phase.
