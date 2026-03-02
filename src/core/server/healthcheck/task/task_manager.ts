/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from 'opensearch-dashboards/server';
import { ITask, TaskManager as ITaskManager, TaskDefinition } from './types';
import { TaskInfo } from '../../../common/healthcheck';
import { Task } from './task';

/**
 * This class manages the initialization tasks and the internal health check.
 */
export class TaskManager implements ITaskManager {
  protected readonly items: Map<string, ITask> = new Map();

  constructor(protected readonly logger: Logger, protected readonly services: any) {}

  async setup() {
    this.logger.debug('Setup starts');
    this.logger.debug('Setup finished');
  }

  async start() {
    this.logger.debug('Start starts');
    this.logger.debug('Start finished');
  }

  async stop() {
    this.logger.debug('Stop starts');
    this.logger.debug('Stop finished');
  }

  register(task: TaskDefinition) {
    this.logger.debug(`Registering ${task.name}`);

    if (this.items.has(task.name)) {
      throw new Error(
        `[${task.name}] was already registered. Ensure the name is unique or remove the duplicated registration of same task.`
      );
    }

    this.items.set(task.name, new Task(task));
    this.logger.debug(`Registered ${task.name}`);
  }

  get(name: string) {
    this.logger.debug(`Getting task: [${name}]`);

    if (!this.items.has(name)) {
      throw new Error(`Task [${name}] not found`);
    }

    return this.items.get(name) as ITask;
  }

  getAll() {
    this.logger.debug('Getting all tasks');

    return [...this.items.values()];
  }

  /**
   * Run tasks in ascending order, executing same-order tasks in parallel.
   *
   * @param {Array<{ name: string, run: ()=>any|Promise<any>, order?: number }>} tasks
   * @returns {Promise<any[]>} results array in execution order
   */
  private async runTasksInOrder(tasks: any[], cb: (task: ITask) => Promise<TaskInfo>) {
    // 1. Sort by order (undefined → Infinity)
    const sorted = tasks.slice().sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));

    // 2. Group tasks by order
    const groups = [];
    for (const task of sorted) {
      const key = task.order ?? Infinity;
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.order !== key) {
        groups.push({ order: key, tasks: [task] });
      } else {
        lastGroup.tasks.push(task);
      }
    }

    // 3. Execute each group in sequence, but tasks in a group in parallel
    const results = [];
    for (const { tasks: groupTasks } of groups) {
      const promises = groupTasks.map((t) => cb(t));
      const groupResults = await Promise.all(promises);
      results.push(...groupResults);
    }

    return results;
  }

  async run(ctx: any, taskNames?: string[]): Promise<TaskInfo[] | undefined> {
    try {
      if (this.items.size > 0) {
        const allTasks = [...this.items.values()];
        const tasks = taskNames
          ? allTasks.filter(({ name }) => taskNames.includes(name))
          : allTasks;

        return this.runTasksInOrder(tasks, async (item: ITask) => {
          const logger = this.logger.get(item.name);

          try {
            return await item.run({
              services: this.services,
              context: ctx,
              logger,
            });
          } catch (error) {
            logger.error(`Error running task [${item.name}]: ${error.message}`);

            return item.getInfo();
          }
        });
      } else {
        this.logger.info('No tasks');
      }
    } catch (error) {
      this.logger.error(`Error running: ${error.message}`);
    }
  }
}
