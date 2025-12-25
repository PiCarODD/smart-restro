# Knowledge Base

This folder contains documentation, guides, and reference materials for the Smart Restaurant Management System.

## Contents

- **Security Guidelines**: Best practices for secure API design
- **API Patterns**: Common patterns and conventions
- **Architecture Decisions**: Key architectural choices and rationale
- **Development Guides**: Step-by-step guides for common tasks

## Security Best Practices

### Restaurant ID Handling

**Critical Security Rule**: `restaurantId` should **NEVER** be accepted from client requests (query parameters, request body, or URL parameters). It must **ALWAYS** be extracted from the JWT token via `req.restaurantId` set by the authentication middleware.

**Why?** Accepting `restaurantId` from the client allows IDOR (Insecure Direct Object Reference) and BAC (Broken Access Control) attacks, where users could access or modify data belonging to other restaurants.

**Implementation**:
- ✅ **CORRECT**: Use `req.restaurantId` from JWT token
- ❌ **WRONG**: Accept `restaurantId` from `req.query` or `req.body`
- ❌ **WRONG**: Allow `restaurantId` in validators

**Example**:
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

