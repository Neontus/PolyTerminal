# Shared Types Package

TypeScript type definitions shared between the backend and frontend.

## Purpose

To maintain type safety and consistency for data structures passed between the API and the client.

## Usage

```typescript
import { Market, Signal, Analyst } from '@packages/shared-types';
```

## Contents

- **API Responses**: Types for API success/error responses.
- **Domain Models**: `Market`, `Signal`, `Analyst`, `Purchase`.
- **Enums**: `SignalDirection`, `SignalOutcome`.
- **DTOs**: Data Transfer Objects for API requests.

## Note

This package should NOT contain Anchor-generated types (use `@packages/anchor-client` for that). It focuses on the application-layer data models.
