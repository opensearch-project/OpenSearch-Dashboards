/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */
import { Logger } from '@osd/logging';
import { TaskInfo } from '../../../common/healthcheck';

export interface TaskDefinition {
  name: string;
  run: (ctx: any) => any;
  // Define the order to execute the task. Multiple tasks can take the same order and they will be executed in parallel
  order?: number;
  critical?: boolean;
}

export interface ITask extends TaskInfo {
  runInternal: (ctx: any) => any;
  order?: number;
  run: (...params: any[]) => Promise<TaskInfo>;
  getInfo: () => TaskInfo;
}

// Task manager
export interface TaskManager {
  register: (task: TaskDefinition) => void;
  get: (name: string) => ITask;
  getAll: () => ITask[];
}

export interface TaskManagerRunTaskContext<S, C> {
  services: S;
  context: C;
  logger: Logger;
}
