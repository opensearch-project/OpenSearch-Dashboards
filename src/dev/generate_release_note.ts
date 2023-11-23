/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import { version as pkgVersion } from '../../package.json';

// Path to the file
const filePath = resolve(__dirname, '..', '..', 'CHANGELOG.md');

function addContentAfterUnreleased(path: string, newContent: string): void {
  // Read the existing content of the file
  let fileContent = readFileSync(path, 'utf8');

  // Define the target string to search for
  const targetString = '## [Unreleased]';

  // Find the index of the target string
  const targetIndex = fileContent.indexOf(targetString);
  if (targetIndex !== -1) {
    // Find the end of the line containing the target string
    const endOfLineIndex = fileContent.indexOf('\n', targetIndex);

    if (endOfLineIndex !== -1) {
      // Insert the new content after the end of the target line
      fileContent =
        fileContent.slice(0, endOfLineIndex + 1) +
        '\n' +
        newContent +
        fileContent.slice(endOfLineIndex + 1);
    } else {
      // eslint-disable-next-line no-console
      console.warn('End of line for target string not found.');
      return;
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn("'## [Unreleased]' not found in the file.");
    return;
  }

  // Write the modified content back to the file
  writeFileSync(path, fileContent);
}

function getCurrentDateFormatted(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Months are 0-based
  const day = now.getDate();

  // Pad the month and day with leading zeros if necessary
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;
  const formattedDay = day < 10 ? `0${day}` : `${day}`;

  return `${year}-${formattedMonth}-${formattedDay}`;
}

const currentDate = getCurrentDateFormatted();

const SECTION_MAPPING = {
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

const SECTION_KEYS = Object.keys(SECTION_MAPPING);
type SectionKey = keyof typeof SECTION_MAPPING;
type Changelog = Record<SectionKey, string[]>;

// const sections: Partial<Changelog> = {};
const sections: Changelog = {
  breaking: [],
  deprecate: [],
  security: [],
  feat: [],
  fix: [],
  infra: [],
  doc: [],
  chore: [],
  refactor: [],
  test: [],
};

const fragmentDirPath = resolve(__dirname, '..', '..', 'changelogs', 'fragments');
const fragmentPaths = readdirSync(fragmentDirPath).filter(
  (path) => path.endsWith('.yml') || path.endsWith('.yaml')
);

for (const fragmentFilename of fragmentPaths) {
  const fragmentPath = resolve(fragmentDirPath, fragmentFilename);
  const fragmentContents = readFileSync(fragmentPath, { encoding: 'utf-8' });
  const fragmentYaml = loadYaml(fragmentContents) as Changelog;

  // const prNumber = fragmentFilename.split('.').slice(0, -1).join('.');

  for (const [sectionKey, entries] of Object.entries(fragmentYaml)) {
    if (!SECTION_KEYS.includes(sectionKey)) {
      // shouldnt be any unknown section coz they are handled during the changesets generation
      // eslint-disable-next-line no-console
      console.log(`Unknown section ${sectionKey} with skip. SKipping`);
      continue;
    }

    const section = sections[sectionKey as SectionKey] || (sections[sectionKey as SectionKey] = []);
    section.push(...entries);
  }
}

const changelogSections = [];

for (const [sectionKey, entries] of Object.entries(sections)) {
  const sectionName = SECTION_MAPPING[sectionKey as SectionKey];
  if (entries.length === 0) {
    changelogSections.push(`### ${sectionName}`);
    continue;
  }
  changelogSections.push(`### ${sectionName}

${entries.map((entry) => ` - ${entry}`).join('\n')}`);
}

const changelog = `## [${pkgVersion}-${currentDate}](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/${pkgVersion})

${changelogSections.join('\n\n')}
`;
// generate the release note in the /release-notes folder
const REALEASENOTE_FILENAME = `opensearch-dashboards.release-notes-${pkgVersion}.md`;
const REALEASENOTE_HEADER = `# VERSION ${pkgVersion} Release Note`;
const releasenote = `${REALEASENOTE_HEADER}

${changelogSections.join('\n\n')}
`;
// console.log(`${changelogSections.join('\n\n')}`);
// console.log(resolve(__dirname, '..', '..', 'release-notes', REALEASENOTE_FILENAME));
writeFileSync(resolve(__dirname, '..', '..', 'release-notes', REALEASENOTE_FILENAME), releasenote);
// writeFileSync(resolve(__dirname, '..', '..', 'CHANGELOG.md'), changelog + fileContent);
addContentAfterUnreleased(filePath, changelog);
