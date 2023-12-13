/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';
import { readFileSync, writeFileSync, unlinkSync, Dirent } from 'fs';
import { load as loadYaml } from 'js-yaml';
import { readdir } from 'fs/promises';
import { version as pkgVersion } from '../../package.json';
import {
  validateFragment,
  getCurrentDateFormatted,
  Changelog,
  SECTION_MAPPING,
  fragmentDirPath,
  SectionKey,
  releaseNotesDirPath,
  filePath,
} from './generate_release_note_helper';

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
      throw new Error('End of line for "Unreleased" section not found.');
    }
  } else {
    throw new Error("'## [Unreleased]' not found in the file.");
  }

  writeFileSync(path, fileContent);
}

function deleteFragments(fragmentPaths: Dirent[]): void {
  // Delete fragment files
  for (const fragmentFilename of fragmentPaths) {
    const fragmentPath = resolve(fragmentDirPath, fragmentFilename.name);
    unlinkSync(fragmentPath);
  }
}

// Read fragment files and populate sections
async function readFragments() {
  // Initialize sections
  const sections: Changelog = (Object.fromEntries(
    Object.keys(SECTION_MAPPING).map((key) => [key, []])
  ) as unknown) as Changelog;

  const fragmentPaths = await readdir(fragmentDirPath, { withFileTypes: true });
  for (const fragmentFilename of fragmentPaths) {
    // skip non yml or yaml files
    if (!fragmentFilename.name.endsWith('.yml') && !fragmentFilename.name.endsWith('.yaml')) {
      // eslint-disable-next-line no-console
      console.warn(`Skipping non yml or yaml file ${fragmentFilename.name}`);
      continue;
    }

    const fragmentPath = resolve(fragmentDirPath, fragmentFilename.name);
    const fragmentContents = readFileSync(fragmentPath, { encoding: 'utf-8' });

    validateFragment(fragmentContents);

    const fragmentYaml = loadYaml(fragmentContents) as Changelog;

    for (const [sectionKey, entries] of Object.entries(fragmentYaml)) {
      sections[sectionKey as SectionKey].push(...entries);
    }
  }
  return { sections, fragmentPaths };
}

(async () => {
  const { sections, fragmentPaths } = await readFragments();

  // Generate changelog sections
  const changelogSections = Object.entries(sections).map(([sectionKey, entries]) => {
    const sectionName = SECTION_MAPPING[sectionKey as SectionKey];
    return entries.length === 0
      ? `### ${sectionName}`
      : `### ${sectionName}\n\n${entries.map((entry) => ` - ${entry}`).join('\n')}`;
  });

  // Generate full changelog
  const currentDate = getCurrentDateFormatted();
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

  deleteFragments(fragmentPaths);
})();
