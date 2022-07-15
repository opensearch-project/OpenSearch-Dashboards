# Wizard

A OpenSearch Dashboards plugin for the visualization experience that makes exploring data and creating visualizations much easier. It will act as an additional way to create visualizations alongside the exiting tools within the current visualizations plugin. The tool will be incremental to the visualization tools available to the user in OpenSearch Dashboards today.

## Usage

To use this plugin, navigate to:

Visualize -> Create Visualization -> Wizard

## Add a visualization (TODO: Cleanup before merging into mainline)

All new visualizations currently reside in [public/visualizations](./public/visualizations). To add a new one, create a new visualization folder and add the required code to setup and register a new vis type.

### Anatomy of a visualization

```
metric/
├─ metric_viz_type.ts
├─ index.ts
├─ to_expression.ts
├─ components/
   ├─ metric_viz_options.tsx
```

Outline:
- index.ts: Exposes the create<Viz>Config function that is used to register the viz type
- <vizName>_viz_type.ts: Contains the config that the type service needs to register the new vis type.
- to_expression.ts: The expression function that the plugin will use to render the visualization given the state of the plugin
- <vizName>_viz_options.tsx: The component that will render the other properties that user can set in the `Style` tab. 

**Notes:**

- Currently only the metric viz is setup so schema properties that other vis types need may not be setup fully and need to be set correctly. 
- `to_expression` is quite custom and can be abstracted into a common utility for different visualizations. Adding more vis types should make it clear as to how this can be done


## Development (TODO: Delete before merging into mainline)

All work for this feature currently happens on the `feature/d-and-d` branch

### Git workflow 

Set main repo as the `upstream` remote
```sh
git remote add upstream https://github.com/opensearch-project/OpenSearch-Dashboards.git
```

Keeping the `feature/d-and-d` branch up to date locally

```sh
git fetch upstream
git checkout feature/d-and-d
git merge upstream/feature/d-and-d
```

See the [OpenSearch Dashboards contributing
guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/master/CONTRIBUTING.md) for instructions
setting up your development environment.
