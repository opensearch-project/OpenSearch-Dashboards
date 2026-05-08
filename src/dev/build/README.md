# dev/build

Build the distributables of OpenSearch Dashboards.

# Quick Start

```sh

# checkout the help for this script
node scripts/build --help

# build a release version
node scripts/build --release

# reuse already downloaded node executables, turn on debug logging
node scripts/build --skip-node-download --debug
```

# Fixing out of memory issues

Building OpenSearch Dashboards and its distributables can take a lot of memory to finish successfully. Builds do make use of child processes, which means you can increase the amount of memory available by specifying `NODE_OPTIONS="--max-old-space-size=VALUE-IN-MEGABYTES"`.

```sh

# Use 4GB instead of the standard 1GB for building
NODE_OPTIONS="--max-old-space-size=4096" node scripts/build --release
```

# Structure

The majority of this logic is extracted from the grunt build that has existed forever, and is designed to maintain the general structure grunt provides including tasks and config. The [build_distributables.js] file defines which tasks are run.

**Task**: [tasks/\*] define individual parts of the build. Each task is an object with a `run()` method, a `description` property, and optionally a `global` property. They are executed with the runner either once (if they are global) or once for each build. Non-global/local tasks are called once for each build, meaning they will be called twice be default, once for the build and receive a build object as the third argument to `run()` which can be used to determine paths and properties for that build.

**Config**: [lib/config.js] defines the config used to execute tasks. It is mostly used to determine absolute paths to specific locations, and to get access to the Platforms.

**Platform**: [lib/platform.js] defines the Platform objects, which define the different platforms we build for. Use `config.getTargetPlatforms()` to get the list of platforms we are targeting in this build, `config.getNodePlatforms()` to get the list of platform we will download node for, or `config.getPlatform` to get a specific platform and architecture.

**Log**: We uses the `ToolingLog` defined in [../tooling_log/tooling_log.js]

**Runner**: [lib/runner.js] defines the runner used to execute tasks. It calls tasks with specific arguments based on whether they are global or not.

**Build**:  [lib/build.js], created by the runner and passed to tasks so they can resolve paths and get information about the build they are operating on.

[tasks/\*]: ./tasks
[lib/config.js]: ./lib/config.js
[lib/platform.js]: ./lib/platform.js
[lib/runner.js]: ./lib/runner.js
[lib/build.js]: ./lib/build.js
[build_distributables.js]: ./build_distributables.js
[../tooling_log/tooling_log.js]: ../tooling_log/tooling_log.js

# Environment variables

All vars below are **optional**; the build works with none of them set. They exist for CI runners, release engineers, and debugging. Values are read at task entry, so exporting them in a shell before invoking `node scripts/build` is sufficient.

| Variable | Default | Effect |
|---|---|---|
| `OSD_BUILD_NO_PIGZ` | unset | Set to `1` to skip `pigz` (parallel gzip) even if it's on `PATH`; forces pure Node `zlib` for `compressTar`. Output is identical gzip either way. |
| `OSD_BUILD_PIGZ_THREADS` | `pigz` default (CPU count) | Integer ≥ 1. Passed as `pigz -p N`. Lower on memory-constrained runners. |
| `OSD_BUILD_PIGZ_STALL_MS` | `300000` (5 min) | Integer ms. If `pigz` neither emits output nor exits for this long, the build aborts with a clear stall error. |
| `OSD_BUILD_GZIP_LEVEL` | `6` dev / `9` release | Integer 0-9 overriding the gzip compression level used by `CreateArchives`. |
| `OSD_BUILD_ARCHIVE_CONCURRENCY` | `2` if `pigz` available, else CPU count (both capped by `platforms.length`) | Integer ≥ 1. Number of platform archives compressed in parallel. |
| `OSD_BUILD_FPM_CONCURRENCY` | `tasks.length` (all in parallel) | Integer ≥ 1. Caps the number of `fpm` OS-package tasks (deb/rpm) running at once. |
| `OSD_BUILD_NO_HARDLINK` | unset | Set to `1` to disable the hardlink-preferred `scanCopy` and force full byte-for-byte copies. Costs disk + time; use only if downstream tooling can't honor the hardlink contract (see `src/dev/build/lib/scan_copy.ts` JSDoc). |
