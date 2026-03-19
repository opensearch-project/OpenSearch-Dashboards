# Session Timeout Testing Guide

This guide explains how to test the session timeout toaster functionality in OpenSearch Dashboards.

## Overview

The session timeout feature shows a toaster notification when the user's session expires (like AWS login timeout), then automatically redirects to the login page with the current URL preserved as the `next-url` parameter.

## Console Testing (Development)

For local development testing, you can manually trigger the session timeout using browser console:

1. Start OpenSearch Dashboards in development mode:
   ```bash
   yarn start
   ```

2. Navigate to any page and open browser console (F12)

3. Run this script to test the session timeout functionality:
   ```javascript
   // Test session timeout toaster
   const testSessionTimeout = async () => {
     await new Promise(resolve => setTimeout(resolve, 1000));

     const toasts = window.__osdBundles__?.core?.notifications?.toasts;
     if (toasts) {
       const sessionToast = toasts.addInfo({
         title: 'Session Expired',
         text: 'Your session has timed out. You will be redirected to the login page automatically.',
         toastLifeTimeMs: 5000
       });

       setTimeout(() => {
         toasts.remove(sessionToast);
         const redirectUrl = `/_login?next-url=${encodeURIComponent(window.location.href)}`;
         console.log('Would redirect to:', redirectUrl);
       }, 5000);
     }
   };

   testSessionTimeout();
   ```

## Expected Behavior

1. **Toaster Display**: A standard info toaster appears at the bottom-left with:
   - Title: "Session Expired"
   - Message: "Your session has timed out. You will be redirected to the login page automatically."
   - Duration: 5 seconds
   - Standard blue/info styling (not red)

2. **Automatic Redirect**: After 5 seconds, the page redirects to:
   ```
   /_login?next-url={current-page-url}
   ```

3. **Global Functionality**: The toaster works on any page where HTTP requests occur.

## Real Environment Testing

In a real AWS/authentication environment:

1. The feature will activate when actual session timeouts occur (HTTP 401/403/303/302/307 responses)
2. Session timeout detection works automatically
3. The redirect URL will be determined by the backend authentication service
4. Detects common error messages like "session expired", "token invalid", etc.

## Production Considerations

- Session timeout detection relies on HTTP response codes and error patterns
- Supports multiple authentication systems (AWS, IDC, etc.)
- The `next-url` parameter preserves user's location for post-login redirect
- GlobalSessionInterceptor handles all HTTP requests application-wide
- Debounced to prevent multiple toasters (30-second window)