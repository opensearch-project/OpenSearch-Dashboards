# @osd/mfe

Module Federation (MF) build for OpenSearch Dashboards UI plugins.

This package powers a **parallel, additive** build that turns each UI plugin into
an MF remote, served from a CDN and selected at runtime by an MFE registry. It
runs alongside the existing `@osd/optimizer` build and does **not** change its
behavior. With no MFE flag, OSD behaves exactly as before.

See `docs/01-MFE-DESIGN.md` (workspace root) for the full design.

## CLI

Invoked through `scripts/build_mfe.js`:

```sh
# List the UI plugins discovered via @osd/optimizer (id + directory)
node scripts/build_mfe --list
```

Discovery reuses OSD's existing chain
(`OptimizerConfig.create()` -> `findOpenSearchDashboardsPlatformPlugins()` ->
`getPluginBundles()`); it is read-only and does not trigger a build.

`--plugin <id>` and `--all` (actual MF builds into `target/mfe/<id>/`) are added
in later Phase 1 stories.
