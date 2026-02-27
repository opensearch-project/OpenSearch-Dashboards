# Proposed Saved Object Access Control with Workspaces

## Introduction
Issue #4615 proposed the "workspace" experience for users to organize their work within OpenSearch Dashboards. It described the experience for users to manages the permissions to access the saved objects they own. Based on the workspace experience proposal, we proposes this saved objects access control design in this document. 

### Problem with current implementation

As of v2.7, OpenSearch Dashboards supports [multi-tenancy feature](https://opensearch.org/docs/latest/security/multi-tenancy/tenant-index/) for saved objects access conrol. The existing  implementation closely couple OpenSearch Dashboards with one single OpenSearch cluster, which acts as the OpenSearch Dashboards data store as well as identity source. While the tenancy feature for OpenSearch Dashboards data access control is a coarse-grained model, one user will have access to all object in a tenant, or they have no access to any object in a teannt. It also requires administrators to centrally manage the user access to any tenant, and barely support saved objects sharing. 

This document discusses the proposed data access control for OpenSearch Dashboards, which is independent from the *multi-tenancy* feature provided by the security plugin. 

Glossary

* **Saved object**: Any data that is managed by OpenSearch Dashboards are called saved objects, such as index patterns, visualization and dashboard definition. In a common setup, each saved object is a document stored in `.opensearch_dashboards` index. In some context, it is also called library items, in #4615
* **Workspace**: a logical container of OpenSearch Dashboards features and saved objects

## Assumptions & Scopes

* Authentication is out of the scope. We can assume the users are authenticated and user profile (user name and group info) has been injected into each request
* Feature (API) access control is out of scope
* Data (saved objects) access control is in scope

## Design

### Personas

There are following personas in *Workspace* use cases:
* **Super admin**: the administrator of the OpenSearch Dashboards, who has complete access to all functions and data of OpenSearch Dashboards.
* **Workspace admin**: Workspace admin have complete access to workspace configurations and saved objects in the workspace. Workspace creator will become the workspace admin when a workspace is created. Workspace admin most time can be used exchangeably with and workspace owner. Workspace admin
* **Workspace operator**: workspace operator has permission to view, create and update saved objects in the workspace.
* **Workspace viewer**: workspace operator only has permission to view the saved objects in the workspace

Please note that, the workspace admin, operator and viewer persona are specific to the workspace. e.g. one workspace operator in one workspace can be an admin in another workspace.

super-admin is a stack level role, it can be configured in the `opensearch_dashboards.yml` config file.

### Discretionary Access Control for Data Access Control

In order to support allowing a resource owner to manage the access to the resource feature, we can employ discretionary access control model. The idea is that, for each OpenSearch Dashboards saved object, we can attach an ACL (access control list) to it to save the principals and permission to operate that saved object. When a user is attempting to perform any operation on that saved object, we will first of all evaluate the ACL and then allow or deny the operation accordingly.

#### Why not using role based access control model

In existing OpenSearch products, all access control follows role/attributes based access control model, where a user can have several roles, while each role has corresponding permissions. The issue with the role based access control model is that, it requires administrator to centrally manage all access policies, which defines what principals can perform what actions on what resources. With admin managed access policies, OpenSearch Dashboards users cannot grant other users permissions to access specific resources, nor can they add other users to new workspaces. Creating workspaces and managing user access to workspaces will become admin responsibility, which isn't a simple collaboration experience.

### Workspace and Saved Objects

Workspace is a newly introduced type of OpenSearch Dashboards data, it is a container which organize the functions and saved objects, so the saved object in a workspace inherit the permissions settings from the workspace. One saved object can potentially in multiple workspaces, thus it inherits the permission settings from all the workspaces it is assigned to.

#### Permissions

Based on the proposed workspace experience, an user may have following type of permissions on OpenSearch Dashboards data:

* read
* write (read_and_write)
    * the write permission means the user update the saved object, and can add this saved object to another workspace, or update the ACL of the object so that the object can be shared to others

For workspaces, a user may have following 3 type of permissions:

* management
* library_read
* library_write (library_read_and_write)

the management permission allows the principal to update the workspace settings, like enabling or disabling features in the workspace, as well as updating the ACLs for the workspace, such as granting permissions of other principals to access this workspace. *library_read* and *library_write* permission will be used to control the user/group permissions on the saved objects in the workspace.

With this permission definition

* a user is the workspace admin if they have management permission of the workspace
* a user can access/use a workspace if they have either library_read, or library_write permission or management permission of the workspace
* a user can view a saved object if 
    * they have read or write permission of the saved object, or 
    * they have library_read or library_write or admin permission of one of the workspace that saved object is associated to.
* a user can edit a saved object if
    * they have write permission of the saved object, or
    * they have library_write or admin permission of one of the workspace that saved object is associated to
* a user can create saved object in a workspace if they have library_write permission of the workspace


#### ACL

The ACLs can be represented as following:

```
{
  "permissions": {
    "<permission_type_1>": [
       "<principal_1>",
       "<principal_2>"
    ],
    "<permission_type_2>": [
       "<principal_3>",
       "<principal_4>"
    ],
  } 
}
```

We can also allow wildcard `*` to indicate any authenticated identity in the ACL.

For example, if we want to allow finance_manager group to manage the workspace, and allow *finance_analyst* groups to build dashboards in the workspace, the workspace ACLs may look like:

```
{
  "permissions": {
    "management": [
       "group/finance_manager"
    ],
    "library_write": [
       "group/finance_analyst"
    ],
  } 
}
```

While if we want to allow user-1 to modify a saved object, and one can only view a saved object, the ACL of that common saved object will look like:

```
{
  "permissions": {
    "read": [
       "*"
    ],
    "library_write": [
       "user/user-1"
    ],
  }
}
```


ACLs can be considered as sub-resource or attributes of a OpenSearch Dashboards data record, so users who have the write permission to the data record can modify the ACL.

**Orphan objects**
This means a user can remove themselves from the ACL of a saved object. Once a user self-remove from a saved object’s ACL, other user having write permission can add the user back if needed. We can add additional checks to make sure any saved object will at least have some identities in the ACL to avoid orphan objects. However, in the case that the only owner of the object get removed from the user directory, which caused the objects becoming orphan, we will need super-admin to get involved to deal with the orphan data records.



#### Initial ACLs of OpenSearch Dashboards data

Each OpenSearch Dashboards data record will have an initial default ACL when it is created. 

When a workspace is created, the creator will by default have the management permission of that workspace. Then the creator can grant other users permissions to manage and perform operations in the workspace.  
 
And when a saved object (ie. visualization) is created

* If there is a context workspace, the saved object will by default be associated to the context workspace and doesn’t have its specific ACL. 
* If there is no context workspace (Do we support this use case?), the creator will by default have the write permission of that object, so that they can add the saved object to a workspace and grant other users permissions to access this saved object.

#### Access privilege evaluation

In the existing implementation, both Dashboards server and customer can modify the saved objects. e.g., Dashboards server manages the metadata index mapping, and handles index migration etc. While on the other hand, OpenSearch Dashboards uses user identities to perform CRUD operations on the visualization objects (index-patterns, visualizations, dashboards etc.), because OpenSearch Dashboards doesn’t have authN and authZ capabilities, it needs to rely on the backend OpenSearch to perform the authZ even for OpenSearch Dashboards data. With this native access control implementation in OpenSearch Dashboards, we will be able to have the authZ performed within OpenSearch Dashboards server, then access the OpenSearch Dashboards metadata store using OpenSearch Dashboards server identity, thus unified the OpenSearch Dashboards data handling.

OpenSearch Dashboards uses the [saved objects APIs](https://github.com/opensearch-project/OpenSearch-Dashboards/tree/main/src/core/server/saved_objects/routes) to perform CRUD operations against saved objects. And in order to apply the access control to the OpenSearch Dashboards data, we can implement a privilege evaluator component and embed it into the saved object database operations to enforce that users can only operate the data they have access to.

For single and bulk CRUD operations, the operations are performed by saved object ids, thus OpenSearch Dashboards can fetch the saved object ACLs by the saved object id and evaluate the user permission before sending the response back to client side. For common saved objects, the privilege evaluator will evaluate the ACLs of the saved object itself and the ACLs of the workspaces that object is associated to to determine if that operation should be allowed or denied. While for workspaces, it only needs to evaluate the ACL of that workspace itself.

For the [find](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/server/saved_objects/routes/find.ts) API which lists the saved objects based on different search conditions, we will need to construct a search filter that can be applied to the query when performing searches against database.

OpenSearch Dashboards provided a couple approaches to intercept saved objects operations, such as using [ClientWrapper](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/server/saved_objects/service/lib/scoped_client_provider.ts#L74) and [SavedObjectsClientFactory](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/server/saved_objects/service/lib/scoped_client_provider.ts#L82) . We can leverage these interception mechanisms to simplify the privilege evaluation implementation.


#### Where to store ACLs

The ACL is a logically a sub-resource/attribute that is attached to OpenSearch Dashboards resources, and the same access control mechanism should apply to the ACL as the saved object it attaches to.  We can either embed the ACL as attribute to the saved object, or store it separately as the standalone record, depending on what database is used by OpenSearch Dashboards. e.g. in the case of using NoSQL database as OpenSearch Dashboards metadata store, such as using OpenSearch index, embed the ACL into the saved object document as an attribute can simplify the privilege evaluation. while if using relational DB as OpenSearch Dashboards metadata store, storing ACLs as separate data records will be simpler.

### Sharing with saved object hierarchy

There are generally 3 ways to share saved objects in this design

* Grant principals permissions to access workspace
    * Only workspace admin can perform this operation
* Add saved objects to another workspace
    * the user needs to have write permission in both source and destination workspaces
* Grant principals permissions to access specific saved objects
    * the user needs to have write permission to the saved objects they want to share

If a user only have read permission on the objects, they will be able to copy the object to an workspace they have access to. But this is not a typical “sharing”, as they make new object instances instead of really sharing the original objects.

Given OpenSearch Dashboards saved objects has dependency hierarchy, such as dashboard depends on visualizations, and visualization in tern depends on index pattern. In any of the sharing cases, if a saved objects is shared, all its direct and transitive dependencies will also be shared. For example, if a dashboard is shared, then all the visualizations, index patterns that are used in the dashboard will be shared.

On the other hand, similarly, when removing data access to a saved object, we will need to check if this object is being referenced by another saved object, and where removing user permission on saved object can cause broken reference in the saved object hierarchy. If so, we will need to let the user to confirm if they want to force updating the permission.


### Role based feature/API access control

We can still use role based access control (RBAC) model for OpenSearch Dashboards feature/API access control, in addition to the ACL-based data access control. OpenSearch Dashboards admin can configure the feature access policy to control user access to certain OpenSearch Dashboards APIs. e.g. if we only want to allow a certain user group to create workspaces, we can implement such RBAC policy and enforcement to only allow create workspace API (essentially create saved object API where the object type is workspace) to be called by specified user groups. 

And similarly we can apply the same API access control to other APIs such as alerting/ISM APIs etc. We will need to define actions for each API we want to add access control, and implement policy enforcement logic for those APIs (e.g. as API interceptors).

The role based feature access control is not conflict with the ACL-based saved object access control. We can add the feature access control when there is a need to manage user access to OpenSearch Dashboards APIs without impacting the saved object access.


## Appendix

### User private saved objects and app owned saved objects support

We may want to support user private saved objects in OpenSearch Dashboards, e.g. a user can have user level preferences such as light/dark theme, default search result size etc. And we may also support user level data source credentials in the future. This made user level private data a special type of saved objects, thus its access control will be different from common saved objects. User private data can only be read and written by the user.

We can still apply the same high level approach to the user private data records. The ACL attached to the user private data only allows the user’s own principal to access the data. While in the privilege evaluations component, we will need to enforce the user private data ACL cannot be modified by anyone. 

Similar to user private saved objects, there are some type of saved objects are owned by the OpenSearch Dashboards application, such as telemetry data records. Those data are generated by OpenSearch Dashboards application and should not be available to common users. The ACL of those data should be set to only allow admin to access.

### What are the impacts to plugins

OpenSearch Dashboards provides a flexible plugin frameworks, and pretty much all functions in OpenSearch Dashboards are implemented as plugins. e.g. home page is a plugin, visualizations and dashboards are plugins, we also have other plugins outside of OpenSearch Dashboards repo, such as observability.

This saved object access control doesn’t impact the OpenSearch Dashboards plugins which do not store saved objects in OpenSearch Dashboards metadata store. While for the plugins that are saving saved objects in OpenSearch Dashboards metadata store, we would expect all the access to save objects are performed by calling SavedObjectClient APIs thus all the user access to saved objects are evaluated by the privilege evaluator.

The privilege evaluation logic are implemented in the database access layer, thus there won’t be SavedObjectClient interface changes. So we there won’t be code change campaigns for plugins to accommodate the new OpenSearch Dashboards data access control.

### Do we support anonymous users? 

We can support anonymous user access. Anonymous user is a special identity which has a preserved user name in the system. that identity can be added into the ACL so that anonymous users will have certain permissions to the saved objects depending on the ACLs.

### Is there any scaling issue of ACL-based access control?

The ACL is attached to the data records. We will usually expect a few users/groups in the ACL, so the total user count should not be a scaling challenge
