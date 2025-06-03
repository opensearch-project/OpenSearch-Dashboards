/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18nLoader } from '@osd/i18n';
import { write, Task } from '../lib';
import { getTranslationPaths } from '../../../legacy/server/i18n/get_translations_path';
import { I18N_RC, DEFAULT_DIRS_WITH_RC_FILES } from '../../i18n/constants';

const TRANSLATIONS_PATH = 'i18n';

export const CopyTranslations: Task = {
  description: 'Copying translations into platform-generic build directory',

  async run(config, log, build) {
    const repoRoot = config.resolveFromRepo();

    log.info('Gathering translations');

    const allTranslationPaths = await getTranslationPaths({
      cwd: repoRoot,
      // `,.` is added for backward compatibility
      // ToDo: Remove `,.` for next major release
      glob: `{${DEFAULT_DIRS_WITH_RC_FILES.join(',')},.}/${I18N_RC}`,
    });

    i18nLoader.registerTranslationFiles(allTranslationPaths);

    log.info('Combining translations');

    const translationFiles: string[] = [];

    for (const locale of i18nLoader.getRegisteredLocales()) {
      const { formats, messages } = await i18nLoader.getTranslationsByLocale(locale);
      const translationFilename = `${locale}.json`;
      translationFiles.push(translationFilename);
      await write(
        build.resolvePath(`${TRANSLATIONS_PATH}/${translationFilename}`),
        JSON.stringify({ formats, messages })
      );
    }

    log.info('Generating translation manifest');

    await write(
      build.resolvePath(`${TRANSLATIONS_PATH}/${I18N_RC}`),
      JSON.stringify({ translations: translationFiles })
    );
  },
};
