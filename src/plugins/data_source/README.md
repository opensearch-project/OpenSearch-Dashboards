# DataSource Plugin

An OpenSearch Dashboards plugin

This plugin introduces support for multiple data sources into OpenSearch Dashboards and provides related functions to connect to OpenSearch data sources.

## Configuration

Update the following configuration in the `opensearch_dashboards.yml` file to apply changes. Refer to the schema [here](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/plugins/data_source/config.ts) for supported configurations.

1. The dataSource plugin is disabled by default; to enable it:
   `data_source.enabled: true`

2. The audit trail is disabled by default for logging the access to data source; to disable it:
   `data_source.audit.enabled: true`

- Default auditor configuration:

```yml
data_source.audit.appender.kind: 'file'
data_source.audit.appender.layout.kind: 'pattern'
data_source.audit.appender.path: '<Operating System's Temp Folder>/opensearch-dashboards-data-source-audit.log'
```

3. The default encryption-related configuration parameters are:

```yml
data_source.encryption.wrappingKeyName: 'changeme'
data_source.encryption.wrappingKeyNamespace: 'changeme'
data_source.encryption.wrappingKey:
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
```

Note that if any of the encryption keyring configuration values change (wrappingKeyName/wrappingKeyNamespace/wrappingKey), none of the previously-encrypted credentials can be decrypted; therefore, credentials of previously created data sources must be updated to continue use.

**What are the best practices for generating a secure wrapping key?**  
WrappingKey is an array of 32 random numbers. Read [more](https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator) about best practices for generating a secure wrapping key.

## Public

The public plugin is used to enable and disable the features related to multi data source available in other plugins. e.g. data_source_management, index_pattern_management

- Add as a required dependency for whole plugin on/off switch
- Add as opitional dependency for partial flow changes control

## Server

The provided data source client is integrated with default search strategy in data plugin. When data source id presented in IOpenSearchSearchRequest, data source client will be used.

### Data Source Service

The data source service will provide a data source client given a data source id and optional client configurations.

Currently supported client config is:

- `data_source.clientPool.size`

Data source service uses LRU cache to cache the root client to improve client pool usage.

#### Example usage:

In the RequestHandler, get an instance of the client using:

```ts
client: OpenSearchClient = await context.dataSource.opensearch.getClient(dataSourceId);

//Support for legacy client
apiCaller: LegacyAPICaller = context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI;
```

### Data Source Client Wrapper

The data source saved object client wrapper overrides the write related action for data source object in order to perform validation and encryption actions of the authentication information inside data source.

### Cryptography service

The cryptography service encrypts and decrypts data source credentials (support no_auth and username_password credential types). Highlight the best security practices listed below:

a. Envelope encryption - provides strong protection on data keys. Read more details [here](https://docs.aws.amazon.com/encryption-sdk/latest/developer-guide/concepts.html#envelope-encryption)

b. Key derivation with HMAC - KDF with SHA-384 protects against accidental reuse of a data encryption keys and reduces the risk of overusing data keys.

c. Signature algorithm - ECDSA with P-384 and SHA-384. Under multiple data source case, data source documents stored on OpenSearch can be modified / replaced by attacker. With ECDSA signature, ciphertext decryption will fail if it’s getting polluted. No one will be able to create another signature that verifies with the public key because the private key has been dropped.

Please check https://github.com/opensearch-project/OpenSearch-Dashboards/issues/1756 for more details.

---

## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md) for instructions setting up your development environment.

### Design Documents

- [High level design doc](../../../docs/multi-datasource/high_level_design.md)
- [User stories](../../../docs/multi-datasource/user_stories.md)
- [Client management detailed design](../../../docs/multi-datasource/client_management_design.md)

### Integrate with multiple data source feature

TODO: [#2455](https://github.com/opensearch-project/OpenSearch-Dashboards/issues/2455)
