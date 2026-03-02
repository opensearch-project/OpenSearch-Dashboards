/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { get } from 'lodash';
import { TaskInfo } from 'src/core/common/healthcheck';
import { HealthCheckServiceStartDeps } from './types';
import { TASK } from './constants';

export function mergeArraysOfByProp<T>(arr1: T[], arr2: T[], prop: string) {
  const map = new Map(arr1.map((item: T) => [get(item, prop), { ...item }]));

  arr2.forEach((item: T) => map.set(get(item, prop), { ...item }));

  return [...map.values()];
}
export interface HealthCheckStatus {
  status: TaskInfo['result'];
  checks: TaskInfo[];
}
export class HealthcheckService {
  status$: BehaviorSubject<HealthCheckStatus> = new BehaviorSubject({
    status: 'gray',
    checks: [],
  } as HealthCheckStatus);
  constructor() {}
  setup() {
    const deps = {
      status$: this.status$,
    };
    return deps;
  }
  start(core: HealthCheckServiceStartDeps) {
    const status$ = this.status$;
    const deps = {
      status$: this.status$,
      client: {
        internal: {
          fetch: async (taskNames?: string[]) => {
            try {
              let query;

              if (taskNames && taskNames?.length > 0) {
                query = {
                  name: taskNames.join(','),
                };
              }

              const response = await core.http.get('/api/healthcheck/internal', { query });
              const nextState = this.generateNextState({ checks: response.tasks });
              status$.next(nextState);
              return nextState;
            } catch (error) {
              core.notifications.toasts.add({
                color: 'danger',
                title: 'Error fetching the health check.',
                text: error.message,
              });
              throw error;
            }
          },
          run: async (taskNames?: string[]) => {
            try {
              let query;

              if (taskNames && taskNames?.length > 0) {
                query = {
                  name: taskNames.join(','),
                };
              }

              const response = await core.http.post('/api/healthcheck/internal', { query });

              const nextState = this.generateNextState({
                checks: mergeArraysOfByProp(
                  status$.getValue()?.checks || [],
                  response.tasks,
                  'name'
                ),
              });

              // Update the observer with the merge of results
              status$.next(nextState);

              // Return the requested checks from the response
              return this.generateNextState({ checks: response.tasks });
            } catch (error) {
              core.notifications.toasts.add({
                color: 'danger',
                title: 'Error running the health check.',
                text: error.message,
              });
              throw error;
            }
          },
        },
      },
      getConfig: async () => {
        try {
          return await core.http.get('/api/healthcheck/config');
        } catch (error) {
          core.notifications.toasts.add({
            color: 'danger',
            title: 'Error getting the health check config.',
            text: error.message,
          });
          throw error;
        }
      },
    };

    return deps;
  }
  stop() {}

  computeOverallStatus(checks: HealthCheckStatus['checks']): HealthCheckStatus['status'] {
    let overallStatus = 'green';

    if (
      checks.some(
        ({
          result,
          critical,
          status,
        }: {
          result: TaskInfo['result'];
          critical: TaskInfo['critical'];
          status: TaskInfo['status'];
        }) => !critical && status === 'finished' && result !== TASK.RUN_RESULT.GREEN
      )
    ) {
      overallStatus = 'yellow';
    }

    if (
      checks.some(
        ({
          result,
          critical,
          status,
        }: {
          result: TaskInfo['result'];
          critical: TaskInfo['critical'];
          status: TaskInfo['status'];
        }) => critical && status === 'finished' && result !== TASK.RUN_RESULT.GREEN
      )
    ) {
      overallStatus = 'red';
    }

    return overallStatus as HealthCheckStatus['status'];
  }

  generateNextState({ checks }: { checks: HealthCheckStatus['checks'] }): HealthCheckStatus {
    const status = this.computeOverallStatus(checks);
    return { status, checks: this.sortByProp(checks, 'name') };
  }

  private sortByProp(arr: any[], prop: string, ascending = true) {
    return arr.slice().sort((a, b) => {
      if (get(a, prop) < get(b, prop)) return ascending ? -1 : 1;
      if (get(a, prop) > get(b, prop)) return ascending ? 1 : -1;
      return 0;
    });
  }
}
