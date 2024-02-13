/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import { version as pkgVersion } from '../../package.json';

const CHANGELOG_HEADER = `# CHANGELOG

Inspired from [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)`;

const SECTION_MAPPING = {
  breaking: '💥 Breaking Changes',
  deprecate: 'Deprecations',
  feat: '📈 Features/Enhancements',
  fix: '🐛 Bug Fixes',
  infra: '🚞 Infrastructure',
  doc: '📝 Documentation',
  chore: '🛠 Maintenance',
  refactor: '🪛 Refactoring',
  test: '🔩 Tests',
};

const SECTION_KEYS = Object.keys(SECTION_MAPPING);
type SectionKey = keyof typeof SECTION_MAPPING;
type Changelog = Record<SectionKey, string[]>;

const sections: Partial<Changelog> = {};

const fragmentDirPath = resolve(__dirname, '..', '..', 'changelogs', 'fragments');
const fragmentPaths = readdirSync(fragmentDirPath).filter(
  (path) => path.endsWith('.yml') || path.endsWith('.yaml')
);

for (const fragmentFilename of fragmentPaths) {
  const fragmentPath = resolve(fragmentDirPath, fragmentFilename);
  const fragmentContents = readFileSync(fragmentPath, { encoding: 'utf-8' });
  const fragmentYaml = loadYaml(fragmentContents) as Changelog;

  const prNumber = fragmentFilename.split('.').slice(0, -1).join('.');

  for (const [sectionKey, entries] of Object.entries(fragmentYaml)) {
    if (!SECTION_KEYS.includes(sectionKey)) {
      // eslint-disable-next-line no-console
      console.warn(`Unknown section ${sectionKey}. Ignoring`);
      continue;
    }

    const section = sections[sectionKey as SectionKey] || (sections[sectionKey as SectionKey] = []);
    section.push(
      ...entries.map(
        (entry) =>
          `${entry} ([#${prNumber}](https://github.com/opensearch-project/OpenSearch-Dashboards/pull/${prNumber}))`
      )
    );
  }
}

const changelogSections = [];

for (const [sectionKey, entries] of Object.entries(sections)) {
  if (!entries) {
    continue;
  }

  const sectionName = SECTION_MAPPING[sectionKey as SectionKey];

  changelogSections.push(`### ${sectionName}

${entries.map((entry) => ` - ${entry}`).join('\n')}`);
}

const changelog = `${CHANGELOG_HEADER}

## [${pkgVersion}](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/${pkgVersion})

${changelogSections.join('\n\n')}
`;

writeFileSync(resolve(__dirname, '..', '..', 'CHANGELOG.md'), changelog);
