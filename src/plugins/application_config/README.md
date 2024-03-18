# ApplicationConfig Plugin

An OpenSearch Dashboards plugin for application configuration and a default implementation based on OpenSearch as storage.

---

## Introduction

This plugin introduces the support of dynamic application configurations as opposed to the existing static configuration in OSD YAML file `opensearch_dashboards.yml`. It stores the configuration in an index whose default name is `.opensearch_dashboards_config` and could be customized through the key `opensearchDashboards.configIndex` in OSD YAML file. Initially the new index does not exist. Only OSD users who need dynamic configurations will create it.

It also provides an interface `ConfigurationClient` for future extensions of external configuration clients. A default implementation based on OpenSearch as database is used.

This plugin is disabled by default.

## Configuration

OSD users who want to set up application configurations will first need to enable this plugin by the following line in OSD YML.

```
application_config.enabled: true

```

Then they can perform configuration operations through CURL the OSD APIs.

(Note that the commands following could be first obtained from a copy as curl option from the network tab of a browser development tool and then replaced with the API names)

Below is the CURL command to view all configurations.

```
curl '{osd endpoint}/api/appconfig' -X GET
```

Below is the CURL command to view the configuration of an entity.

```
curl '{osd endpoint}/api/appconfig/{entity}' -X GET

```

Below is the CURL command to update the configuration of an entity.

```
curl '{osd endpoint}/api/appconfig/{entity}' -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -H 'osd-xsrf: osd-fetch' -H 'Sec-Fetch-Dest: empty' --data-raw '{"newValue":"{new value}"}'
```

Below is the CURL command to delete the configuration of an entity.

```
curl '{osd endpoint}/api/appconfig/{entity}' -X DELETE -H 'osd-xsrf: osd-fetch' -H 'Sec-Fetch-Dest: empty'

```


## External Configuration Clients

While a default OpenSearch based client is implemented, OSD users can use external configuration clients through an OSD plugin (outside OSD).

Let's call this plugin `MyConfigurationClientPlugin`.

First, this plugin will need to implement a class `MyConfigurationClient` based on interface `ConfigurationClient` defined in the `types.ts` under directory `src/plugins/application_config/server/types.ts`. Below are the functions inside the interface.

```
  getConfig(options?: ConfigurationClientOptions): Promise<Map<string, string>>;

  getEntityConfig(entity: string, options?: ConfigurationClientOptions): Promise<string>;

  updateEntityConfig(entity: string, newValue: string, options?: ConfigurationClientOptions): Promise<string>;

  deleteEntityConfig(entity: string, options?: ConfigurationClientOptions): Promise<string>;
```

`ConfigurationClientOptions` wraps some additional parameters including request headers.

Second, this plugin needs to declare `applicationConfig` as its dependency by adding it to `requiredPlugins` in its own `opensearch_dashboards.json`.

Third, the plugin will define a new type called `AppPluginSetupDependencies` as follows in its own `types.ts`.

```
export interface AppPluginSetupDependencies {
  applicationConfig: ApplicationConfigPluginSetup;
}

```

Then the plugin will import the new type `AppPluginSetupDependencies` and add to its own setup input. Below is the skeleton of the class `MyConfigurationClientPlugin`.

```
// MyConfigurationClientPlugin
  public setup(core: CoreSetup, { applicationConfig }: AppPluginSetupDependencies) {

    ...
    // The function createClient provides an instance of ConfigurationClient which
    // could have a underlying DynamoDB or Postgres implementation.
    const myConfigurationClient: ConfigurationClient = this.createClient();

    applicationConfig.registerConfigurationClient(myConfigurationClient);
     ...
    return {};
  }

```

## Onboarding Configurations

Since the APIs and interfaces can take an entity, a new use case to this plugin could just pass their entity into the parameters. There is no need to implement new APIs or interfaces. To programmatically call the functions in `ConfigurationClient` from a plugin (the caller plugin), below is the code example.

Similar to [section](#external-configuration-clients), a new type `AppPluginSetupDependencies` which encapsulates `ApplicationConfigPluginSetup` is needed. Then it can be imported into the `setup` function of the caller plugin. Then the caller plugin will have access to the `getConfigurationClient` and `registerConfigurationClient` exposed by `ApplicationConfigPluginSetup`.

## Development

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md) for instructions
setting up your development environment.
