# MongoDB Usage Guide for Next.js Application

## Problem: `Can't resolve 'child_process'` Error

This application was experiencing an error related to MongoDB trying to use the Node.js `child_process` module in client-side or Edge runtime environments:

```
Module not found: Can't resolve 'child_process'
./node_modules/mongodb/lib/client-side-encryption/mongocryptd_manager.js (38:27)
```

## Solution

The solution has multiple parts:

1. **Webpack Configuration**: Added fallbacks in `next.config.js` to prevent Node.js-specific modules from being included in client bundles
2. **Client-Side API Utilities**: Created utility functions for making API calls from client components instead of directly importing MongoDB
3. **Server-Side Only MongoDB**: Ensuring MongoDB is only used in server-side code (API routes, Server Components, etc.)

## Best Practices for MongoDB in Next.js

### DO's:
- ✅ Use MongoDB only in server components and API routes
- ✅ Create dedicated API endpoints for client components to use
- ✅ Use the provided API utility functions in `src/lib/api-utils.js` for data fetching
- ✅ When building new features, keep MongoDB usage isolated to server-side code

### DON'Ts:
- ❌ Don't import MongoDB or Mongoose in client components (files with `'use client'`)
- ❌ Don't use MongoDB in middleware that might run on the Edge runtime
- ❌ Don't use MongoDB in getStaticProps that might be executed at build time in a restricted environment

## Testing MongoDB Connection

A test page has been created at `/test-mongodb` which demonstrates the correct pattern:
1. Client component makes API request to `/api/test-mongodb`
2. API route connects to MongoDB and returns data
3. Client displays the results without directly using MongoDB

## Additional Resources

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
