/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import { version as pkgVersion } from '../../package.json';

// Define constant paths
const filePath = resolve(__dirname, '..', '..', 'CHANGELOG.md');
const fragmentDirPath = resolve(__dirname, '..', '..', 'changelogs', 'fragments');
const releaseNotesDirPath = resolve(__dirname, '..', '..', 'release-notes');

// Function to add content after the 'Unreleased' section in the changelog
function addContentAfterUnreleased(path: string, newContent: string): void {
  let fileContent = readFileSync(path, 'utf8');
  const targetString = '## [Unreleased]';
  const targetIndex = fileContent.indexOf(targetString);

  if (targetIndex !== -1) {
    const endOfLineIndex = fileContent.indexOf('\n', targetIndex);

    if (endOfLineIndex !== -1) {
      fileContent =
        fileContent.slice(0, endOfLineIndex + 1) +
        '\n' +
        newContent +
        fileContent.slice(endOfLineIndex + 1);
    } else {
      // eslint-disable-next-line no-console
      console.warn('End of line for "Unreleased" section not found.');
      return;
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn("'## [Unreleased]' not found in the file.");
    return;
  }

  writeFileSync(path, fileContent);
}

// Function to format the current date
function getCurrentDateFormatted(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const formattedMonth = month.toString().padStart(2, '0');
  const formattedDay = day.toString().padStart(2, '0');

  return `${year}-${formattedMonth}-${formattedDay}`;
}

const currentDate = getCurrentDateFormatted();

// Define section mapping
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

type SectionKey = keyof typeof SECTION_MAPPING;
type Changelog = Record<SectionKey, string[]>;

// Initialize sections
const sections: Changelog = (Object.fromEntries(
  Object.keys(SECTION_MAPPING).map((key) => [key, []])
) as unknown) as Changelog;

// Read fragment files and populate sections
const fragmentPaths = readdirSync(fragmentDirPath).filter(
  (path) => path.endsWith('.yml') || path.endsWith('.yaml')
);

for (const fragmentFilename of fragmentPaths) {
  const fragmentPath = resolve(fragmentDirPath, fragmentFilename);
  const fragmentContents = readFileSync(fragmentPath, { encoding: 'utf-8' });
  const fragmentYaml = loadYaml(fragmentContents) as Changelog;

  for (const [sectionKey, entries] of Object.entries(fragmentYaml)) {
    if (!SECTION_MAPPING[sectionKey as SectionKey]) {
      // eslint-disable-next-line no-console
      console.warn(`Unknown section ${sectionKey}. Skipping.`);
      continue;
    }

    sections[sectionKey as SectionKey].push(...entries);
  }
}

// Generate changelog sections
const changelogSections = Object.entries(sections).map(([sectionKey, entries]) => {
  const sectionName = SECTION_MAPPING[sectionKey as SectionKey];
  return entries.length === 0
    ? `### ${sectionName}`
    : `### ${sectionName}\n\n${entries.map((entry) => ` - ${entry}`).join('\n')}`;
});

// Generate full changelog
const changelog = `## [${pkgVersion}-${currentDate}](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/${pkgVersion})

${changelogSections.join('\n\n')}
`;

// Generate release note
const releaseNoteFilename = `opensearch-dashboards.release-notes-${pkgVersion}.md`;
const releaseNoteHeader = `# VERSION ${pkgVersion} Release Note`;
const releaseNote = `${releaseNoteHeader}\n\n${changelogSections.join('\n\n')}`;
writeFileSync(resolve(releaseNotesDirPath, releaseNoteFilename), releaseNote);

// Update changelog file
addContentAfterUnreleased(filePath, changelog);

// Delete fragment files
for (const fragmentFilename of fragmentPaths) {
  const fragmentPath = resolve(fragmentDirPath, fragmentFilename);
  unlinkSync(fragmentPath);
}
