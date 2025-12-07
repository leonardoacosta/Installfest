# Project Name

<!-- Import global standards from centralized config -->
@~/.claude/CLAUDE.md

## Tech Stack

- **Framework**: .NET 8-10, ASP.NET Core
- **API**: Web API / Minimal APIs
- **Database**: Entity Framework Core, Dapper, SQL Server / Oracle
- **Azure Services**: Functions, Key Vault, Service Bus, App Insights
- **Auth**: Azure AD, MSAL, JWT
- **Frontend**: React + TanStack Query (when applicable)
- **Testing**: xUnit, NSubstitute, TestContainers

## Build Commands

- `dotnet build` - Build solution
- `dotnet run` - Run application
- `dotnet test` - Run tests
- `dotnet watch` - Hot reload development
- `dotnet ef migrations add <name>` - Add EF migration
- `dotnet ef database update` - Apply migrations
- `func start` - Run Azure Functions locally

## Directory Structure

```
src/
  Api/                      # Web API project
  Functions/                # Azure Functions project
  Core/                     # Domain models, interfaces
  Infrastructure/           # Data access, external services
tests/
  Api.Tests/                # API integration tests
  Core.Tests/               # Unit tests
```

## Conventions

### Controllers / Endpoints

- Use attribute routing: `[Route("api/[controller]")]`
- Return `ActionResult<T>` for typed responses
- Use `IActionResult` for non-typed responses
- Validate with FluentValidation or Data Annotations
- Async all the way: `async Task<T>`

### Entity Framework

- DbContext per request (scoped)
- Use migrations for schema changes
- Eager loading with `.Include()` when needed
- Use projections for read queries

### Dapper

- Use for complex queries or performance-critical paths
- Parameterized queries always (prevent SQL injection)
- Map to DTOs, not domain entities

### Azure Functions

- Use dependency injection
- Isolated process model (.NET 8+)
- Configure in `host.json` and `local.settings.json`
- Use managed identity for Azure service access

### Configuration

- Use `IOptions<T>` pattern
- Secrets in Azure Key Vault (never in appsettings)
- Environment-specific: `appsettings.{Environment}.json`
- Use User Secrets for local development

### Logging

- Use `ILogger<T>` from Microsoft.Extensions.Logging
- Structured logging with message templates
- Log levels: Debug, Information, Warning, Error, Critical
- Application Insights for production telemetry
