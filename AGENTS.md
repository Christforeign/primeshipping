<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Keep the boutique catalogue in `boutique.index.tsx` and product details in `boutique.$id.tsx` as sibling leaves; otherwise the catalogue hides checkout without an Outlet.
- Public boutique pages read active products from Lovable Cloud and show query failures explicitly; browser-local sample products must not replace the real catalogue.
- Authentication email routes use the managed SDK and bypass app redirects/CSRF; signed verification stays inside the email handler, independent of Brevo app emails.
- Authentication templates share email-safe theme tokens because email clients cannot load the site's CSS.
- Package declaration retries reuse one UUID per mounted form to avoid duplicate inserts after a lost response; shipping estimates use the current settings rate and remain provisional.
- Checkout uses a dedicated root shell without floating support controls, bottom navigation or the site footer, so its leaf route remains a standalone page.
- International platform marks use static vector assets in the shared BrandLogos module rather than approximate hand-drawn logos, preserving sharpness at small sizes.
- Cart selections persist on the current device; checkout re-reads active products and removes only the paid cart line after a successful order, preserving the remaining selections.
- Cart emails are explicitly requested by the signed-in customer, use Brevo, and derive item names from active database products rather than browser-supplied copy.
- Support and footer share the same enabled social links and configurable icon selection; official payment and messaging logo assets are reused from the shared brand modules.
- Vercel proxies only `/__l5e/assets-v1/*` to this project's verified Lovable asset host; asset pointers stay unchanged because external hosting does not provide Lovable's asset-serving infrastructure.
- The package lifecycle uses shared canonical mappings over the existing enum for backward compatibility; payment never advances physical shipping status.
- Tracking privacy is enforced by `track_package` in the database: only the owner gets private details or event notes, regardless of UI visibility.
- Package email calls derive recipient, current status and variables from the stored package and use its event ID for Brevo idempotency; all app creation and staff transition paths invoke the sender.
- Shop-order prices are recalculated atomically from active database products; custom USD amounts snapshot both rates and debit the HTG-equivalent wallet value to prevent client-forged totals.
- Order emails derive their stage, recipient and details from the saved order ID; Brevo operational alerts use configured staff recipients and link only to authenticated administration pages.
- Email logos use transparent PNG counterparts of the existing vectors because inbox clients do not reliably render SVG.
- Cart reminders are staff-triggered only: signed-in carts sync to customer_carts so admins can bulk-remind; customers no longer email their own cart.
- Customer and package deletion use authenticated database RPCs with server-enforced administrator checks and atomic cleanup; this avoids private deployment keys and prevents partial deletions.
