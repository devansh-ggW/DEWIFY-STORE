# DEWIFY ADMIN

Standalone prototype admin dashboard for the DEWIFY ecommerce project.

## Run

No Node/npm/build step is required.

Open `admin.html` in a modern browser.

For best testing, serve the folder from a simple local/static server if your browser restricts local file behavior. GitHub Pages also works.

## Current prototype

- Premium responsive dark admin UI
- Overview dashboard
- Orders list
- Search by customer, phone, email, order ID
- Status filters
- Order detail drawer
- Status changes: NEW → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- CANCELLED status
- Demo order deletion
- Customer contact copy
- Product catalog preview
- Settings/system notes
- Demo data reset
- localStorage persistence using `dewify-orders-v1`

## Important

This is intentionally a frontend-only prototype.

`localStorage` is NOT a real database. Data is browser/device-specific and should not be used for production orders.

Production architecture:

Customer Store → Backend API → Database → DEWIFY ADMIN

Later, payment verification should happen server-side using a payment provider webhook/API. Never trust a browser-side "payment successful" state.

WhatsApp should remain an optional notification/contact channel, not the ordering system.

## Storefront integration

The future storefront should write the same order object shape to `dewify-orders-v1` only for prototype testing. Once a backend exists, both applications should use the backend API instead of localStorage.
