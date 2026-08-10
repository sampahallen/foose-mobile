# foose-mobile

> Lives in the `mobile/` directory; the project/package itself is named `foose-mobile`.

Expo (SDK 57) React Native app for the Foose / ThriftGH marketplace, styled with NativeWind and
wired to the same `backend/` Express + Socket.IO API as `frontend/`. The UI is a native port of the
web app's mobile breakpoint — same five bottom tabs, same design tokens, same API envelope.

## Getting started

```bash
npm install
npm start          # Expo dev server (press a/i, or scan the QR in Expo Go)
npm run android
npm run ios        # macOS only
npm run web
```

The backend must be running separately (`cd ../backend && npm run dev`, default port 5000).

### Pointing the app at the backend

In development you normally need **no configuration**. `src/config/env.ts` reads the Expo packager's
`hostUri`, which is the dev machine's LAN address, and calls `http://<that host>:5000/api`. That is
what makes a physical phone work — `localhost` on a phone means the phone itself.

Override when you need to (copy `.env.example` to `.env`):

```
EXPO_PUBLIC_API_BASE_URL=https://api.example.com/api
```

`EXPO_PUBLIC_API_BASE_URL` must include the `/api` prefix, matching the mounts in
`backend/src/app.js`. The Socket.IO origin is derived from it (or set `EXPO_PUBLIC_SOCKET_URL`).
For a release build, set `expo.extra.apiBaseUrl` in `app.json` or supply the env var at build time.

## Checks

```bash
npm run lint       # ESLint (eslint-config-expo)
npm run typecheck  # tsc --noEmit
npm run ci         # both
```

There is no test suite yet.

## What is in the app

| Area | Screens |
| --- | --- |
| Tabs | Home, Browse, Community (Finspo + events), Saved, Inbox |
| Marketplace | Listing detail, shop page, search, cart, checkout |
| Orders | Buying list (active/history), order detail with buyer actions |
| Social | Finspo post, event detail, chat thread |
| Account | Login, register, profile, settings |

Seller tooling (DigiShop setup, listing management, KYC, payouts, promotions, dispute reports with
evidence upload) is intentionally **not** ported — those flows live on the web app, and the mobile
screens link out to them rather than half-implementing them.

## Structure

```
src/
  app/            expo-router file routes; (tabs)/ holds the five bottom-tab screens
  components/     auth/ feedback/ layout/ marketplace/ ui/
  config/env.ts   all EXPO_PUBLIC_* access
  constants/      roles.ts, palette.ts (hex mirror of the CSS variables)
  context/        Auth, Cart, Messaging, Theme providers (+ their bare context modules)
  hooks/          useApiResource, useInfiniteApiResource, useAuth, useCart, useMessaging, …
  lib/api/        client + token storage; the only path for REST calls
  types/api.ts    verbatim copy of frontend/src/types/api.ts
  utils/          format, errorMessage, orderStatus, promotions, …
  global.css      Tailwind entry + the light/dark design tokens
```

See `AGENTS.md` for the conventions that matter when changing this app.
