# Managed Objects

When you deploy dashboards via `osdctl apply` (or `POST /_bulk_apply`), the server tags each object with a `managed-by: osdctl` label. This creates a **managed lock** that prevents accidental UI edits.

## How It Works

```
osdctl apply                    Server
    |                              |
    |  POST /_bulk_apply           |
    |  [{type, id, attributes}] -->|
    |                              | 1. Validate schemas
    |                              | 2. Resolve dependencies
    |                              | 3. Create/update objects
    |                              | 4. Add managed-by: osdctl label
    |                              |
    |  <-- results                 |
```

### What Gets Protected

Once an object is managed, standard API routes block modifications:

- **Create (with overwrite)** - `POST /api/saved_objects/{type}/{id}?overwrite=true` returns `409 Conflict`
- **Update** - `PUT /api/saved_objects/{type}/{id}` returns `409 Conflict`
- **Delete** - `DELETE /api/saved_objects/{type}/{id}` returns `409 Conflict`
- **Bulk create/update** - Same protection for bulk operations

### UI Behavior

In the Saved Objects Management UI:

- Managed objects display a **"Managed"** badge with a lock icon next to the title
- The edit page shows a **warning callout** explaining the object is managed by code
- Edit and delete buttons are **disabled** for managed objects
- A tooltip explains how to modify the object via `osdctl` or the unlock endpoint

## Modifying Managed Objects

### Option 1: Update via Code (Recommended)

The intended workflow: update your source code and re-deploy.

```bash
# Edit your TypeScript definition
vim dashboards/my-dashboard.ts

# Build, validate, and apply
osdctl build -d ./dashboards -o ./output
osdctl diff -d ./output --server https://localhost:5601
osdctl apply -d ./output --server https://localhost:5601
```

### Option 2: Force Override

Add `?force=true` to bypass the lock on any standard API call:

```bash
curl -X PUT "https://localhost:5601/api/saved_objects/dashboard/my-dashboard?force=true" \
  -H 'Content-Type: application/json' \
  -H 'osd-xsrf: true' \
  -d '{"attributes": {"title": "Updated Title"}}'
```

### Option 3: Unlock Permanently

Remove the managed lock entirely, returning the object to normal UI-editable state:

```bash
curl -X POST "https://localhost:5601/api/saved_objects/_unlock/dashboard/my-dashboard" \
  -H 'osd-xsrf: true'
```

After unlocking, the object can be freely edited through the UI. If you later run `osdctl apply`, it will be re-locked.

## Checking Managed Status

The `managed-by` label is stored in `attributes.labels`:

```json
{
  "type": "dashboard",
  "id": "my-dashboard",
  "attributes": {
    "title": "My Dashboard",
    "labels": {
      "managed-by": "osdctl",
      "team": "platform"
    }
  }
}
```

You can check this programmatically:

```typescript
const obj = await client.get('dashboard', 'my-dashboard');
const labels = obj.attributes.labels || {};
const isManaged = labels['managed-by'] === 'osdctl';
```
