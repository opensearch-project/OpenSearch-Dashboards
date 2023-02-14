# @osd/monaco-next

A customized version of monaco of 0.20.0 that is automatically configured the way we want it to be when imported as `@osd/monaco-next`. Additionally, imports to this package are automatically shared with all plugins using `@osd/ui-shared-deps`.

Includes custom xjson language support. The `opensearch_ui_shared` plugin has an example of how to use it, in the future we will likely expose helpers from this package to make using it everywhere a little more seamless.