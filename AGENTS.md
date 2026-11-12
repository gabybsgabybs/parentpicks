<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Keep the public home examples illustrative and separate from private group data; keep board grid rules (score, top pick, split, thin items, category groups) in the pure `src/lib/category-overview.ts` so they stay testable.
- Chat exports are parsed in the browser and sent to server functions in chunks; the raw file is never stored — only extracted mentions with SHA-256 sender hashes (privacy requirement).
- AI calls live in `src/lib/pipeline.functions.ts` (admin-checked via `is_admin` RPC, writes via service client); provider counts are recomputed only by the `recompute_provider` SQL function so "one opinion per parent" stays in one place.
- Access is per neighborhood via `memberships` + `is_member`/`is_admin` security-definer functions; `mentions.sender_hash` is excluded from column grants so it never reaches clients.
- Admin review mutations use the neighborhood-checked `admin_manage_review` SQL function to edit/delete a single mention and call `recompute_provider` atomically; admin review reads project anonymous fields only.
- Provider contact info (website/phone/address/booking) comes only from AI web search in `lookupContacts`, run after uploads or from Review; brand/store categories store website only (`websiteOnly` in categories.ts) so the rule lives in one place.
- Tips are one-time with no product catalog: the session is built in `src/lib/tip.functions.ts` from inline `price_data`, and the cash-donation tax code must stay paired with the compliance-handling opt-out, because that code is ineligible for the account's default end-to-end handling.
- "Ask the Village" chat (floating widget on the board, `src/lib/village-chat.functions.ts`) is one saved conversation per user per neighborhood in `village_chat`; answers are grounded only in retrieved published 2+ parent places, never general knowledge.
- Parent submissions go to `parent_suggestions` (pending) and are approved only via the admin-checked `admin_resolve_suggestion` SQL function, which matches/creates the provider, inserts an app: mention and calls recompute_provider — keeps moderation atomic.
