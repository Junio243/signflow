# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of SignFlow seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue
2. Email security details to: security@signflow.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Fix Timeline**: Varies based on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-60 days

### Disclosure Policy

We follow **Responsible Disclosure**:

1. Reporter notifies us privately
2. We work on a fix
3. We release a patch
4. Public disclosure after patch is available

## Security Best Practices

### For Users

1. **Never share your access tokens**
2. **Use strong passwords** (min 12 characters)
3. **Enable 2FA** if available
4. **Regularly review** signed documents
5. **Report suspicious activity** immediately

### For Developers

1. **Keep dependencies updated**
   ```bash
   npm audit
   npm audit fix
   ```

2. **Use environment variables** for secrets
   - Never commit `.env` files
   - Use `.env.example` for templates

3. **Validate all input**
   - Use Zod schemas
   - Sanitize user input
   - Validate file types and sizes

4. **Implement rate limiting**
   - Already configured in API routes
   - Monitor for abuse

5. **Use authentication middleware**
   - All API routes require auth
   - Verify user ownership

6. **Sanitize error messages**
   - Don't expose internal structure
   - Log detailed errors server-side
   - Show generic messages to users

## Security Features

### Authentication & Authorization

- ✅ JWT-based authentication
- ✅ Row-level security (RLS) in Supabase
- ✅ API route protection
- ✅ User ownership validation

### Data Protection

- ✅ HTTPS only
- ✅ IP hashing for privacy
- ✅ Secure file storage
- ✅ Access code protection for documents
- ✅ Document expiration

### Input Validation

- ✅ File type validation (magic bytes)
- ✅ File size limits
- ✅ Schema validation (Zod)
- ✅ Sanitized error messages
- ✅ XSS prevention

### Rate Limiting

- ✅ Per-route rate limits
- ✅ IP-based tracking
- ✅ Configurable thresholds

### Monitoring

- ✅ Structured logging
- ✅ Error tracking (Sentry)
- ✅ Security event logging

## Known Limitations

1. **Rate limiting**: Currently in-memory (not distributed)
   - **Solution**: Use Redis for production

2. **File scanning**: No virus/malware scanning
   - **Solution**: Integrate ClamAV or similar

3. **Document watermarking**: Not implemented
   - **Solution**: Add visible watermarks to PDFs

## Security Checklist for Production

- [ ] Enable HTTPS only
- [ ] Configure Content Security Policy (CSP)
- [ ] Set up Sentry for error tracking
- [ ] Enable database backups
- [ ] Configure log retention
- [ ] Set up monitoring alerts
- [ ] Review and rotate secrets
- [ ] Enable DDoS protection
- [ ] Configure CORS properly
- [ ] Set up rate limiting with Redis
- [ ] Enable file scanning
- [ ] Review Supabase RLS policies
- [ ] Set up regular security audits

## Compliance

SignFlow implements security measures aligned with:

- **ICP-Brasil** standards for digital signatures
- **LGPD** (Brazilian General Data Protection Law)
- **OWASP Top 10** security risks

## Updates

This security policy was last updated: January 29, 2026

We review and update our security practices regularly.
