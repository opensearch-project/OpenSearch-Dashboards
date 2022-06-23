# OpenSearch Dashboards Plugin Generator

This package can be used to generate an OpenSearch Dashboards plugin from the OpenSearch Dashboards repo.

## Setup

Before you can use this plugin generator you must setup your [OpenSearch Dashboards development environment](../../CONTRIBUTING.md#development-environment-setup). If you can successfully run `yarn osd bootstrap` then you are ready to generate plugins!

## Compatibility

The plugin generator became a part of the OpenSearch Dashboards project as of OpenSearch Dashboards 1.0. 

## Quick Start

To target the current development version of OpenSearch Dashboards just use the default  `main` branch.

```sh
node scripts/generate_plugin --name my_plugin_name -y
# generates a plugin in `plugins/my_plugin_name`
```

To target 1.0, use the `1.0` branch.

```sh
git checkout 1.x
yarn osd bootstrap # always bootstrap when switching branches
node scripts/generate_plugin --name my_plugin_name -y
# generates a plugin for OpenSearch Dashboards 1.0 in `../opensearch-dashboards-extra/my_plugin_name`
```

The generate script supports a few flags; run it with the `--help` flag to learn more.

```sh
node scripts/generate_plugin --help
```

## Updating

Since the Plugin Generator is now a part of the OpenSearch Dashboards repo, when you update your local checkout of the OpenSearch Dashboards repository and `bootstrap` everything should be up to date!

> ***NOTE:*** These commands should be run from the OpenSearch Dashboards repo, and `upstream` is our convention for the git remote that references https://github.com/opensearch-project/OpenSearch-Dashboards.git, unless you added this remote you might need to use `origin`.

```sh
git pull upstream main
yarn osd bootstrap
```

## Plugin Development Scripts

Generated plugins receive a handful of scripts that can be used during development. Those scripts are detailed in the README.md file in each newly generated plugin, and expose the scripts provided by the [OpenSearch Dashboards plugin helpers](../osd-plugin-helpers), but here is a quick reference in case you need it:

> ***NOTE:*** All of these scripts should be run from the generated plugin.

  - `yarn osd bootstrap`

    Install dependencies and crosslink OpenSearch Dashboards and all projects/plugins.

    > ***IMPORTANT:*** Use this script instead of `yarn` to install dependencies when switching branches, and re-run it whenever your dependencies change.

  - `yarn build`

    Build a distributable archive of your plugin.

To start opensearch dashboards run the following command from OpenSearch Dashboards root.

  - `yarn start`

    Start OpenSearch Dashboards and have it include this plugin. You can pass any arguments that you would normally send to `bin/opensearch-dashboards`

      ```
      yarn start --opensearch.hosts http://localhost:9220
      ```

For more information about any of these commands run `yarn ${task} --help`. For a full list of tasks run `yarn run` or take a look in the `package.json` file.
