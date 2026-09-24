# 🔒 Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

---

## Reporting a Vulnerability

If you discover a potential security vulnerability in NEXUS, please report it to our security team.

### Reporting Process
1. Email security vulnerability details to `security@nexus.platform`.
2. Include a detailed description of the vulnerability, steps to reproduce, and any proof-of-concept scripts.
3. Please do **NOT** publicly disclose the issue until we have investigated and deployed a fix.

### Security Features Implemented in NEXUS
- **Authentication**: JWT token verification via Clerk with public key signing.
- **Authorization**: Granular Role-Based Access Control (RBAC) enforced via FastAPI `Depends` dependencies.
- **Security Headers**: OWASP-compliant XSS protection, strict referrer policies, and CORS origin controls.
- **Rate Limiting**: Sliding window rate limiter protecting endpoints against brute force and resource exhaustion.
