# HealthCheck

The `HealthCheck` provides a mechanism to see and manage the health of checks.
> :warning: In this stage, this only runs in the internal context that only can apply to the `Global` tenant if multitenancy is enabled.

This allows to register the check tasks that can be used by the plugin in the `setup` lifecycle.

# Configuration

| setting |description | default value | allowed values |
| --- | --- | --- | --- |
| `healthcheck.enabled` | define if the health check is enabled or not | true | true, false |
| `healthcheck.checks_enabled` | define the checks that are enabled. This is a regular expression or a list of regular expressions (NodeJS compatibles) | `.*` | string or list of strings |
| `healthcheck.interval` | define the interval to run the health check after the initial check | 15m | 5m to 24h |
| `healthcheck.retries_delay` | define the wait time after a failed overall health check | 2.5s | 0 to 1m |
| `healthcheck.max_retries` | define the maximum count of retries of the overall health check that can be executed | 5 | integer, minimum 1 |
| `healthcheck.server_not_ready_troubleshooting_link` | define the troubleshooting link in the not-ready server | URL to Wazuh docs | a valid URL |

## Enabling checks

By default all the checks are enabled.

The user can configure the enabled checks using the `healthcheck.checks_enabled` setting.

For example, assumming the following checks are registered:
- task1
- task2
- another-task
- another-check

Examples To only enable the `task1` and `task2` checks, you can provide the following configuration:

```xml
healthcheck.checks_enabled: '^test.*' # Enable the task1 and task2. Start with "test" and then any character
healthcheck.checks_enabled: ['^test1$', '^another-task$'] # Enable the task1 and another-task.
healthcheck.checks_enabled: '^another.*' # Enable the another-task and another-check.
healthcheck.checks_enabled: 'task.*' # Enable the task1, task2, another-task.
```

# Lyfecycle

## Server

1. Setup the health check

1.1. Setup the configuration

1.2. Register API endpoints routes

2. Register check task in the plugin `setup` lifecycle

3. Start the health check

If this is enabled:

3.1. Mark the enabled task according to the `checks_enabled` filter

3.2. Run the initial check. If some critical task fails, then the dashboard server will be blocked in the `server is not ready yet` view

3.3. Once passed the initial check, this sets a scheduled check, to update the check status

```
  server    log   [10:04:59.857] [info][healthcheck] Checks are ok
  server    log   [10:04:59.857] [info][healthcheck] Set scheduled checks each 300000ms
```

3.4. Continue the server startup

## Frontend

1. Setup the health check
2. Start the health check
  If this is enabled, then this register a button to be mounted in the menu

Other plugins can register tasks in the plugin `setup` lifecycle that will be run on the server starts lifecycle.

Optionally the registered tasks could be retrieved to run in API endpoints or getting information about its status.

# Scopes

The scopes can be used to get a specific context (clients, parameters) that is set in the `scope` property of the task context.
> :warning: In this stage, this only runs in the internal context that only can apply to the `Global` tenant if multitenancy is enabled.

