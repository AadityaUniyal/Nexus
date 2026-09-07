# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-09-07

### Added
- GitHub Actions CI pipeline for backend tests and frontend build
- React Query integration for data fetching and state management
- Real JWT token based authentication flow
- `QueryProvider` wrapper in the root layout
- Contact form state management and API integration
- Feedback form state management and API integration

### Changed
- Vercel configuration for Next.js monorepo deployment
- Environment variables documentation in `.env.example`
- Updated auth login endpoint to support real database verification and JWT generation
- Replaced mock authentication in the frontend with real API calls to the backend
- Updated `AuthProvider` to use localStorage JWT and handle token decoding/expiry

### Fixed
- Authentication login flow to actually verify against bcrypt hashed passwords

### Removed
- Fake token logic (`nxtok_` + Date.now()) in frontend

### Security
- Replaced insecure mock authentication with secure JWT based authentication
- Enforced password verification against bcrypt hashes
