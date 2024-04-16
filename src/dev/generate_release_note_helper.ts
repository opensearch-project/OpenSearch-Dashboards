/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';

export const filePath = resolve(__dirname, '..', '..', 'CHANGELOG.md');
export const fragmentDirPath = resolve(__dirname, '..', '..', 'changelogs', 'fragments');
export const releaseNotesDirPath = resolve(__dirname, '..', '..', 'release-notes');

export function getCurrentDateFormatted(): string {
  return new Date().toISOString().slice(0, 10);
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
// Each entry must start with '-' and a space, followed by a non-empty string, and be no longer that MAX_ENTRY_LENGTH characters
const entryRegex = new RegExp(`^-.{1,${MAX_ENTRY_LENGTH}}\\(\\[#.+]\\(.+\\)\\)$`);

// validate format of fragment files
export function validateFragment(content: string) {
  const sections = content.split(/(?:\r?\n){2,}/);

  // validate each section
  for (const section of sections) {
    const lines = section.split('\n');
    const sectionName = lines[0];
    const sectionKey = sectionName.slice(0, -1);

    if (!SECTION_MAPPING[sectionKey as SectionKey] || !sectionName.endsWith(':')) {
      throw new Error(`Unknown section ${sectionKey}.`);
    }
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
