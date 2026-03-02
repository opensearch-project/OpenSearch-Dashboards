/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { Duration } from 'moment';

export interface TaskInfo {
  name: string;
  status: 'not_started' | 'running' | 'finished';
  result: 'green' | 'yellow' | 'red' | 'gray';
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null; // seconds
  data: any;
  error: string | null;
  enabled: boolean;
  critical: boolean;
}

export interface ITask extends TaskInfo {
  run: <Context = any, Result = any>(ctx: Context) => Promise<Result>;
  getInfo: () => TaskInfo;
}

export interface HealthCheckConfigDefinition {
  enabled: boolean;
  checks_enabled: string | string[];
  retries_delay: Duration;
  max_retries: number;
  interval: Duration;
  server_not_ready_troubleshooting_link: string;
}

export type HealthCheckConfig = Omit<HealthCheckConfigDefinition, 'retries_delay' | 'interval'> & {
  retries_delay: number;
  interval: number;
};

export interface HealthCheckStatus {
  status: 'green' | 'yellow' | 'red' | 'gray';
  checks: TaskInfo[];
}
