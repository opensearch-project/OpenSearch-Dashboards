# Workspace

## Server APIs

### Duplicate saved objects API

Duplicate saved objects among workspaces.

* Path and HTTP methods

```json
POST <osd host>:<port>/api/workspaces/_duplicate_saved_objects
```

* Request body

| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `objects` | Array | YES | A list of saved objects to copy. |
| `targetWorkspace` | String | YES  | The ID of the workspace to copy to. |
| `includeReferencesDeep` | Boolean | NO | Copy all of the referenced objects of the specified objects to the target workspace . |

The attrbutes of the object in the `objects` parameter are as follows:
| Parameter | Data type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | String | YES | The type of the saved object, such as `index-pattern`, `config` and `dashboard`. |
| `id` | String | YES | The ID of the saved object. |

* Example request

```json
POST api/workspaces/_duplicate_saved_objects
{
    "objects": [
        {
            "type": "index-pattern",
            "id": "619cc200-ecd0-11ee-95b1-e7363f9e289d"
        }
    ],
    "targetWorkspace": "9gt4lB"
}
```

* Example response

```json
{
    "successCount": 1,
    "success": true,
    "successResults": [
        {
            "type": "index-pattern",
            "id": "619cc200-ecd0-11ee-95b1-e7363f9e289d",
            "meta": {
                "title": "test*",
                "icon": "indexPatternApp"
            },
            "destinationId": "f4b724fd-9647-4bbf-bf59-610b43a62c75"
        }
    ]
}
```

