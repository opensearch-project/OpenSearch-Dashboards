# @osd/plugin-helpers

Just some helpers for OpenSearch Dashboards plugin devs.

## Installation

You don't actually need to install the plugin helpers, they are automatically inherited from the OpenSearch Dashboards project by building your plugin within the OpenSearch Dashboards repo. To use the plugin helpers just create the needed npm scripts on your plugin's `package.json` (as exemplified below) which 
is already the case if you use the new `node scripts/generate_plugin` script.

```json
{
  "scripts" : {
    "build": "yarn plugin-helpers build",
    "plugin-helpers": "node ../../scripts/plugin_helpers",
    "osd": "node ../../scripts/osd"
  }
}
```

This will make it easier to execute the `plugin-helpers` script from within your plugin repository.

```sh
yarn osd bootstrap
```

## Usage

This CLI has a `build` command that plugin devs can run to easily package OpenSearch Dashboards plugins. It also has a `version`
command which updates a plugin's `version` and `opensearchDashboardsVersion` in the `opensearch_dashboards.json` and the `version`,
`opensearchDashboards.version`, and `opensearchDashboards.templateVersion` in the `package.json` files to match the version of 
OpenSearch Dashboards or ones supplied.

Previously you could also use that tool to start and test your plugin. Currently, you can run 
your plugin along with OpenSearch Dashboards running `yarn start` in the OpenSearch Dashboards repository root folder. Finally, to test 
your plugin you should now configure and use your own tools.

```sh
$ plugin-helpers help

  Usage: plugin-helpers [command] [options]

  Commands:
    build
      Copies files from the source into a zip archive that can be distributed for installation into production
      OpenSearch Dashboards installs. The archive includes the non-development npm dependencies and builds itself using
      raw files in the source directory so make sure they are clean/up to date. The resulting archive can be found at:

        build/{plugin.id}-{opensearchDashboardsVersion}.zip

      Options:
        --skip-archive                       Don't create the zip file, just create the build/opensearch-dashboards directory
        --opensearch-dashboards-version, -k  OpenSearch Dashboards version that the built plugin will target
    
     
    version
      Without any options, it would display information about the versions found in the manifest file. With options, it 
      updates the version and opensearchDashboardsVersion in the opensearch_dashboards.json and the version, 
      opensearchDashboards.version, and opensearchDashboards.templateVersion in the package.json files to the values 
      provided or syncs them with the version of OpenSearch Dashboards. The versions are expected to start with #.#.#
      where # are numbers.
  
      Options:
        --sync                               Update the versions to match OpenSearch Dashboards'
        --plugin-version                     Update the plugin's version to the one specified
        --compatibility-version              Update the plugin's compatibility version to the one specified
   

  Global options:
    --verbose, -v      Log verbosely
    --debug            Log debug messages (less than verbose)
    --quiet            Only log errors
    --silent           Don't log anything
    --help             Show this message

```

### Examples

To produce build artifacts of a plugin in the `build/opensearch-dashboards` directory, without generating a zip archive, and while targeting OpenSearch Dashboards 3.0.0:
```
yarn plugin-helpers build --skip-archive --opensearch-dashboards-version="3.0.0"
```

To synchronize the versions used in a plugin's `opensearch_dashboards.json` and `package.json` files with the version of OpenSearch Dashboards:
```
yarn plugin-helpers version --sync
```
If legacy plugin versions are required:
```
yarn plugin-helpers version --sync legacy
```

To update the compatibility version of the plugin in the `opensearch_dashboards.json` and `package.json` files:
```
yarn plugin-helpers version --compatibility-version="3.0.0"
// or
yarn plugin-helpers version --compatibility-version 3.0.0
```

To synchronize the compatibility version of the plugin with the version of OpenSearch Dashboards but set a specific version for the plugin:
```
yarn plugin-helpers version --sync --plugin-version 1.1.0
```

## Versions

The plugins helpers in the OpenSearch Dashboards repo are available for OpenSearch Dashboards 1.0 and greater. Just checkout the branch of OpenSearch Dashboards you want to build against and the plugin helpers should be up-to-date for that version of OpenSearch Dashboards.


## Configuration

`plugin-helpers` accepts a number of settings for the `build` command which can be specified at runtime or included in a `.opensearch_dashboards-plugin-helpers.json` file if you'd like to bundle those settings with your project.

It will also observe a `.opensearch_dashboards-plugin-helpers.dev.json`, much like OpenSearch Dashboards does, which we encourage you to add to your `.gitignore` file and use for local settings that you don't intend to share. These "dev" settings will override any settings in the normal json config.

All configuration setting listed below can simply can be included in the json config files. If you intend to inline the command, you will need to convert the setting to snake case (ie. `skipArchive` becomes `--skip-archive`).

## Global settings

### Settings for `build`

Setting | Description
------- | -----------
`serverSourcePatterns` | Defines the files that are built with babel and written to your distributable for your server plugin. It is ignored if `opensearch_dashboards.json` has none `server: true` setting defined.
`skipArchive` | Don't create the zip file, leave the build path alone
`skipInstallDependencies` | Don't install dependencies defined in package.json into build output
`opensearchDashboardsVersion` | OpenSearch Dashboards version for the build output (added to package.json)

### Settings for `version`

Setting | Description
------- | -----------
`sync` | As the default behavior, it uses the version of OpenSearch Dashboards to update the plugin's `opensearch_dashboards.json` and `package.json` files.
`set` | Defines the version to be used in the plugin's `opensearch_dashboards.json` and `package.json` files.

## TypeScript support

Plugin code can be written in [TypeScript](http://www.typescriptlang.org/) if desired. To enable TypeScript support create a `tsconfig.json` file at the root of your plugin that looks something like this:

```js
{
  // extend OpenSearch Dashboards's tsconfig, or use your own settings
  "extends": "../../opensearch-dashboards/tsconfig.json",

  // tell the TypeScript compiler where to find your source files
  "include": [
    "server/**/*",
    "public/**/*"
  ]
}
```
