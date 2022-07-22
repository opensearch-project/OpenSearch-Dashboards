# Credential Management

A OpenSearch Dashboards plugin

---

## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/master/CONTRIBUTING.md) for instructions
setting up your development environment.

## Configuration

1. To enable this feature, override config/opensearch_dashboards.yml

```
opensearchDashboards.multipleDataSource.enabled: true
```

2. To setup path for crypto material, override config/opensearch_dashboards.yml

```
credential_management.materialPath: "path/to/your/crypto_material"
```

## Generate your own crypto material via crypto_materials_generator script

```
yarn generate-crypto-materials --path='path/to/your/crypto_material' --keyName='aes-name' --keyNamespace='aes-namespace'    

// Expected Output

% yarn generate-crypto-materials --path='data/crypto_material' --keyName='aes-name' --keyNamespace='aes-namespace'

yarn run v1.22.19
$ node scripts/crypto_materials_generator --path=data/crypto_material --keyName=aes-name --keyNamespace=aes-namespace
Crypto materials generated!
✨  Done in 2.06s.

```


