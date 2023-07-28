# Read Only Tenant Mode

There are two distinct functionalities for "read-only" access in Dashboards. One of them is associated with roles and one is associated with tenants. Regarding the first one, the Dashboards Security plugin contains a feature of hiding all plugin navigation links except Dashboards and Visualizations when the logged-in user has a certain role. The second one is limiting Dashboards access rights via assigning a specific role to a tenant (therefore, making a tenant read-only). Due to past issues and the deprecation of the first functionality, using read-only tenants is now the recommended way to limit users' access to Dashboards.

For more context, see [this group issues of problems connected with read-only roles](https://github.com/opensearch-project/security/issues/2701).

## Read Only Tenant

A read-only tenant looks like this:
```
read_only_tenant_role:
  tenant_permissions:
  - tenant_patterns:
    - "human_resources"
    allowed_actions:
    - "kibana_all_read"
```

If the `kibana_all_read` role is assigned (without `kibana_all_write`), a given tenant provides solely read-only access.

Dashboards Security plugin recognizes the selection of read-only tenant after logging in and sets the capabilities associated with write access or showing write controls to false for a variety of plugins. This can be easily checked for example by trying to re-arrange some visualizations on Dashboards. Such action will be resulting in a 403 error due to limited read-only access.

## Design

Whenever a plugin registers capabilities that should be limited (in other words, set to false) for read-only tenants, such capabilities should be listed in a separate capability called `hide_for_read_only` that is an array of strings, containing capabilities that are set to false whenever Dashboards Security Plugin detects a read-only tenant.

For example:
```
export const capabilitiesProvider = () => ({
  indexPatterns: {
    save: true,
    hide_for_read_only: ['save'],
  },
});
```

In this case, we might assume that a plugin relies on the `save` capability to limit saving changes somewhere in the UI. Therefore, this `save` capability is listed in the `hide_for_read_only` array and will be set to `false` whenever a read-only tenant is accessed.

## Scope

Affected plugins:
- `advanced_settings` (`save` capability)
- `console` (`save` capability)
- `dashboard` (`createNew`, `showWriteControls`, `saveQuery` capabilities)
- `index_patterns` (`save` capability)
- `discover` (`save` capability)
- `saved_objects_management` (`edit`, `delete` capabilities)
- `visualize` (`createShortUrl`, `delete`, `save`, `saveQuery` capabilities)

## Requirements

This feature will only work if you have the [`security` plugin](https://github.com/opensearch-project/security) installed on your OpenSearch cluster with https/authentication enabled.

## Usage

To set it up, you have to add Role's "Tenant permissions" a new tenant with `Read only` access.
