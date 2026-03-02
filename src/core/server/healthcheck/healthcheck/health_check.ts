/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */
import { Logger } from 'opensearch-dashboards/server';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { TaskInfo } from 'src/core/common/healthcheck';
import { retry, TASK, TaskManager, TaskContext } from '../task';
import { addRoutesReadyServer } from './routes';
import { ScheduledIntervalTask } from './scheduled_task';
import { HealthCheckConfig } from '../../../common/healthcheck';

export interface HealthCheckStatus {
  ok: boolean | null;
  checks: TaskInfo[] | null;
  error?: string | null;
}

/**
 * Wraps `fn` so only one call runs at a time.
 * Subsequent calls return the same Promise until the first completes.
 */
function singlePromiseInstance(fn: Function, serializer = JSON.stringify) {
  const activePromises: {
    [key: string]: Promise<any>;
  } = {};

  return function (this: HealthCheck, ...args: any[]) {
    const serialized: string = serializer(...(args as [any, any]));
    // If no active run, invoke and store its promise
    if (!activePromises[serialized]) {
      activePromises[serialized] = Promise.resolve((fn as Function).apply(this, args)).finally(
        () => {
          delete activePromises[serialized];
        }
      );
    }
    // Return the in-flight or just-finished promise
    return activePromises[serialized];
  };
}

/**
 * Filters an array of task names by an array of regex patterns.
 *
 * @param {string[]} list           - Array of list name strings to filter.
 * @param {string[]} regexFilters   - Array of regex patterns as strings.
 *                                     Patterns can be plain (e.g. "^foo")
 *                                     or in slash-notation with flags (e.g. "/bar$/i").
 * @returns {string[]}              - A new array containing only matching list names.
 */
export function filterListByRegex(list: string[], regexFilters: string[]) {
  // Helper: convert a string into a RegExp object
  const toRegExp = (str: string) => {
    // If in /pattern/flags form, extract pattern and flags
    const slashForm = str.match(/^\/(.+)\/([gimsuy]*)$/);
    if (slashForm) {
      return new RegExp(slashForm[1], slashForm[2]);
    }
    // Otherwise treat the entire string as the pattern, no flags
    return new RegExp(str);
  };

  // Compile all filters up front, ignoring invalid ones
  const compiled = regexFilters.reduce((arr, pat) => {
    try {
      arr.push(toRegExp(pat));
    } catch (e) {
      // console.warn(`Invalid regex "${pat}" skipped.`);
    }
    return arr;
  }, [] as RegExp[]);

  // Filter: include a task if any regex matches
  return list.filter((task) => compiled.some((rx) => rx.test(task)));
}

export class HealthCheck extends TaskManager {
  status$: BehaviorSubject<HealthCheckStatus> = new BehaviorSubject({
    ok: null,
    checks: [],
    error: null,
  } as HealthCheckStatus);
  private statusSubscriptions: Subscription = new Subscription();
  private _enabled: boolean = false;
  private _retryDelay: number = 0;
  private _maxRetryAttempts: number = 0;
  private _internalScheduledCheckTime: number = 0;
  private _checks_enabled: string[] = [];
  private _server_not_ready_troubleshooting_link: string = '';
  private scheduled?: ScheduledIntervalTask;
  private _coreStartServices: any;
  public runInternal: (names?: string[], scope?: TaskContext) => Promise<any>;
  constructor(logger: Logger, services: any = {}) {
    super(logger, services);
    this.runInternal = singlePromiseInstance(this._runInternal).bind(this);
  }

  getCheckInfo(taskName: string) {
    const task = this.get(taskName);
    return task.getInfo();
  }

  getChecksInfo(taskNames?: string[]) {
    const tasks: string[] = taskNames || [...this.items.keys()];

    return tasks.map((taskName) => this.getCheckInfo(taskName));
  }

  setCheckResult(name: string, result: TaskInfo['result']) {
    const task = this.get(name);

    if (task) {
      task.result = result;
    }
  }

  async setup(...args: any[]) {
    const [core, config] = args;
    this._enabled = config.enabled;
    this._retryDelay = config.retries_delay.asMilliseconds();
    this._maxRetryAttempts = config.max_retries;
    this._internalScheduledCheckTime = config.interval.asMilliseconds();
    this._server_not_ready_troubleshooting_link = config.server_not_ready_troubleshooting_link;
    if (typeof config.checks_enabled === 'string') {
      this._checks_enabled = [config.checks_enabled];
    } else {
      this._checks_enabled = config.checks_enabled;
    }

    this.logger.debug('Adding API routes');
    const router = core.http.createRouter('/api/healthcheck');
    addRoutesReadyServer(router, { healthcheck: this, logger: this.logger });
    this.logger.debug('Added API routes');
  }

  private filterEnabledChecks() {
    const allTaskNames = [...this.items.keys()];

    return filterListByRegex(allTaskNames, this._checks_enabled);
  }

