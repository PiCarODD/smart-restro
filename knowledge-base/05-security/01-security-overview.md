# Security Overview

## Security Principles

The Smart Restaurant Management System follows security best practices to protect user data, prevent unauthorized access, and ensure system integrity.

## Authentication

### JWT Tokens
- **Access Tokens**: Short-lived (7 days default)
- **Refresh Tokens**: Long-lived (30 days default)
- **Token Storage**: localStorage (frontend)
- **Token Transmission**: Authorization header

### Password Security
- **Hashing**: bcrypt with salt rounds = 10
- **Password Requirements**: Minimum 8 characters
- **Password Reset**: Secure token-based reset flow

### PIN Authentication
- **Purpose**: Quick login for POS terminals
- **Format**: 4-digit PIN
- **Storage**: Hashed in database
- **Use Case**: Waiter/KDS quick access

## Authorization

### Role-Based Access Control (RBAC)

**User Roles**:
- `super_admin` - Full system access
- `restaurant_owner` - Full restaurant access
- `manager` - Staff, reports, settings (limited)
- `cashier` - POS, payments, basic reports
- `waiter` - Order taking, table management
- `kitchen` - KDS access only
- `inventory` - Stock management only

### Permission System
- Permissions defined per role
- Route-level protection via middleware
- Component-level guards in frontend
- API endpoint authorization checks

## Multi-Tenant Security

### Restaurant ID Isolation

**CRITICAL SECURITY RULE**: `restaurantId` should **NEVER** be accepted from client requests (query parameters, request body, or URL parameters). It must **ALWAYS** be extracted from the JWT token via `req.restaurantId` set by the authentication middleware.

**Why?** Accepting `restaurantId` from the client allows IDOR (Insecure Direct Object Reference) and BAC (Broken Access Control) attacks, where users could access or modify data belonging to other restaurants.

**Implementation**:
```javascript
// ✅ CORRECT
const where = {
  restaurantId: req.restaurantId // Only from JWT
};

// ❌ WRONG
const { restaurantId } = req.query; // Security vulnerability!
const where = {
  restaurantId: restaurantId || req.restaurantId
};
```

### Data Isolation
- All queries filtered by `restaurantId`
- Foreign key constraints enforce relationships
- Middleware validates restaurant access
- No cross-restaurant data leakage

## Input Validation

### Request Validation
- **Backend**: Joi validators for all endpoints
- **Frontend**: Form validation before submission
- **Types**: TypeScript for compile-time checks

### Sanitization
- SQL injection prevention via Sequelize ORM
- XSS protection via input sanitization
- File upload validation (type, size)
- Path traversal prevention

## API Security

### Rate Limiting
- **Authentication endpoints**: 5 requests/minute
- **General endpoints**: 100 requests/minute
- **File upload endpoints**: 10 requests/minute
- **Implementation**: Express rate limit middleware

### CORS Configuration
- Whitelist of allowed origins
- Credentials support for authenticated requests
- Development: `http://localhost:5173`
- Production: Configured domain only

### HTTPS
- **Production**: HTTPS required
- **Development**: HTTP allowed
- **SSL/TLS**: Latest versions
- **Certificate**: Valid SSL certificate

## Data Protection

### Encryption
- **Passwords**: bcrypt hashing
- **Tokens**: JWT signing
- **Sensitive Data**: Encrypted at rest (if applicable)

### Data Privacy
- User data access controls
- Audit logging for sensitive operations
- GDPR compliance considerations
- Data retention policies

## File Upload Security

### Validation
- **File Types**: Whitelist (images only)
- **File Size**: Maximum size limits
- **File Names**: Sanitized to prevent path traversal
- **Storage**: Secure file system or S3

### Implementation
```javascript
// Allowed file types
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];

// File size limit: 5MB
const maxFileSize = 5 * 1024 * 1024;
```

## Error Handling

### Security-Conscious Error Messages
- **Public Errors**: Generic messages (e.g., "Invalid credentials")
- **Detailed Errors**: Logged server-side only
- **No Information Leakage**: Don't reveal system internals

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

## Audit Logging

### Logged Events
- User login/logout
- Sensitive operations (user creation, deletion)
- Order modifications
- Inventory adjustments
- Settings changes

### Audit Log Structure
```typescript
interface AuditLog {
  id: string;
  restaurantId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: JSON;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}
```

## Security Best Practices

### Development
1. **Never commit secrets**: Use environment variables
2. **Validate all inputs**: Client and server-side
3. **Use parameterized queries**: Via Sequelize
4. **Keep dependencies updated**: Regular security audits
5. **Code reviews**: Security-focused reviews

### Production
1. **Environment variables**: Secure secret management
2. **Regular updates**: Security patches
3. **Monitoring**: Security event monitoring
4. **Backup encryption**: Encrypted backups
5. **Access logs**: Monitor access patterns

## Common Vulnerabilities Prevention

### SQL Injection
- **Prevention**: Sequelize ORM (parameterized queries)
- **Status**: ✅ Protected

### XSS (Cross-Site Scripting)
- **Prevention**: Input sanitization, React escaping
- **Status**: ✅ Protected

### CSRF (Cross-Site Request Forgery)
- **Prevention**: SameSite cookies, CORS
- **Status**: ✅ Protected

### IDOR (Insecure Direct Object Reference)
- **Prevention**: Restaurant ID from JWT only
- **Status**: ✅ Protected

### Broken Authentication
- **Prevention**: Secure JWT, password hashing
- **Status**: ✅ Protected

## Security Checklist

### Before Deployment
- [ ] All environment variables set
- [ ] HTTPS configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Error handling doesn't leak information
- [ ] Audit logging enabled
- [ ] Dependencies updated
- [ ] Security headers configured (Helmet)

### Regular Maintenance
- [ ] Security dependency updates
- [ ] Review audit logs
- [ ] Monitor failed login attempts
- [ ] Review access patterns
- [ ] Update security policies

## Related Documentation

- [Restaurant ID Security](./02-restaurant-id-security.md)
- [Authentication Flow](./03-authentication-flow.md)
- [RBAC Implementation](./04-rbac-implementation.md)
- [API Security](./05-api-security.md)


