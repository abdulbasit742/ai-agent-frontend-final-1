# Changed-area security audit

## Improvements

- Canonical, validated HTTP(S) API URL with support for earlier variable names.
- Embedded URL credentials are rejected.
- Browser JWTs use session storage and malformed cached user data fails closed.
- Concurrent expired requests share one refresh operation instead of creating a refresh storm.
- Login and refresh failures cannot recurse through the interceptor.
- Cached sessions are validated against the backend before protected content renders.
- Predictable demo-account buttons and passwords were removed.
- Server exception details are not surfaced by the client error helper.
- Vercel applies clickjacking, MIME-sniffing, referrer, camera, microphone, and geolocation restrictions.
- CI runs lint, tests, tracked-file credential checks, and a production build.

## Residual risks

- Any token available to JavaScript can be stolen by a successful XSS attack. A future backend revision should prefer Secure, HttpOnly, SameSite cookies.
- The root `.env` remains tracked because the repository write safety gate rejected deletion. It now contains only one public `VITE_API_URL`; the repository check rejects non-public keys in tracked environment files.
- Browser security headers should also be configured at any hosting provider used instead of Vercel.
