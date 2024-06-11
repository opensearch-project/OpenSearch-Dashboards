# Read-only Mode

There are two distinct functionalities for "read-only" access in Dashboards. One of them is associated with roles and one is associated with tenants. Regarding the first one, the Dashboards Security plugin contains a feature of hiding all plugin navigation links except Dashboards and Visualizations when the logged-in user has a certain role (more about it in [Read-only Role](#read-only-role)).

The second one is limiting Dashboards access rights via assigning a specific role to a tenant (therefore, making a tenant read-only). Due to past issues and the deprecation of the first functionality, using read-only tenants is now the recommended way to limit users' access to Dashboards.

## Design

Whenever a plugin registers capabilities that should be limited (in other words, set to false) for read-only tenants, such capabilities should be registered through `registerSwitcher` with using method `core.security.readonlyService().hideForReadonly()`

### Example

```ts
public setup(core: CoreSetup) {
  core.capabilities.registerProvider({
    myAwesomePlugin: {
      show: true,
      save: true,
      delete: true,
    }
  });

  core.capabilities.registerSwitcher(async (request, capabilites) => {
    return await core.security.readonlyService().hideForReadonly(request, capabilites, {
      myAwesomePlugin: {
        save: false,
        delete: false,
      },
    });
  });
}
```

In this case, we might assume that a plugin relies on the `save` and `delete` capabilities to limit changes somewhere in the UI. Therefore, those capabilities are processed through `registerSwitcher`, they will be set to `false` whenever a read-only tenant is accessed.

If `registerSwitcher` will try to provide or remove capabilites when invoking the switcher will be ignored.

*In case of a disabled / not installed `security` plugin changes will be never applied to a capabilites.*

## Requirements

This feature will only work if you have the [`security` plugin](https://github.com/opensearch-project/security) installed on your OpenSearch cluster with https/authentication enabled.

## Read-only Role

The role is called `kibana_read_only` by default, but the name can be changed using the dashboard config option `opensearch_security.readonly_mode.roles`. One big issue with this feature is that the backend site of a Dashboard Security plugin is completely unaware of it. Thus, users in this mode still have write access to the Dashboards saved objects via the API as the implementation effectively hides everything except the Dashboards and Visualization plugins.

**We highly do not recommend using it!**

For more context, see [this group issues of problems connected with read-only roles](https://github.com/opensearch-project/security/issues/2701).

### Usage

1. Go to `Management > Security > Internal users`
2. Create or select an already existing user
3. Add a new `Backend role` called `kibana_read_only` (or use name used in `opensearch_security.readonly_mode.roles`)
4. Save changes

## Read-only Tenant (recommended)

Dashboards Security plugin recognizes the selection of read-only tenant after logging in and sets the capabilities associated with write access or showing write controls to false for a variety of plugins. This can be easily checked for example by trying to re-arrange some visualizations on Dashboards. Such action will be resulting in a 403 error due to limited read-only access.

### Usage

1. Prepare tenant:
    * Use an existing tenant or create a new one in `Management > Security > Tenants`
2. Prepare role:
    * Go to `Management > Security > Roles`
    * Use an existing role or create a new one
    * Fill **index permissions** with:
        * `indices:data/read/search`
        * `indices:data/read/get`
    * Add new **tenant permission** with:
        * your name of the tenant
        * read only
3. Assign a role to a user:
    * Go to role
    * Click the tab `Mapped users`
    * Click `Manage mapping`
    * In `Users` select the user that will be affected
