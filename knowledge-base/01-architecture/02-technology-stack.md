# Technology Stack Details

## Frontend Technologies

### React 18
- **Purpose**: UI framework
- **Version**: 18.x
- **Key Features Used**:
  - Functional components with hooks
  - Context API for theme/provider management
  - Concurrent rendering
  - Suspense for lazy loading

### TypeScript
- **Purpose**: Type safety and developer experience
- **Version**: 5.x
- **Configuration**: `tsconfig.json` with strict mode
- **Benefits**: 
  - Compile-time error checking
  - Better IDE autocomplete
  - Self-documenting code

### Material-UI (MUI) / shadcn/ui
- **Purpose**: UI component library
- **Usage**: Pre-built components for forms, tables, dialogs
- **Customization**: Theme provider for brand colors

### Zustand
- **Purpose**: State management
- **Why Zustand**: 
  - Lightweight (vs Redux)
  - Simple API
  - TypeScript support
  - No boilerplate

### React Router
- **Purpose**: Client-side routing
- **Version**: 6.x
- **Features**: Protected routes, nested routes, route guards

### Socket.IO Client
- **Purpose**: Real-time communication
- **Usage**: Order updates, table status changes
- **Connection Management**: Auto-reconnect, room joining

### Vite
- **Purpose**: Build tool and dev server
- **Benefits**: 
  - Fast HMR (Hot Module Replacement)
  - Optimized production builds
  - ES modules support

## Backend Technologies

### Node.js
- **Version**: 20.x LTS
- **Purpose**: JavaScript runtime
- **Why**: 
  - Non-blocking I/O for concurrent requests
  - Large ecosystem
  - Same language as frontend

### Express.js
- **Version**: 4.x
- **Purpose**: Web framework
- **Features Used**:
  - RESTful API routes
  - Middleware pipeline
  - Error handling
  - Body parsing

### PostgreSQL
- **Version**: 15+
- **Purpose**: Relational database
- **Why PostgreSQL**:
  - ACID compliance
  - JSONB support for flexible schemas
  - Advanced features (full-text search, arrays)
  - Excellent performance

### Sequelize
- **Version**: 6.x
- **Purpose**: ORM (Object-Relational Mapping)
- **Features Used**:
  - Model definitions
  - Migrations
  - Associations (hasMany, belongsTo)
  - Query building
  - Transactions

### JWT (jsonwebtoken)
- **Purpose**: Authentication tokens
- **Implementation**: 
  - Access tokens (short-lived)
  - Refresh tokens (long-lived)
  - Token verification middleware

### bcrypt
- **Purpose**: Password hashing
- **Security**: Salt rounds = 10
- **Usage**: User registration, login verification

### Socket.IO
- **Version**: 4.x
- **Purpose**: Real-time bidirectional communication
- **Features**:
  - WebSocket with fallback
  - Room-based messaging
  - Event broadcasting
  - Connection management

### Joi / Zod
- **Purpose**: Request validation
- **Usage**: Validate request bodies, query params
- **Benefits**: Type-safe validation, clear error messages

### Multer
- **Purpose**: File upload handling
- **Usage**: Menu item images, restaurant logos
- **Storage**: Local filesystem (can be extended to S3)

## Development Tools

### ESLint
- **Purpose**: Code linting
- **Configuration**: React, TypeScript rules
- **Usage**: Catch errors before runtime

### Prettier (if configured)
- **Purpose**: Code formatting
- **Usage**: Consistent code style

### Jest
- **Purpose**: Testing framework
- **Usage**: Unit tests, integration tests
- **Backend**: Supertest for API testing

### Git
- **Purpose**: Version control
- **Workflow**: Feature branches, pull requests

## Infrastructure & DevOps

### Docker
- **Purpose**: Containerization
- **Usage**: Consistent development/production environments
- **Components**: 
  - Backend container
  - Frontend container
  - PostgreSQL container
  - Redis container (optional)

### Docker Compose
- **Purpose**: Multi-container orchestration
- **Usage**: Local development, production deployment
- **Services**: Backend, frontend, database, redis

### Environment Variables
- **Purpose**: Configuration management
- **Files**: `.env`, `.env.example`
- **Security**: Never commit `.env` files

## Optional/Planned Technologies

### Redis
- **Purpose**: Caching, session storage
- **Status**: Optional, for performance optimization
- **Use Cases**: 
  - Cache frequently accessed data
  - Socket.IO adapter (multi-server)
  - Rate limiting storage

### AWS S3
- **Purpose**: File storage
- **Status**: Can replace local filesystem
- **Benefits**: Scalable, CDN integration

### Nodemailer
- **Purpose**: Email sending
- **Use Cases**: 
  - Password reset
  - Order confirmations
  - Notifications

### Swagger/OpenAPI
- **Purpose**: API documentation
- **Status**: Planned
- **Benefits**: Auto-generated API docs

## Version Compatibility

### Node.js Compatibility
- Minimum: Node.js 18.x
- Recommended: Node.js 20.x LTS
- Package manager: npm or yarn

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- PWA support required for waiter/KDS apps
- Mobile browsers (iOS Safari, Chrome Mobile)

### Database Compatibility
- PostgreSQL 14+ (minimum)
- PostgreSQL 15+ (recommended)
- JSONB support required

## Package Management

### Backend
- **Manager**: npm
- **Lock File**: `package-lock.json`
- **Installation**: `npm install`

### Frontend
- **Manager**: npm
- **Lock File**: `package-lock.json`
- **Installation**: `npm install`

## Related Documentation

- [System Architecture](./01-system-architecture.md)
- [Development Setup](../06-development/01-getting-started.md)
- [API Documentation](../03-api/01-api-overview.md)


