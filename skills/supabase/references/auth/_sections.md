# Section Definitions

Reference files are grouped by prefix. Claude loads specific files based on user
queries.

---

## 1. Core Authentication (core)

**Impact:** CRITICAL
**Description:** Sign-up, sign-in, sign-out, password reset, and session management. Foundational flows that every auth implementation requires.

## 2. OAuth & Social Login (oauth)

**Impact:** HIGH
**Description:** Social provider configuration, PKCE flow for SPAs, provider-specific setup including Google, GitHub, Apple, and enterprise providers.

## 3. Enterprise SSO (sso)

**Impact:** MEDIUM
**Description:** SAML 2.0 configuration, attribute mapping, identity provider setup. For enterprise customers with existing IdPs.

## 4. Multi-Factor Authentication (mfa)

**Impact:** HIGH
**Description:** TOTP (authenticator apps) and Phone MFA setup. AAL levels, enrollment flows, and verification patterns.

## 5. Passwordless (passwordless)

**Impact:** MEDIUM-HIGH
**Description:** Magic links, email OTP, and phone OTP flows. Modern authentication without passwords.

## 6. Auth Hooks (hooks)

**Impact:** HIGH
**Description:** Custom JWT claims via access token hook, custom email/SMS via send hooks. Extends auth behavior without forking.

## 7. Server-Side Auth (server)

**Impact:** CRITICAL
**Description:** Admin API with service role, SSR patterns for Next.js/SvelteKit/Nuxt, secure token handling on the server.
