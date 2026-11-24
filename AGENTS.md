# Repository Guidelines

## Project Structure & Module Organization

This is a small Node.js/Express POS and Khata app. `server.js` wires middleware, static assets, and routes. HTTP handlers are in `routes/`; business logic is in `lib/` (pricing, tax, coupons, inventory, orders, ledger, reports, invoice, dates, and JSON storage). Shop settings live in `config.js`. The browser interface is under `public/` (`index.html`, `js/app.js`, and `css/style.css`). Persistent sample data is in `data/db.json`; treat it as application data, not a test fixture to casually overwrite. Architecture reference: `docs/architecture.svg`. No test directory is present.

## Build, Test, and Development Commands

- `npm start` — starts the Express app at the configured port (3000 by default).
- `npm test` — currently a placeholder that exits with “Error: no test specified”; it does not run tests.
- No build, lint, or format scripts are defined. Install dependencies using the repository lockfile when setting up a development environment.

## Coding Style & Naming Conventions

Follow the existing CommonJS JavaScript style: two-space indentation, semicolons, single-quoted strings, and `var`. Use camelCase for functions and variables; use descriptive lowercase filenames such as `pricing.js`. Keep route handlers thin and put reusable business rules in `lib/`. Round currency consistently and keep checkout totals aligned with invoice calculations when changing pricing or tax behavior.

## Testing Guidelines

There is no configured test framework or coverage requirement. For changes to pricing, GST, coupons, inventory, cancellation, or Khata, add focused tests when introducing a test runner, and include representative cases such as capped discounts, HSN slabs, invalid quantities, and cancellation effects. Until then, describe manual verification steps in the change summary; do not treat `npm test` as meaningful validation.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase, descriptive subjects (for example, “support hsn gst slabs and coupon maxDiscount caps”). Follow that pattern and keep each commit focused. Pull requests should explain user-visible and data-impacting changes, list verification performed, and include screenshots for UI changes. Flag any changes to `data/db.json`, invoice totals, or configuration behavior for reviewer attention.

## Security & Configuration Tips

`config.js` contains shop settings and an admin key; do not add real credentials or publish sensitive customer data. The JSON store contains customer and transaction details, so protect it and make backups before operational changes. Keep configuration and data changes deliberate and reviewable.

