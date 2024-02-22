/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';

export const filePath = resolve(__dirname, '..', '..', 'CHANGELOG.md');
export const fragmentDirPath = resolve(__dirname, '..', '..', 'changelogs', 'fragments');
export const fragmentTempDirPath = resolve(__dirname, '..', '..', 'changelogs', 'temp_fragments');
export const releaseNotesDirPath = resolve(__dirname, '..', '..', 'release-notes');

export function getCurrentDateFormatted(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const formattedMonth = month.toString().padStart(2, '0');
  const formattedDay = day.toString().padStart(2, '0');

  return `${year}-${formattedMonth}-${formattedDay}`;
}

export const SECTION_MAPPING = {
  breaking: '💥 Breaking Changes',
  deprecate: 'Deprecations',
  security: '🛡 Security',
  feat: '📈 Features/Enhancements',
  fix: '🐛 Bug Fixes',
  infra: '🚞 Infrastructure',
  doc: '📝 Documentation',
  chore: '🛠 Maintenance',
  refactor: '🪛 Refactoring',
  test: '🔩 Tests',
};

export type SectionKey = keyof typeof SECTION_MAPPING;
export type Changelog = Record<SectionKey, string[]>;

const MAX_ENTRY_LENGTH = 100;

// validate format of fragment files
export function validateFragment(content: string) {
  const sections = content.split('\n\n');

  // validate each section
  for (const section of sections) {
    const lines = section.split('\n');
    const sectionName = lines[0];
    const sectionKey = sectionName.slice(0, -1);

    if (!SECTION_MAPPING[sectionKey as SectionKey] || !sectionName.endsWith(':')) {
      throw new Error(`Unknown section ${sectionKey}.`);
    }
    // validate entries. each entry must start with '-' and a space. then followed by a string. string must be non-empty and less than 50 characters
    const entryRegex = new RegExp(`^-.{1,${MAX_ENTRY_LENGTH}}\\(\\[#.+]\\(.+\\)\\)$`);
    for (const entry of lines.slice(1)) {
      if (entry === '') {
        continue;
      }
      // if (!entryRegex.test(entry)) {
      if (!entryRegex.test(entry.trim())) {
        throw new Error(`Invalid entry ${entry} in section ${sectionKey}.`);
      }
    }
  }
}