The `internal` scoped tasks keep the same execution data (see [Task execution data](#task-execution-data)).

When the app starts, all the registered tasks run for the `internal` scope.

# Tasks

## Task definition interface

A task can be defined with:

```ts
export interface TaskDefinition {
  // Task identifier. This should be unique. See the name convention.
  name: string;
  run: (ctx: any) => any;
  /* Define the order to execute the task. Multiple task can take the same order and they will be executed in parallel.
  If it is not defined, the task will be executed as last order group. */
  order?: number;
  // Other metafields
  [key: string]: any;
  // Define if the task is critical. If it fails, the initial check can block the initialization or this could mark the overall status as failed in the scheduled checks.
  critical: boolean
}
```

## Register a task

```ts
// plugin setup
setup(core){

  // Register a task
  core.healthCheck.register({
    name: 'custom-task',
    run: (ctx) => {
      console.log('Run from wazuhCore starts' )
    },
    order: 1
    critical: false
  });
}
```

The `ctx` property provide the context execution.

- `internal`:

```ts
interface {
    services: {},
    context: { services: CoreStartServices, scope: 'internal' },
    logger: LoggerAdapter { logger: [BaseLogger] }
  }

```

## Task name convention

- lowercase
- kebab case (`word1-word2`)
- use colon ( `:` ) for tasks related to some entity that have different sub entities.

```
entity_identifier:entity_specific
```

For example:

```
index-pattern:alerts
index-pattern:statistics
index-pattern:vulnerabilities-states
```

## Task execution data

The task has the following data related to the execution:

```ts
interface InitializationTaskRunData {
  name: string;
  status: 'not_started' | 'running' | 'finished';
  result: 'green' | 'yellow' | 'red' | 'gray' | null;
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null; // seconds
  data: any;
  error: string | null;
  enabled: boolean;
  critical: boolean;
}
```

## API

The backend service registers routes to manage the related data:

- `GET /api/healthcheck/config`: allow to retrieve the health check configuration.

- `GET /api/healthcheck/internal`: allow to retrieve the run info of the checks. This allows to use the `name` query parameter to get specific checks.

- `POST /api/healthcheck/internal`: allow to run info of the checks. This allows to use the `name` query parameter to get specific checks.

## Definitions and rules

* **Task / individual check**

  * status (only `not_started`, `in_progress`, or `finished`)
  * result (one of `green`, `yellow`, `red`, or `gray`)

    * `green`: OK
    * `red`: failed — critical
    * `yellow`: failed — non‑critical
    * `gray`: unknown / not executed (typically because `status != "finished"`)
  * **Failed** ⟶ when `status == "finished"` and `result` is `red` or `yellow`.
  * `critical` remains a task metadata that classifies the check. In the "server is not ready yet" UI, the distinction critical/non‑critical is derived from the `result` color: `red` = critical failure, `yellow` = non‑critical failure.
    * `true` = **critical**; `false` or absent = **non-critical**.
  * When a task is considered “failed”

    * `failed` ⇢ `isEnabled == true` and `status == "finished"` and `result == "red"`.
    * Criticality does **not** affect whether it is failed; it only affects the **summary**.

* **Check summary (aggregate of the set of tasks)**

  * `result` can be: `red`, `yellow`, `green` or `gray`.
  * **Red** in the summary when there is **at least one critical task with `result == "red"`**.
  * **Yellow** in the summary when there are **no critical failures** and there is **at least one non‑critical failed task** (`result == "yellow"`).
  * **Green** in the summary when all tasks are **finished** and the critical ones are `green`.
  * **Gray** in any other case (e.g., all `gray` or no tasks enabled).
  * The summary does **not** have `critical` (because it is already inferred from the tasks).

### Answers to the doubts

1. **“For a task to be considered *failed*, must it be different from `green` and `gray`; that is `red` or `yellow`?”**
   **Yes.** In an **individual task**, a task is considered *failed* when `status == "finished"` and `result` is `red` (**critical failure**) or `yellow` (**non‑critical failure**).

2. **“If `result` is `red`, doesn’t that already imply it’s critical and `critical` is redundant?”**
   In the "server is not ready yet" UI, the `result` color encodes the *criticality of a failure*: `red` = critical, `yellow` = non‑critical. The `critical` field, however, still exists in the task metadata and can be used by services or other UIs; when a task succeeds (`green`), it may still be classified as critical or not by metadata even though the color is not conveying that distinction.

### Quick table

| Level         | Possible `result` values         | `yellow`? | When is it *failed*?                   |
| ------------- | -------------------------------- | --------- | -------------------------------------- |
| Task / Check  | `red`, `yellow`, `green`, `gray` | Yes       | If `result` is `red` or `yellow`       |
| Check Summary | `red`, `yellow`, `green`, `gray` | Yes       | N/A (aggregate state only)             |

### Conclusion:
- The `yellow` result is supported at the task level to represent **non‑critical failures**, and it also appears in the summary when there are no critical failures.
- The `critical` property remains part of the task metadata. In the not‑ready UI, criticality of failures is conveyed via `result` color (`red` vs `yellow`).


# Notes

- The list of enabled checks are listed in a `info` log in the app logs. This can be used to know the check task names to create a regular expression to filter the enabled checks.

```
server    log   [10:04:59.621] [info][healthcheck] Enabled checks [2]: [server-api:connection-compatibility,index-pattern:alerts,index-pattern:monitoring,index-pattern:statistitcs,index-pattern:vulnerabilities-states,index-pattern:states-inventory,index-pattern:states-inventory-groups,index-pattern:states-inventory-hardware,index-pattern:states-inventory-hotfixes,index-pattern:states-inventory-interfaces,index-pattern:states-inventory-networks,index-pattern:states-inventory-packages,index-pattern:states-inventory-ports,index-pattern:states-inventory-processes,index-pattern:states-inventory-protocols,index-pattern:states-inventory-system,index-pattern:states-inventory-users,index-pattern:states-fim-files,index-pattern:states-fim-registry-keys,index-pattern:states-fim-registry-values]
```
- If the health check is disabled, a `info` log is displayed in the app logs.

# Debug

## Server

The backend service uses a logger tagged as `healthcheck`, so the user can use that keyword to filter the related logs.

```console
journalctl -ru wazuh-dashboard | grep healthcheck
```

The user can increase the verbosity with the `logging.verbose: true` setting.

## Frontend

The UI allows exporting the checks to a JSON file to be shared easily.

- Not ready yet server: export the health check results to a JSON file using the `Export checks` button
```
{
  checks: [
    {
      "name": "server-api:connection-compatibility",
      "status": "finished",
      "result": "green",
      "data": {},
      "createdAt": "2025-08-08T10:04:59.428Z",
      "startedAt": "2025-08-08T10:19:59.858Z",
      "finishedAt": "2025-08-08T10:19:59.948Z",
      "duration": 0.09,
      "error": null,
      "enabled": true,
      "critical": true,
    }
  ],
  _meta: {
    server: "not_ready"
  }
}
```
- ready server: export the health check results to a JSON file using the health check UI
```
{
  status: "yellow",
  checks: [
    {
      "name": "server-api:connection-compatibility",
      "status": "finished",
      "result": "green",
      "data": {},
      "createdAt": "2025-08-08T10:04:59.428Z",
      "startedAt": "2025-08-08T10:19:59.858Z",
      "finishedAt": "2025-08-08T10:19:59.948Z",
      "duration": 0.09,
      "error": null,
      "enabled": true,
      "critical": true,
    }
  ],
  _meta: {
    server: "ready"
  }
}
```
