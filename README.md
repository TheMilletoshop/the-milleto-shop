# The Milleto — starter webshop

A beginner-friendly custom-coded storefront for local pickup in Wageningen. It includes a basket, a server-side Mollie payment creation endpoint, a Mollie webhook that verifies payment status, and a Cloudflare D1 order table.

## Before you start

- You need a free Cloudflare account and a GitHub account.
- Create a Mollie account and use a **test API key first**. Never put the key in `app.js`, HTML, CSS, GitHub, or any file that visitors can download.
- The four prices in this starter are example prices of €4.50 per pack. Change them in **both** `app.js` and `functions/api/create-payment.js` before launch.
- Replace the placeholder contact address and email in `privacy.html`, and the example email in `index.html`.
- This starter does not send confirmation emails automatically. Check paid orders in the D1 database and Mollie dashboard; contact customers manually until you add a secure email service.
- The order-status page shows payment status only. It does not expose customer details.

## 1. Create a GitHub repository

1. Sign in to GitHub and create a new repository named `the-milleto-shop`.
2. Upload all files and folders from this project. The `functions` folder must be at the project root.
3. Do not upload any `.env` file or API keys.

## 2. Create a Cloudflare Pages project

1. Sign in to Cloudflare.
2. Open **Workers & Pages** and choose **Create** / **Pages** (the wording may vary).
3. Connect your GitHub repository `the-milleto-shop`.
4. For a plain HTML site, set the build command to blank / none and the build output directory to `.`. If the dashboard rejects `.`, follow Cloudflare's current static Pages instructions; keep the HTML files at the deployed output root.
5. Deploy. Cloudflare will give you a `*.pages.dev` URL.

Cloudflare Pages static asset requests are free on the free plan. Function requests use the Workers Free plan limits. Check current plan limits and terms before launch.

## 3. Create your D1 order database

1. In Cloudflare, go to **Storage & databases → D1 SQL database** (labels may vary).
2. Create a database named `the-milleto-orders`.
3. Open the database's SQL console and run the complete contents of `schema.sql`.
4. Copy the database ID.
5. In your GitHub repository, edit `wrangler.toml`: replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with the real ID.
6. Commit the change and let Cloudflare redeploy.
7. In your Pages project settings, check **Bindings** and confirm a D1 binding named `DB` points to `the-milleto-orders`. Add it if needed, then redeploy.

## 4. Add the Mollie secret

1. In Mollie, finish the account/profile verification steps and find your **test API key**.
2. In Cloudflare Pages project settings, open **Settings → Variables and Secrets** (or Functions environment variables).
3. Add `MOLLIE_API_KEY` as a **secret**, using the Mollie test key (`test_...`).
4. Redeploy so the function receives the secret.

Do not paste the API key into chat or commit it to GitHub.

## 5. Test checkout before going live

1. Open your `*.pages.dev` site and add a few packs to the basket.
2. Enter your own test name/email and continue to payment.
3. Mollie should open its hosted test checkout. Complete a test payment using Mollie's current test instructions.
4. Return to `success.html`; the status may take a short moment to update.
5. In the Cloudflare D1 console, inspect the `orders` table. Confirm that the order, amount, payment ID and status were saved.
6. In Mollie, verify the test payment and its metadata. The webhook URL is automatically set to `https://YOUR-SITE.pages.dev/api/mollie-webhook`.

If payment starts but the status doesn't update, check that the deployed function route exists, the secret is set, and the webhook URL is publicly accessible. Use Cloudflare function logs to debug; never reveal API keys in logs.

## 6. Before taking real orders

- Change the example prices in `app.js` and `functions/api/create-payment.js` to match your real products and pack size.
- Add actual product photos, ingredients, allergens, net weight, storage advice and shelf-life information. Only call products gluten-free if your ingredients and process support that claim.
- Complete the privacy notice with your real legal/business details, lawful basis, retention periods, and provider information. Add terms of sale, pickup/cancellation/refund policy, contact details and any required business registration details.
- Verify the current requirements for selling food online in the Netherlands, including NVWA registration and pre-purchase allergen information.
- Test failure, cancellation, repeat clicks, mobile layout and webhook updates.
- After testing, replace the test key with the Mollie **live** API key in Cloudflare Secrets, then redeploy. Do not use a live key until you have completed your checks.
- Confirm the live iDEAL/Wero method is enabled in your Mollie profile and verify the current fees directly with Mollie.

## How prices are kept safe

The browser sends product IDs and quantities only. The server calculates prices from its own catalogue; it does not trust prices sent by the browser. Payment status is fetched from Mollie by the webhook before the order status is updated.

## Limitations in this starter

- No automatic order-confirmation emails.
- No admin dashboard; use the Cloudflare D1 console to inspect orders.
- No pickup-slot availability calendar; the pickup preference is a free-text request and must be confirmed manually.
- No VAT/accounting calculations or inventory controls.
- The public site is a starter, not a legal/compliance review.
