/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */
// import { TASK } from '../healthcheck/constants';
import { TASK } from './constants';
import { ITask, TaskDefinition } from './types';
import { TaskInfo } from '../../../common/healthcheck';

export class Task implements ITask {
  public name: string;
  public order?: number;
  public readonly runInternal: any;
  public status: ITask['status'] = TASK.RUN_STATUS.NOT_STARTED;
  public result: ITask['result'] = TASK.RUN_RESULT.GRAY;
  public data: any = null;
  public createdAt: ITask['createdAt'] = new Date().toISOString();
  public startedAt: ITask['startedAt'] = null;
  public finishedAt: ITask['finishedAt'] = null;
  public duration: ITask['duration'] = null;
  public error = null;
  public enabled: ITask['enabled'] = false;
  public critical: ITask['critical'] = false;

  constructor(task: TaskDefinition) {
    this.name = task.name;
    this.runInternal = task.run;
    this.order = task.order;
    this.critical = Boolean(task.critical);
  }

  private init() {
    this.status = TASK.RUN_STATUS.RUNNING;
    this.result = TASK.RUN_RESULT.GRAY;
    this.data = null;
    this.startedAt = new Date().toISOString();
    this.finishedAt = null;
    this.duration = null;
    this.error = null;
  }

  async run(...params: any[]): Promise<TaskInfo> {
    if (this.status === TASK.RUN_STATUS.RUNNING) {
      throw new Error(`Another instance of task ${this.name} is running`);
    }

    let error;

    try {
      this.init();
      this.data = await this.runInternal(...params);
      this.result = TASK.RUN_RESULT.GREEN;
    } catch (error_) {
      error = error_;
      if (this.critical) {
        this.result = TASK.RUN_RESULT.RED;
      } else {
        this.result = TASK.RUN_RESULT.YELLOW;
      }
      this.error = error_.message;
    } finally {
      this.status = TASK.RUN_STATUS.FINISHED;
      this.finishedAt = new Date().toISOString();

      const dateStartedAt = new Date(this.startedAt as string);
      const dateFinishedAt = new Date(this.finishedAt);

      this.duration = ((dateFinishedAt.getTime() - dateStartedAt.getTime()) as number) / 1000;
    }

    if (error) {
      throw error;
    }

    return this.getInfo();
  }

  getInfo() {
    return {
      name: this.name,
      status: this.status,
      result: this.result,
      data: this.data,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
      duration: this.duration,
      error: this.error,
      enabled: this.enabled,
      critical: this.critical,
    };
  }
}
