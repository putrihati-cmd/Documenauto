# Freemium Module Activation Guide

Version: 1.0
Status: INACTIVE

## Overview

This module implements a Scribd-like Freemium model where users can preview the first 10 pages for free but must use "Tokens" to unlock the full document and download it.

## File Structure

- `01_database_schema.sql`: SQL to create `users`, `token_transactions` tables and update `orders`.
- `02_backend_logic.js`: Node.js logic for calculating costs and processing unlocks.
- `03_frontend_preview.jsx`: React component that replaces the standard preview with a locked version.

## How to Activate (Future)

### 1. Database Update

Run the SQL script directly in your PostgreSQL database:

```bash
docker exec -it smartcopy-postgres psql -U smartcopy -d smartcopy_db -f /path/to/01_database_schema.sql
```

_(Or use a database manager tool)_

### 2. Backend Integration

1.  Open `backend/src/controllers/order.controller.js` (or equivalent).
2.  Import the logic from `02_backend_logic.js`.
3.  Add the `generatePreview` and `unlockDocument` functions to your routes.
    ```javascript
    // Example Route
    router.get(
      "/orders/:orderId/preview",
      authMiddleware,
      orderController.generatePreview,
    );
    router.post(
      "/orders/:orderId/unlock",
      authMiddleware,
      orderController.unlockDocument,
    );
    ```

### 3. Frontend Integration

1.  Copy `03_frontend_preview.jsx` to `frontend/src/components/PreviewWithLock.jsx`.
2.  In your `App.jsx` or main routing file, replacing the existing Preview view with this new component check:
    ```jsx
    // If Freemium is ON:
    return <PreviewWithLock orderId={id} ... />
    ```

### 4. Authentication Requirement

This model requires users to be logged in to have a `token_balance`. You must ensure the Authentication System (Login/Register) is active before enabling this module.
