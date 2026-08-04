# Auth

Google OAuth through Supabase Auth, session lifecycle, and authorization helpers.

- `actions.ts` starts Google OAuth and signs the current user out.
- `redirects.ts` validates local post-auth redirect targets.
- `profile.ts` maps the private database profile and trusted Auth metadata to a
  presentation model.
- Supabase browser/server clients and the session proxy live in
  `src/lib/supabase`.
- The database owns profile creation and provider metadata synchronization; see
  `docs/decisions/001-auth-profile-sync.md`.

No module in this feature may use a Supabase service-role key. Authorization is
enforced by the signed-in session together with database RLS.
