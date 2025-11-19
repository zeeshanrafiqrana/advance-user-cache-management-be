# User Data API with Advanced Caching & Rate Limiting

A high-performance Express.js API with advanced caching strategies, sophisticated rate limiting, and asynchronous request processing for handling high-traffic scenarios.

## Features

- **LRU Cache**: Custom implementation with TTL (60s), automatic cleanup, and performance statistics
- **Advanced Rate Limiting**: Token bucket algorithm with burst capacity (10 req/min + 5 burst/10s)
- **Asynchronous Queue**: Request deduplication and concurrent request management
- **Performance Monitoring**: Real-time cache statistics, hit rates, and response time tracking
- **TypeScript Strict Mode**: Type-safe code with comprehensive error handling
- **Mock Database**: Simulated 200ms latency to test caching effectiveness

## Quick Start

```bash
pnpm install

# Create .env file (optional)
echo "PORT=3000" > .env
echo "CORS_ORIGIN=http://localhost:5173" >> .env

# Development mode (auto-reload)
pnpm run dev

# Build for production
pnpm run build

# Run production build
pnpm start

# Lint code
pnpm run lint
```

The API will be available at `http://localhost:3000` (or your configured PORT)

## API Endpoints

### Core Endpoints

#### GET /users
Retrieve all users.

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ],
  "count": 2
}
```

#### GET /users/:id
Retrieve user data by ID with intelligent caching.

**Response on cache hit:**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "source": "cache"
}
```

**Response on cache miss:**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "source": "database"
}
```

**Error responses:**
- `400 Bad Request` - Invalid user ID format
- `404 Not Found` - User does not exist
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

#### POST /users
Create a new user and automatically cache the result.

**Request body:**
```json
{
  "name": "Bob Wilson",
  "email": "bob@example.com"
}
```

**Response:**
```json
{
  "data": {
    "id": 4,
    "name": "Bob Wilson",
    "email": "bob@example.com"
  },
  "message": "User created successfully"
}
```

**Error responses:**
- `400 Bad Request` - Invalid name/email format
- `409 Conflict` - Email already exists
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Bonus Endpoints

#### DELETE /cache
Clear the entire cache manually.

**Response:**
```json
{
  "message": "Cache cleared successfully",
  "timestamp": "2025-11-19T10:30:00.000Z"
}
```

#### GET /cache/status
Get comprehensive cache and queue statistics.

**Response:**
```json
{
  "cache": {
    "hits": 150,
    "misses": 25,
    "currentSize": 3,
    "maxSize": 100,
    "evictions": 0,
    "averageResponseTime": 0.5,
    "totalRequests": 175
  },
  "queue": {
    "queued": 0,
    "processing": 2
  },
  "hitRate": "85.71%",
  "timestamp": "2025-11-19T10:30:00.000Z"
}
```

#### GET /health
Simple health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

## Architecture & Implementation

### Caching Strategy

**LRU Cache with TTL (`src/cache/LRUCache.ts`)**

Implemented a custom Least Recently Used cache with these features:

- **TTL (Time To Live)**: Entries expire after 60 seconds
- **Background Cleanup**: Automatic removal of stale entries every 10 seconds
- **Statistics Tracking**: Hits, misses, evictions, response times
- **Concurrent-Safe**: Handles multiple simultaneous requests for the same key

**Cache Invalidation:**
- Time-based (TTL) for automatic expiry
- Manual clearing via DELETE /cache endpoint
- LRU eviction when capacity exceeded

### Rate Limiting Strategy

**Token Bucket with Burst Capacity (`src/middleware/rateLimiter.ts`)**

Advanced rate limiting that allows burst traffic while maintaining long-term limits:

- **Normal Rate**: 10 requests per minute (continuous refill)
- **Burst Capacity**: 5 additional requests in 10-second windows
- **Per-Client Tracking**: Uses IP address as identifier
- **Token Refill**: Gradual replenishment based on elapsed time


### Asynchronous Processing

**Request Queue (`src/queue/RequestQueue.ts`)**

**How it works:**
1. Request comes in for user ID 1
2. Check if already processing → return existing promise
3. If not, add to queue with unique ID `user-1`
4. Execute when capacity available
5. All waiting requests for ID 1 get the same result


### Performance Optimizations

**Cache Update Strategy:**

### Error Handling

**Comprehensive error responses:**
- Input validation (user ID format, email format)
- Meaningful error messages for debugging
- Proper HTTP status codes
- Global error handler for uncaught exceptions

**Graceful Shutdown:**
- SIGTERM handler for clean shutdown
- Cache cleanup on exit
- Pending requests allowed to complete

## Mock Data

Default users in the system:

```typescript
{
  1: { id: 1, name: "John Doe", email: "john@example.com" },
  2: { id: 2, name: "Jane Smith", email: "jane@example.com" },
  3: { id: 3, name: "Alice Johnson", email: "alice@example.com" }
}
```

Database calls are simulated with 200ms delay to demonstrate caching effectiveness.

## Project Structure

```
backend/
├── src/
│   ├── cache/
│   │   └── LRUCache.ts          # Custom LRU cache implementation
│   ├── middleware/
│   │   └── rateLimiter.ts       # Token bucket rate limiter
│   ├── queue/
│   │   └── RequestQueue.ts      # Async request queue
│   ├── models/
│   │   └── user.ts              # User model and mock data
│   ├── controllers/
│   │   ├── userController.ts    # User endpoint handlers
│   │   └── cacheController.ts   # Cache management handlers
│   ├── routes/
│   │   ├── userRoutes.ts        # User route definitions
│   │   └── cacheRoutes.ts       # Cache route definitions
│   └── index.ts                 # Main Express app
├── package.json
├── tsconfig.json                # Strict mode enabled
├── .env.example                 # Environment variables template
└── README.md
```

## Technology Choices

- **Express.js**
- **TypeScript Strict Mode**
- **No External Cache Library**
- **In-Memory Storage**
- **Native Promises**
- **CORS Enabled**

## Environment Variables

```env
PORT=3000                              # Server port (default: 3000)
CORS_ORIGIN=http://localhost:5173     # Frontend origin for CORS
```

## License

MIT

---

**Development Time**: ~3 hours (core functionality + bonus features)
**Code Quality**: Production-ready with comprehensive error handling
**Performance**: Optimized for high-traffic scenarios