  private async _runInternal(names?: string[], scope: TaskContext = TASK.CONTEXT.INTERNAL) {
    const taskNames = names || this.filterEnabledChecks();

    return this.runWithDecorators(
      {
        services: { core: this._coreStartServices },
        scope,
      },
      taskNames
    );
  }

  async runInitialCheck() {
    this.logger.debug('Waiting until all checks are ok...');
    this.runInternal(undefined, TASK.CONTEXT.INTERNAL_INITIAL).catch(() => {});
    await this.status$
      .pipe(
        filter(({ ok }: HealthCheckStatus, _index: number) => Boolean(ok)),
        take(1)
      )
      .toPromise();

    this.logger.info('Checks are ok');
    return;
  }

  async start(...args: any[]) {
    this._coreStartServices = args[0];
    const enabledChecks = this.filterEnabledChecks();

    // Define props to task items
    [...this.items.values()].forEach((item) => {
      if (enabledChecks.includes(item.name)) {
        item.enabled = true;
      } else {
        item.enabled = false;
      }
      item.critical = Boolean(item.critical) || false;
    });

    if (!this._enabled) {
      this.logger.info('Disabled. Skip start');
      return;
    }

    if (enabledChecks.length > 0) {
      this.logger.info(`Enabled checks [${enabledChecks.length}]: [${enabledChecks.join(',')}]`);
    } else {
      this.logger.info(`Disabled health check due to no enabled checks.`);
      this._enabled = false;
      return;
    }

    await this.runInitialCheck();

    this.logger.debug('Setting scheduled checks');
    this.scheduled = new ScheduledIntervalTask(async () => {
      try {
        this.logger.debug('Running scheduled check');
        await this.runInternal(undefined, TASK.CONTEXT.INTERNAL_SCHEDULED);
      } catch (error) {
        this.logger.error(`Error in scheduled check: ${error.message}`);
      } finally {
        this.logger.debug('Scheduled check finished');
      }
    }, this._internalScheduledCheckTime);
    this.scheduled.start();
    this.logger.info(`Set scheduled checks each ${this._internalScheduledCheckTime}ms`);
  }

  async stop() {
    this.logger.debug('Stop starts');
    this.scheduled?.stop();
    this.statusSubscriptions.unsubscribe();
    this.logger.debug('Stop finished');
  }

  async _run(ctx: any, taskNames?: string[]) {
    let ok: null | boolean = null;
    let checks: any[] = [];
    let error = null;
    try {
      this.logger.debug('Starting');
      if (this.items.size === 0) {
        this.logger.debug('No checks. Skipping');
        ok = true;
      } else {
        this.logger.debug('Running checks');

        checks = (await this.run(ctx, taskNames)) as TaskInfo[];
        ok =
          Array.isArray(checks) &&
          checks.every(
            ({ status, result, critical }) =>
              status === TASK.RUN_STATUS.FINISHED &&
              (critical ? result === TASK.RUN_RESULT.GREEN : true)
          );
      }

      this.logger.debug(`ok: [${ok}]. checks [${checks?.length}]`);
    } catch (err) {
      this.logger.error(`There an error: ${err.message}`);
      ok = false;
      error = err.message;
    }

    const data = {
      ok,
      checks,
      error,
    };

    if (error) {
      throw error;
    }

    return data;
  }

  async runWithDecorators(ctxUpper: any, taskNamesUpper?: string[]) {
    return retry(
      async (ctx: any, taskNames?: string[]) => {
        const data = await this._run(ctx, taskNames);
        if (data.error) {
          throw new Error(data.error);
        }
        const failedCriticalChecks = data.checks?.filter(
          ({ status, result, critical }) =>
            critical && status === TASK.RUN_STATUS.FINISHED && result === TASK.RUN_RESULT.RED
        );
        if (failedCriticalChecks?.length) {
          throw new Error(
            `Some checks failed: [${failedCriticalChecks.length}/${data.checks.length}]`
          );
        }
        // Emit message through observer
        /* WARNING: this emits the data related to the executed checks. If we need a global state this should be combined. Adding an execution related to the user
        context should not emit a new value. This could need to be refactored to support the user context case. */
        this.status$.next(data);

        return data;
      },
      {
        maxAttempts: this._maxRetryAttempts,
        delay: this._retryDelay,
      }
    )(ctxUpper, taskNamesUpper);
  }

  /**
   * Subscribe to changes in the health check
   * @param fn
   * @returns
   */
  subscribe(fn: (params: HealthCheckStatus) => void) {
    const subscription = this.status$.subscribe(fn);
    this.statusSubscriptions.add(subscription);
    return subscription;
  }

  getConfig(): HealthCheckConfig {
    return {
      enabled: this._enabled,
      retries_delay: this._retryDelay,
      max_retries: this._maxRetryAttempts,
      interval: this._internalScheduledCheckTime,
      checks_enabled: this._checks_enabled,
      server_not_ready_troubleshooting_link: this._server_not_ready_troubleshooting_link,
    };
  }
}
