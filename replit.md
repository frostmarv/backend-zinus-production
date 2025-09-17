# Overview

This is a production management backend system built with NestJS and TypeScript, designed specifically for manufacturing operations at Zinus. The system manages production orders, cutting processes, and foam packing operations through a RESTful API architecture. It includes comprehensive data tracking for manufacturing stages from raw materials through shipping, with detailed recording of cutting operations and balok (foam block) specifications.

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

## Data Models
- **Production Orders**: Product tracking with stage-based workflow (raw-material → cutting → sewing → qc → packing → shipped)
- **Cutting Records**: Detailed logging of cutting operations with timestamp, shift, group, and machine data
- **Balok Entities**: Foam block specifications including density, ILD, dimensions, and quantities
- **JSONB Fields**: Flexible data storage for complex objects like foaming dates

## Configuration Management
- **Environment-based Config**: Separate configurations for development and production
- **Database Flexibility**: Automatic database type detection based on environment variables
- **SSL Support**: Production-ready PostgreSQL connections with SSL configuration

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