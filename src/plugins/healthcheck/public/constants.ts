/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import wazuh from '../../../../package.json';

export const WAZUH_MAJOR = wazuh.wazuh.version.split('.')[0];
export const WAZUH_MINOR = wazuh.wazuh.version.split('.')[1];

export const TASK = {
  RUN_STATUS: {
    NOT_STARTED: 'not_started',
    RUNNING: 'running',
    FINISHED: 'finished',
  },
  RUN_RESULT: {
    GRAY: {
      value: 'gray',
      label: i18n.translate('healthcheck.gray', { defaultMessage: 'Gray' }),
    },
    GREEN: {
      value: 'green',
      label: i18n.translate('healthcheck.green', { defaultMessage: 'Green' }),
    },
    YELLOW: {
      value: 'yellow',
      label: i18n.translate('healthcheck.yellow', { defaultMessage: 'Yellow' }),
    },
    RED: {
      value: 'red',
      label: i18n.translate('healthcheck.red', { defaultMessage: 'Red' }),
    },
  },
  CONTEXT: {
    INTERNAL: 'internal',
    USER: 'user',
  },
} as const;

export type RESULT = 'green' | 'yellow' | 'red' | 'gray';

export const STATUS_CHECKS_EXPLAIN = {
  green: i18n.translate('healthcheck.status.green', {
    defaultMessage: 'Status: green. The verification was completed successfully.',
  }),
  yellow: i18n.translate('healthcheck.status.yellow', {
    defaultMessage: 'Status: yellow. The verification had some issues but may still work.',
  }),
  red: i18n.translate('healthcheck.status.red', {
    defaultMessage: 'Status: red. The verification failed with an error.',
  }),
  gray: i18n.translate('healthcheck.status.gray', {
    defaultMessage: 'Status: gray. The verification is currently running or has not started yet.',
  }),
  disabled: i18n.translate('healthcheck.status.disabled', {
    defaultMessage: 'Status: disabled. The verification is disabled.',
  }),
};

export const STATUS_CHECK_EXPLAIN = {
  green: i18n.translate('healthcheck.statusCheck.green', {
    defaultMessage: 'The check was completed successfully.',
  }),
  yellow: i18n.translate('healthcheck.statusCheck.yellow', {
    defaultMessage:
      'The non-critical check failed. You can keep using the system, but some features may not be available.',
  }),
  red: i18n.translate('healthcheck.statusCheck.red', {
    defaultMessage: 'The critical check failed. Action is required to resolve this issue.',
  }),
  gray: i18n.translate('healthcheck.statusCheck.gray', {
    defaultMessage: 'The check is currently running or not started yet.',
  }),
  disabled: i18n.translate('healthcheck.statusCheck.disabled', {
    defaultMessage: 'The check is disabled.',
  }),
};
