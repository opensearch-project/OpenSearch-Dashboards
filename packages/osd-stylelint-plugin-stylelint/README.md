# Custom Stylelint rules for OpenSearch Dashboards

This package contains custom Stylelint rules used for OpenSearch Dashboards development. Rules are defined in `src/rules` and are the actual logic of the custom rules which are built around parsing a JSON config file passed in and applying the rules defined within there.

This package can work with `@osd/stylelint-config` which houses the JSON config files to be passed into this plugin. The goal being to seperate out OUI compliance rules which can be modified by anyone versus the actual OUI compliance engine which should be only modified by developers.

## Audit styles that are related to custom rules

Setting: 
```
export OUI_AUDIT_ENABLED=true
```

Enables the ability to capture styling that potentially can be subject to compliance when there is a rule that interacts with the styling.

For example, if a style attempts to set a button to have a `background-color: $incorrectVariable()` and the JSON config passed to the compliance engine does not explicitly reject the `$incorrectVariable()` being applied to a button's background color then the linter will pass. But it will output this if the environment variable is set to `true`.

The goal being that setting this environment variable to output a list that can then be added to the JSON config which we can feed back into the compliance engine.
