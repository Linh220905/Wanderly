---
name: Wanderly architecture
description: Durable product decisions for the Wanderly mobile MVP.
---

Wanderly’s first working mobile build is Expo-based and local-first. The user-facing flow is intentionally complete before production services are connected: onboarding answers, gate completion, exploration progress, sessions, rewards, and premium choice persist locally.

**Why:** No native iOS repository or production backend existed when implementation began, so a reliable mobile preview and testable product flow were more valuable than blocking on external credentials.

**How to apply:** Preserve the gate order and local-first behavior when adding real authentication, StoreKit, GPS route validation, and cloud sync; migrate local records idempotently instead of replacing them.