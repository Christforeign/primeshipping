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
