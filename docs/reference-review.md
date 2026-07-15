# Comparable repository review

## 1. makeplane/plane

Plane demonstrates a strong task-management information hierarchy: summary analytics, status-oriented views, filters, and work-item details. Adopted here: summary cards, completion rate, status filters, search, and task-focused empty states.

## 2. refinedev/refine

Refine separates routing, authentication, and data-provider concerns so protected resources do not render before authentication is resolved. Adopted here: explicit loading/authenticated/anonymous route states and backend validation of cached sessions.

## 3. satnaing/shadcn-admin

Shadcn Admin emphasizes responsive and accessible dashboard composition using Vite, Tailwind, Radix, and reusable UI primitives. Adopted here: responsive app shell, keyboard-visible controls, semantic status regions, compact mobile actions, and consistent cards.

## Deliberately not adopted

- No framework migration or new state-management library.
- No copied source code or visual branding.
- No nonfunctional AI, notification, or edit buttons.
- No persistence of browser tokens beyond the current tab.
