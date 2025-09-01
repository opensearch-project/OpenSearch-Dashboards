# Data Importer Plugin

An OpenSearch Dashboards plugin for importing your static data to OpenSearch indexes directly from Dashboards via text box or file upload. Multiple Data Source (MDS) compatible.

https://github.com/user-attachments/assets/2eb590cb-a21a-4c4e-8b3f-5517365ffde5

Supported filetypes:

- JSON (treated as 1 document)
- CSV
- NDJSON
- And more (TBD)

---

## Configurations

This plugin can be configured in your `config/opensearch_dashboards.yml`

```yaml
# Enable the plugin
data_importer.enabled: true

# Configure which file types will be supported (by default, all 3 are enabled)
data_importer.enabledFileTypes: ['csv', 'json', 'ndjson']

# Configure file size upload limit in bytes
data_importer.maxFileSizeBytes: 100000000

# Configure character limit for text data
data_importer.maxTextCount: 10000

# Configure the max document count the data importer will parse when previewing data
data_importer.filePreviewDocumentsCount: 10
```
