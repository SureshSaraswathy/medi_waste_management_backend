# Medical Waste Management Backend

Enterprise-grade NestJS backend application for Medical Waste Management System with MVC-inspired architecture.

## 🏗️ Architecture

This project follows an **MVC-inspired architecture** with clear separation of concerns:

- **Controller** → API layer (handles HTTP requests/responses)
- **Service** → Business logic layer
- **Repository** → Database access layer
- **Entity** → Database model definitions

### Project Structure

```
medi_waste_management_backend/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── app.config.ts       # Application configuration
│   │   ├── database.config.ts  # Database configuration
│   │   ├── config.module.ts    # Config module
│   │   └── database/
│   │       └── data-source.ts  # TypeORM data source
│   ├── common/                 # Shared/common code
│   │   ├── constants/          # Application constants
│   │   ├── decorators/         # Custom decorators
│   │   ├── exceptions/         # Exception filters
│   │   ├── interfaces/         # TypeScript interfaces
│   │   └── utils/              # Utility functions
│   ├── modules/                # Feature modules
│   │   └── sample/             # Sample module (template)
│   │       ├── dto/            # Data Transfer Objects
│   │       ├── sample.controller.ts
│   │       ├── sample.service.ts
│   │       ├── sample.repository.ts
│   │       ├── sample.entity.ts
│   │       └── sample.module.ts
│   ├── database/
│   │   └── migrations/         # TypeORM migrations
│   ├── app.module.ts           # Root application module
│   └── main.ts                 # Application entry point
├── .env.example                # Environment variables template
├── ecosystem.config.js         # PM2 configuration
├── package.json
├── tsconfig.json
├── eslint.config.mts
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn
- PM2 (for production)

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd medi_waste_management_backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=medi_waste_management
   ```

4. **Create PostgreSQL database**:
   ```sql
   CREATE DATABASE medi_waste_management;
   ```

5. **Run database migrations** (when available):
   ```bash
   npm run migration:run
   ```

## 🛠️ Development

### Running the Application

#### Development Mode (with hot-reload)
```bash
npm run start:dev
```

#### Production Build
```bash
npm run build
npm run start:prod
```

### Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with watch
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage

### Database Scripts

- `npm run migration:generate -- -n MigrationName` - Generate a new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert the last migration

## 📦 PM2 Process Management

### Installation

Install PM2 globally:
```bash
npm install -g pm2
```

### Starting with PM2

#### Development Environment
```bash
npm run build
npm run start:pm2:dev
```

#### Production Environment
```bash
npm run build
npm run start:pm2:prod
```

### PM2 Management Commands

- `npm run start:pm2` - Start application with PM2
- `npm run stop:pm2` - Stop PM2 process
- `npm run restart:pm2` - Restart PM2 process
- `npm run delete:pm2` - Delete PM2 process

### PM2 Monitoring

```bash
# View process status
pm2 status

# View logs
pm2 logs medi-waste-management-backend

# View real-time monitoring
pm2 monit

# View detailed process info
pm2 show medi-waste-management-backend
```

### PM2 Configuration

The PM2 configuration is in `ecosystem.config.js`:
- **Instances**: `max` (uses all CPU cores)
- **Mode**: `cluster` (load balancing)
- **Auto-restart**: Enabled
- **Memory limit**: 1GB (auto-restart if exceeded)
- **Logs**: Stored in `./logs/` directory

## 🏛️ Architecture Guidelines

### Creating a New Module

Follow this structure for new modules:

```
modules/
└── your-module/
    ├── dto/
    │   ├── create-your-module.dto.ts
    │   └── update-your-module.dto.ts
    ├── your-module.controller.ts
    ├── your-module.service.ts
    ├── your-module.repository.ts
    ├── your-module.entity.ts
    └── your-module.module.ts
```

### Code Organization Rules

1. **Controllers**: Handle HTTP requests/responses only
   - No business logic
   - Input validation via DTOs
   - Error handling

2. **Services**: Contain all business logic
   - Call repositories for data access
   - Handle business rules
   - Return domain objects

3. **Repositories**: Database access only
   - CRUD operations
   - Query building
   - Transaction management

4. **Entities**: Database schema definitions
   - TypeORM decorators
   - Relationships
   - Validation

5. **Common Code**: Shared utilities
   - Place in `src/common/`
   - Reusable across modules
   - No module-specific logic

6. **Configuration**: Centralized config
   - All configs in `src/config/`
   - Environment-based
   - Type-safe

## 🔒 Security Best Practices

- Never commit `.env` files
- Use environment variables for secrets
- Validate all inputs using DTOs
- Use parameterized queries (TypeORM handles this)
- Implement proper authentication/authorization
- Enable CORS only for trusted origins
- Use HTTPS in production

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Sample Module Endpoints

- `GET /api/v1/samples` - Get all samples
- `GET /api/v1/samples/:id` - Get sample by ID
- `POST /api/v1/samples` - Create new sample
- `PATCH /api/v1/samples/:id` - Update sample
- `DELETE /api/v1/samples/:id` - Delete sample (soft delete)

## 🔄 Microservices Readiness

This architecture is designed to be scalable for microservices:

1. **Module-based structure** - Each module can become a microservice
2. **Repository pattern** - Easy to swap data sources
3. **Service layer** - Business logic is isolated
4. **Configuration management** - Centralized and environment-aware
5. **Common utilities** - Shared code can be extracted to packages

### Future Microservices Migration

- Extract modules to separate services
- Use message queues (RabbitMQ, Kafka) for inter-service communication
- Implement API Gateway pattern
- Use service discovery
- Implement distributed tracing

## 🐛 Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure database exists
4. Check network connectivity

### PM2 Issues

1. Check logs: `pm2 logs`
2. Verify ecosystem.config.js syntax
3. Ensure port is not already in use
4. Check environment variables

### Build Issues

1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear dist folder: `rm -rf dist`
3. Rebuild: `npm run build`

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📄 License

This project is proprietary and confidential.

## 👥 Contributing

Follow the architecture guidelines and coding standards. Ensure all tests pass before submitting changes.

---

**Built with ❤️ using NestJS**
