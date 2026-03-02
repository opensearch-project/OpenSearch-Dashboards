/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

export const TASK = {
  RUN_STATUS: {
    NOT_STARTED: 'not_started',
    RUNNING: 'running',
    FINISHED: 'finished',
  },
  RUN_RESULT: {
    NULL: null,
    GRAY: 'gray',
    GREEN: 'green',
    YELLOW: 'yellow',
    RED: 'red',
  },
  CONTEXT: {
    INTERNAL: 'internal',
    INTERNAL_INITIAL: 'internal-initial',
    INTERNAL_SCHEDULED: 'internal-scheduled',
    USER: 'user',
  },
} as const;
