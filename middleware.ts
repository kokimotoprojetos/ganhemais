import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/', 
  '/sso-callback(.*)',
  '/api/payment/deposit(.*)', 
  '/api/payment/status(.*)', 
  '/api/payment/webhook(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.[^?]*$).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
