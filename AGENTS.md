# mobile — working notes

Expo SDK 57 / React Native 0.86 / React 19.2 / expo-router 57 / NativeWind 4.2 (Tailwind **v3**).

Read `README.md` first for commands and layout. This file records the decisions that are easy to
break.

## Relationship to the other apps

This is a **fourth independent git repository** in the workspace, alongside `backend/`, `frontend/`,
and `admin-frontend/`. Run `git` commands from inside `mobile/`.

It is a native port of `frontend/`'s mobile breakpoint against the same backend. When a shared
concept changes, both apps must change:

- `src/types/api.ts` is a **verbatim copy** of `frontend/src/types/api.ts`. Edit it there, then copy
  it across — do not reformat it locally (ESLint's `array-type` rule is disabled for that one file
  so the copy stays byte-identical).
- The `success/error` envelope is unwrapped in `src/lib/api/client.ts`, same as the web client.
  Changing the envelope shape means changing three frontends.
- Money is always integers in **pesewas**; only `formatMoney` divides.
- Endpoint paths must stay aligned with the mounts in `backend/src/app.js`.

## Styling

- NativeWind v4 requires **Tailwind v3**, not the v4 that `frontend/` uses. Do not "upgrade"
  `tailwindcss` here without moving to NativeWind v5.
- Design tokens live twice, on purpose:
  - `src/global.css` — CSS variables as `R G B` channel triplets so `bg-accent/70` works. `:root` is
    light, `.dark:root` is dark (NativeWind's class strategy, `darkMode: 'class'`).
  - `src/constants/palette.ts` — the same colours as hex, for React Native props that cannot take a
    class: `placeholderTextColor`, icon `color`, `ActivityIndicator`, `Tabs`/`Stack` options.
  Change a colour in `frontend/src/index.css` and you must update **both** files here.
- `foose-ink` is deliberately not themed — it is for icons on white chips floating over photos.
- Theme preference (light/dark/system) is persisted in `ThemeContext` via NativeWind's
  `colorScheme.set()`. There is no `[data-theme]` attribute on native.

## Routing

- expo-router, file-based, under `src/app`. The five bottom tabs are `src/app/(tabs)`.
- `experiments.typedRoutes` is **off**. The app navigates with query strings
  (`/browse?q=…`, `/chat/new?receiverId=…`) and the generated `Route<T>` union rejects a search
  string on a static route. Turning typed routes back on means converting those call sites to the
  `{ pathname, params }` object form first.
- There is no web-style `AuthRequired` redirect: a tab can be selected at any time, so
  `components/auth/AuthRequired.tsx` renders a sign-in prompt **in place** and keeps the tab bar
  usable.

## Auth and tokens

- Tokens live in SecureStore (Keychain/Keystore) on device, AsyncStorage on web. Because neither is
  synchronous, `src/lib/api/tokens.ts` caches them in memory: **`hydrateTokens()` must run before the
  first authenticated request** (`AuthProvider` does this during boot).
- The client refreshes on a 401 with a **single-flight** guard. The backend rotates the refresh token
  on use, so parallel requests must not each try to redeem it. A failed refresh clears storage and
  fires `onSessionExpired`, which `AuthContext` subscribes to.

## React Compiler

`experiments.reactCompiler` is on, which turns two lint rules into errors:

- `react-hooks/set-state-in-effect` — effects must not call `setState` synchronously. The idiom used
  throughout (and in `frontend/src/hooks/useApiResource.ts`) is to wrap the update in
  `queueMicrotask`. Do not "simplify" those away; lint will fail.
- Impure calls (`Date.now`, `Math.random`) must not run in a component body. Put them in a
  module-scope helper or a lazy `useState` initializer — see `createFeedSeed` in `(tabs)/browse.tsx`
  and `createOrderIdempotencyKey` in `order/[id].tsx`.

## Payments

The web app uses Paystack's inline JS SDK, which does not exist on native. Checkout instead opens
the hosted page (`https://checkout.paystack.com/<accessCode>`) with `expo-web-browser`, then posts
`/payments/:reference/actions/verify`. The `foose://` scheme in `app.json` is the return URL.

## Realtime

`MessagingContext` connects Socket.IO with the access token. The backend only joins a socket to the
chat room when the account's email is verified, so chat listeners are attached conditionally; the
notification room is always joined. Sending prefers the socket (`send-message`) and falls back to
`POST /chat`. Conversation messages come back newest-first, which is why threads use an `inverted`
FlatList with no reversing.

## Deliberately not ported

DigiShop setup, listing create/edit, KYC, payouts/wallet ledger, promotions checkout, event
management, Finspo posting, and order dispute reports with evidence upload. These need file uploads
and long forms; the mobile screens point at the web app instead. If you add one, add it as a real
screen — do not bolt a WebView onto the tab bar.
