# Credential Management

A OpenSearch Dashboards plugin

---

## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/master/CONTRIBUTING.md) for instructions
setting up your development environment.


## Build and Run crypto_materials_generator

```
npm install @types/yargs
npm install -g ts-node typescript '@types/node'
```

```
cd <root dir> 

ts-node src/plugins/credential_management/server/crypto/crypto_materials_generator.ts --keyName='aes-name' --keyNamespace='aes-namespace'
```
