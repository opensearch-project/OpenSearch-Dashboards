/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Listr from 'listr';

import {
  checkConfigs,
  mergeConfigs,
  checkFilesForUntrackedMessages,
  checkDefaultMessagesInFiles,
} from '../i18n/tasks';
import { FailReporter } from '../i18n';

export async function checkI18n(log, files) {
  const relativeFiles = files
    .filter((file) => file.isJs() || (file.isTypescript() && !file.isTypescriptAmbient()))
    .map((file) => file.getRelativePath());

  const list = new Listr(
    [
      {
        title: 'Checking .i18nrc.json files',
        task: () => new Listr(checkConfigs()),
      },
      {
        title: 'Merging .i18nrc.json files',
        task: () => new Listr(mergeConfigs()),
      },
      {
        title: 'Checking For Untracked Messages based on .i18nrc.json',
        task: () => new Listr(checkFilesForUntrackedMessages(relativeFiles)),
      },
      {
        title: 'Validating Default Messages',
        task: ({ config }) => new Listr(checkDefaultMessagesInFiles(config, relativeFiles)),
      },
    ],
    {
      concurrent: false,
      renderer: 'silent',
    }
  );

  try {
    const reporter = new FailReporter();
    const messages = new Map();
    await list.run({ messages, reporter });

    const num = relativeFiles.length;
    console.log(` succ [i18n-check] ${num} file${num === 1 ? '' : 's'} checked successfully`);
  } catch (error) {
    if (error instanceof FailReporter) {
      return error.errors;
    } else {
      throw error;
    }
  }
}
