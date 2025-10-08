# Overview

This is a production management backend system built with NestJS and TypeScript, designed specifically for manufacturing operations at Zinus. The system manages production orders, cutting processes, foam packing operations, and assembly layers through a RESTful API architecture. It includes comprehensive data tracking for manufacturing stages from raw materials through shipping, with detailed recording of cutting operations, balok (foam block) specifications, and foam layer assembly components.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Framework
- **NestJS**: Modern Node.js framework using TypeScript with decorator-based architecture
- **Express**: Underlying HTTP server platform for handling requests
- **Modular Design**: Feature-based modules (ProductionOrder, Cutting, PackingFoam) with clear separation of concerns

## Database Layer
- **TypeORM**: Object-relational mapping with entity-based data modeling
- **Dual Database Support**: 
  - SQLite for local development (fallback option)
  - PostgreSQL for production environments
- **Entity Relationships**: One-to-many relationships between cutting records and balok entities
- **Auto-migrations**: Database schema synchronization in development mode

## API Design
- **RESTful Endpoints**: Standard HTTP methods for resource management
- **Swagger Documentation**: Automated API documentation with @nestjs/swagger
- **Validation Pipeline**: class-validator and class-transformer for request validation
- **JSON Response Format**: Structured data exchange with nested object support
- **Cascading Master Data API**: Enhanced dropdown endpoints (getSkus, getQtyPlans, getWeeks) now include:
  - `f_code`: Item Number (F.CODE) from products table
  - `s_codes`: Array of assembly layer objects with {s_code, description} for 2nd Item Numbers
  - Backward compatible with existing `value` and `label` fields

## Data Models
- **Production Orders**: Product tracking with stage-based workflow (raw-material → cutting → sewing → qc → packing → shipped)
- **Production Planning**: Separated views and endpoints for FOAM and SPRING products
  - Full CRUD endpoints available (GET/POST/PUT/DELETE)
  - `/api/production-planning/foam` - View all FOAM product planning
  - `/api/production-planning/spring` - View all SPRING product planning
  - DTOs for data validation on create and update operations
- **Cutting Records**: Detailed logging of cutting operations with timestamp, shift, group, and machine data
- **Production Cutting Records**: Simplified cutting entry form with header data (timestamp, shift, group, time, machine, operator) and multiple entries per record
  - Each entry captures: customer, PO numbers, SKU, S.CODE (optional 2nd Item Number), description, quantity order/production, week
  - S.CODE and description fields are optional (nullable) to handle products without assembly layers
  - **Remain Quantity Calculation**: NOT stored in database - computed real-time via aggregation per layer (customerPO + SKU + S.CODE)
    - API endpoint: `/api/master-data/remain-quantity?customerPo=X&sku=Y&sCode=Z`
    - Returns: `{ quantityOrder, totalProduced, remainQuantity }` where remainQuantity = quantityOrder - SUM(actual production)
- **Balok Entities**: Foam block specifications including density, ILD, dimensions, and quantities
- **Assembly Layers**: BOM-style component tracking for foam products, linked to SKU with layer ordering and specifications
  - Full CRUD endpoints available at /api/assembly-layers
  - Includes validation to prevent duplicate S.CODE per product
  - Fields: second_item_number (S.CODE), description, description_line_2 (size), layer_index, category_layers (e.g., "Layer 1", "Layer 2")
- **Workable Bonding Views**: Production progress tracking for multi-layer foam assembly
  - `v_workable_bonding`: Summary view showing progress per order (week, customer, SKU, progress, remain, status)
  - `v_workable_bonding_detail`: Detailed layer breakdown (Layer 1-4, Hole) with actual quantities
  - **Product Filter**: **FOAM products ONLY** - SPRING products are excluded from workable bonding views
  - **Data Source**: Starts from `production_order_items` (shows ALL planned orders) with LEFT JOIN to `production_cutting_entries`
  - **Sorting**: Orders by `shipToName COLLATE NOCASE, sku COLLATE NOCASE` for consistent alphabetical sorting
  - **Status Logic**: "Not Started" (progress=0), "Running" (0<progress<qty), "Workable" (progress≥qty)
- **JSONB Fields**: Flexible data storage for complex objects like foaming dates

## Configuration Management
- **Environment-based Config**: Separate configurations for development and production
- **Database Flexibility**: Automatic database type detection based on environment variables
- **SSL Support**: Production-ready PostgreSQL connections with SSL configuration
- **CORS Configuration**: Dynamic origin allowlist for secure cross-origin requests
  - Development: Explicitly allows `http://127.0.0.1:5000`, `http://localhost:5000`, and `https://{REPLIT_DEV_DOMAIN}`
  - Wildcard support: Any `.replit.dev` domain allowed for development flexibility
  - Production: Configurable via `ALLOWED_ORIGINS` environment variable (comma-separated list)
  - Credentials support: Enabled for cookie-based authentication

## Development Tools
- **Hot Reload**: Watch mode for development with automatic restart
- **Testing Framework**: Jest for unit and e2e testing
- **Code Quality**: ESLint and Prettier for consistent code formatting
- **TypeScript**: Strong typing throughout the application

# External Dependencies

## Database Systems
- **PostgreSQL**: Primary production database with JSONB support
- **SQLite**: Local development database for quick setup

## Development Libraries
- **class-validator**: Request validation and transformation
- **rxjs**: Reactive programming support for NestJS
- **reflect-metadata**: Decorator metadata support for TypeScript

## Production Tools
- **dotenv**: Environment variable management
- **swagger-ui-express**: Interactive API documentation interface

## Testing Infrastructure
- **Jest**: Testing framework with coverage reporting
- **Supertest**: HTTP assertion library for e2e testing
- **@nestjs/testing**: NestJS-specific testing utilities

## Build and Development
- **TypeScript Compiler**: ES2023 target with modern module resolution
- **ts-node**: TypeScript execution for development
- **ESLint**: Code linting with Prettier integration