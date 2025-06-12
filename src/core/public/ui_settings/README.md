# UI Settings

OpenSearch Dashboards provide global, user, and workspace-level UI settings, which govern the overall behavior of the application. Global and user scope settings are stored in separate documents, while workspace-scoped UI settings are stored within the workspace itself, as they serve as workspace-isolated objects.

This README explains the new multi-scope ui settings adminiration with the previous one.

## Background

In the previous implementation, we assumed that most types of settings had only a single scope. However, there is an exception— default data source, which has two scopes: workspace and global.
When processing workspace-scoped settings, we follow these rules:

* When retrieving UI settings within a workspace, the system merges the workspace UI settings with the global UI settings. If the same setting is defined in both places, the workspace UI setting takes priority.
* When updating UI settings within a workspace, only the workspace UI settings are modified, while the global UI settings remain unchanged.

We handle the above logic in workspace_ui_settings_client_wrapper, where we explicitly identify the default data source and apply hardcoded logic to override.  Although this approach works, it's not ideal, as the number of multiple scoped settings may continue to grow, leading to increased complexity and reduced flexibility.

To support multi-scope UI settings, we need to address the client-side and server-side aspects of the UI settings architecture. On the server side, we already provide a set of CRUD APIs that support scopes, for example, setMany and getUserProvide. However, on the public side, none of the operations currently make use of scopes. 

Each time a page loads, the server-side rendering service performs a comprehensive get operation, retrieving all UI settings—both default values and user-provided values across user, workspace, and global scopes—and merges them. The default settings and user-provided settings are combined, and the injectedMetadata plugin retrieves this merged result via getLegacyMeta.  Ui settings client caches these results internally. As a result, subsequent get operations read directly from this cache for efficiency. When a set operation is performed, client flushes the cached changes and sends a batched update to the server with api setMany. Once the update succeeds, the local cache is updated to reflect the changes.  So, in such approach, scope handling is ignored on the public side and deferred to the server, which is responsible for determining the appropriate scope for each UI settings update. 


The entire flow can be summarized as follows:

![single-Scope UI Settings Diagram](https://plantuml.corp.amazon.com/plantuml/svg/xLPDJzj04BtlhnYbKecb4EuMeQYeGaWW8jAUeAhMti7UOjRMVeH6AF-zOw-Tn1-XgL1llKMpyzwysNcpyRcnN5ltdB4e_mMZkOio6O_WmxLCKlivSyXuR7CDesy6zGYu0SSAGiXO5bnPYii5MYjLi)


## Implementation

To support multi-scoped UI settings and ensure that scope is properly utilized on both the public and server sides, the implementation can be divided as follows:

### Enhance the scope handling in server-side ui settings client

Most of the time, we won’t explicitly pass a scope, since most settings only exist within a single scope. In such cases, we delegate the scope resolution logic to the server. 

*Read*:
Server-side user settings client exposes a getUserProvided method to handle reads. Regardless of whether a specific key is being requested or not, the general logic is to retrieve all user-provided settings across supported scopes or all scopes. The resolution logic follows these rules:

    1. Read with scope: If a scope is explicitly passed, validate first and return settings directly from the specified scope.
    2. Read without scope: if not, continue to follow the established precedence rules: resolving settings in the order of user → workspace → global,  values from higher-priority scopes override those from lower-priority ones.
    3. Read multi-scope settings without scope:  (1) If all scopes define a value for a given setting, the system will resolve the final value based on scope priority.(2) if the highest-priority scope does not provide a value, the system will fall back to the lower-priority scope(most time global scope) when merging. In such cases, when public side intends to read the multi-scope settings, it should explicitly pass the desired scope to ensure accurate retrieval.

Specifically for workspace-scoped UI settings, we refactored  workspace_ui_settings_client_wrapper. If the user is not currently in a workspace, the wrapper will throw a GenericNotFoundError, which is caught and handled by the ui_settings_client, returning an empty {} .
If the user is in a workspace, the wrapper performs the following steps:

    1. Retrieves the workspace saved object.
    2. Retrieves the global config.
    3. Overrides the global config attributes with the workspaceObject.attributes.uiSettings

*Write*
When updating settings, the server must determine the correct scope for each setting being written. The write logic should follow these rules：

    1. Write with scope: If a scope is explicitly passed, validate first and update settings directly to the specified scope.
    2. Write without scope: 
        1. If the setting defines a single scope in registration, honor the scope defined.
        2. If the setting does not define a scope  in registration, we will use global to keep backward compatibility.
    3. Write multi-scope settings without scope: show a deprecation warning for now and will throw error in next major release because UI setting does not know which scope it should use.

When updating settings without an explicitly provided scope, ui_settings_client will first group the changes by scope—separating them into workspace, user, and global scopes. This is determined by scope definitions provided during the UI setting registration phase. If a setting does not explicitly define a scope, it is treated as global scope by default. 
Specifically for workspace-scoped UI settings—since they are stored within the workspace's saved object—we will refactor the workspace_ui_settings_client_wrapper to specifically intercept workspace-scoped setting updates by identifying keys prefixed with current_workspace.
The wrapper handles two key logic:

    * If the user is not currently in a workspace, the wrapper will throw a BadRequestError.
    * If the user is in a workspace, the wrapper performs the following steps:

        1. updates the workspace saved object.
        2. Retrieves the global config.
        3. Overrides the global config attributes with the updated workspaceObject.attributes.uiSettings

### Support scope in public side

Enhance ui_settings_client methods to support scope. 

1. We initialize multiple ui_settings_apis—one for each scope—and one as default to handle cases where no scope is provided.
2. We will introduce a new method for ui_settings_client, getUserProvidedWithScope, which is specifically responsible for sending GET requests to the server based on the currently specified scope.
3. Add scope support to ui_settings_client.set. Specifically, within ui_settings_client, there will be a check: if the current setting is multi-scoped, then after a successful update, the client will refresh its cache by fetching settings from all scopes and merging them using the default ui_settings_api.

The entire flowcan be summarized as follows:

![Multi-Scope UI Settings – Detailed Flow](https://plantuml.corp.amazon.com/plantuml/svg/pLbRRzis57xNhpXhWTa6OkTTgBrUq0O3sZM8L_IXAm9QEhQuAA96Kd7T8FzzXwBkecCbQTC0UOWedjjtxjPBfPdKsMNiZNxZIH1d8K8QiyGSJHdEk7dbUIln3PwTPgkO1y_WUSmtaNuTP-YnG0i9dnHAy59Yn0EU4Z5yualKcYUR9Seh7g3xvPkO8pqp1PQrVNRVVPNorei_atynq1X-GCr2ffc7IGYaPg6haOkIT4rvSj4YFAEBAArg_EfsrLhlFWjveL8Mu7d6pvMzfiw3_EBvLh8qHTbcHh0ClRjaLnX-N1cR2j76g1LJ2BCBlc89W-VRY6kixPpFuPHj4DuB5iBIk17cSy_hsWVJHTSi7pQept33bKQ9uNXYN13YccMnLbxNFKJVvUc3H9t9f2OQAjLWSYh55GzBkHcTUDv6YYm55OWKWIlOn6B5OfSgFQ30rn5NCuai75_d3Fo2_6RYzMyJYmBGN1_WeG-1IDPyS_w2XmklHDibgZIxJU6KqREz0Cng1cL866_sZD-MWUQoVqWK-j27f69wCu5_4ed_PQWAwpCfS-_)
