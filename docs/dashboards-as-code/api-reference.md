# API Reference

Dashboards-as-Code extends the Saved Objects API with these endpoints. All routes are under `/api/saved_objects/`.

---

## POST `/_validate`

Validate resource definitions against JSON Schemas.

**Request body:**

```json
{
  "objects": [
    {
      "type": "dashboard",
      "id": "my-dashboard",
      "attributes": { ... }
    }
  ],
  "mode": "schema"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `objects` | `Array<SavedObject>` | Objects to validate |
| `mode` | `"schema"` \| `"full"` | `schema` = JSON Schema only; `full` = also check reference existence |

**Response:**

```json
{
  "valid": false,
  "errors": [
    {
      "type": "dashboard",
      "id": "my-dashboard",
      "errors": [
        { "path": "attributes.title", "message": "Required field missing" }
      ]
    }
  ]
}
```

---

## POST `/_diff`

Compare local definitions against deployed state. Returns a structured list of differences.

**Request body:**

```json
{
  "objects": [
    {
      "type": "dashboard",
      "id": "my-dashboard",
      "attributes": { ... }
    }
  ]
}
```

**Response:**

```json
{
  "diffs": [
    {
      "type": "dashboard",
      "id": "my-dashboard",
      "status": "modified",
      "changes": [
        { "op": "replace", "path": "/attributes/title", "oldValue": "Old", "newValue": "New" }
      ]
    }
  ]
}
```

| Status | Description |
|--------|-------------|
| `added` | Object does not exist on server |
| `modified` | Object exists but differs |
| `unchanged` | Object matches deployed version |

---

## POST `/_bulk_apply`

Deploy resources atomically. Creates or updates in dependency order.

**Request body:**

```json
{
  "objects": [
    {
      "type": "dashboard",
      "id": "my-dashboard",
      "attributes": { ... },
      "references": [
        { "name": "panel_0", "type": "visualization", "id": "viz-1" }
      ]
    }
  ],
  "dryRun": false
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `objects` | `Array<SavedObject>` | *required* | Resources to deploy |
| `dryRun` | `boolean` | `false` | Validate without persisting |

**Response:**

```json
{
  "results": [
    {
      "type": "dashboard",
      "id": "my-dashboard",
      "status": "created",
      "version": 1
    }
  ]
}
```

| Result status | Description |
|---------------|-------------|
| `created` | New object created |
| `updated` | Existing object updated |
| `unchanged` | Object already matches |
| `error` | Error with message |

**Key behaviors:**
- Objects are tagged with `managed-by: osdctl` label automatically
- Dependencies are resolved via topological sort
- Atomic: if validation fails, nothing is written

---

## GET `/_export_clean`

Export saved objects in a deterministic, git-friendly format.

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `types` | `string[]` | all | Filter by type |
| `per_page` | `number` | `100` | Page size |
| `page` | `number` | `1` | Page number |

**Response:** Array of saved objects with sorted keys, stripped internal metadata.

**Accept header:** Use `Accept: application/yaml` for YAML output.

---

## GET `/_schemas`

List all registered JSON Schemas.

**Response:**

```json
{
  "schemas": [
    { "type": "dashboard", "version": "v1" },
    { "type": "visualization", "version": "v1" },
    { "type": "index-pattern", "version": "v1" },
    { "type": "search", "version": "v1" }
  ]
}
```

## GET `/_schemas/{type}/{version}`

Retrieve a specific JSON Schema.

```bash
GET /api/saved_objects/_schemas/dashboard/v1
```

**Response:** The full JSON Schema document for the given type and version.

---

## POST `/_unlock/{type}/{id}`

Emergency unlock for code-managed objects. Removes the `managed-by` label.

```bash
POST /api/saved_objects/_unlock/dashboard/my-dashboard
```

**Response:**

```json
{
  "type": "dashboard",
  "id": "my-dashboard",
  "unlocked": true,
  "message": "Lock removed. Object [dashboard/my-dashboard] is no longer managed by code."
}
```

---

## Managed Lock on Standard CRUD Routes

When a saved object has `attributes.labels['managed-by'] === 'osdctl'`, the standard CRUD routes enforce a read-only lock:

| Route | Behavior |
|-------|----------|
| `POST /{type}/{id}` (create with overwrite) | Returns `409 Conflict` |
| `PUT /{type}/{id}` (update) | Returns `409 Conflict` |
| `DELETE /{type}/{id}` | Returns `409 Conflict` |
| `POST /_bulk_create` (with overwrite) | Returns `409 Conflict` for locked objects |
| `PUT /_bulk_update` | Returns `409 Conflict` for locked objects |

**Override:** Add `?force=true` to any of these routes to bypass the lock.

**Unlock:** Use `POST /_unlock/{type}/{id}` to permanently remove the lock.
