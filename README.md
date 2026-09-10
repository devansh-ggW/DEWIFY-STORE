# DEWIFY Store + Google Sheets Orders

The storefront keeps the existing DEWIFY design, products, cart and animations.

Orders are submitted with `fetch()` to a Google Apps Script Web App. The Apps Script validates the payload, creates a unique Order ID, and appends the order to the `DEWIFY Orders` sheet.

## Customer order flow

GitHub Pages → Google Apps Script → Google Sheet

Supabase has been removed from the customer storefront. No Google credentials are stored in frontend files.

See `SETUP-GOOGLE-SHEETS.md` and `DEWIFY-APPS-SCRIPT.gs`.
