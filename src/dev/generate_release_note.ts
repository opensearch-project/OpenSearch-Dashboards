/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolingLog } from '@osd/dev-utils';
import { join, resolve } from 'path';
import { readFileSync, writeFileSync, Dirent, rm, rename, promises as fsPromises } from 'fs';
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

const log = new ToolingLog({
  level: 'info',
  writeTo: process.stdout,
});

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
        '\n' +
        fileContent.slice(endOfLineIndex + 1);
    } else {
      throw new Error('End of line for "Unreleased" section not found.');
    }
  } else {
    throw new Error("'## [Unreleased]' not found in the file.");
  }

  writeFileSync(path, fileContent);
}

async function deleteFragments(fragmentTempDirPath: string) {
  rm(fragmentTempDirPath, { recursive: true }, (err: any) => {
    if (err) {
      throw err;
    }
  });
}

// Read fragment files and populate sections
async function readFragments() {
  // Initialize sections
  const sections: Changelog = (Object.fromEntries(
    Object.keys(SECTION_MAPPING).map((key) => [key, []])
  ) as unknown) as Changelog;

  const fragmentPaths = await readdir(fragmentDirPath, { withFileTypes: true });
  const failedFragments: string[] = [];

  for (const fragmentFilename of fragmentPaths) {
    // skip non yml or yaml files
    if (!/\.ya?ml$/i.test(fragmentFilename.name)) {
      log.info(`Skipping non yml or yaml file ${fragmentFilename.name}`);
      continue;
    }

    try {
      const fragmentPath = join(fragmentDirPath, fragmentFilename.name);
      const fragmentContents = readFileSync(fragmentPath, { encoding: 'utf-8' });

      try {
        validateFragment(fragmentContents);
      } catch (validationError) {
        log.info(`Validation failed for ${fragmentFilename.name}: ${validationError.message}`);
        failedFragments.push(
          `${fragmentFilename.name} (Validation Error: ${validationError.message})`
        );
        continue;
      }

      const fragmentContentLines = fragmentContents.split('\n');
      // Adding a quotes to the second line and escaping existing " within the line
      fragmentContentLines[1] = fragmentContentLines[1].replace(/-\s*(.*)/, (match, p1) => {
        // Escape any existing quotes in the content
        const escapedContent = p1.replace(/"/g, '\\"');
        return `- "${escapedContent}"`;
      });

      const processedFragmentContent = fragmentContentLines.join('\n');

      try {
        const fragmentYaml = loadYaml(processedFragmentContent) as Changelog;
        for (const [sectionKey, entries] of Object.entries(fragmentYaml)) {
          sections[sectionKey as SectionKey].push(...entries);
        }
      } catch (yamlError) {
        log.info(`Failed to parse YAML in ${fragmentFilename.name}: ${yamlError.message}`);
        failedFragments.push(`${fragmentFilename.name} (YAML Parse Error: ${yamlError.message})`);
        continue;
      }
    } catch (error) {
      log.info(`Failed to process ${fragmentFilename.name}: ${error.message}`);
      failedFragments.push(`${fragmentFilename.name} (Processing Error: ${error.message})`);
      continue;
    }
  }

  if (failedFragments.length > 0) {
    log.info('\nThe following changelog fragments were skipped due to errors:');
    failedFragments.forEach((fragment) => log.info(`- ${fragment}`));
    log.info('\nPlease review and fix these fragments for inclusion in the next release.\n');
  }

  return { sections, fragmentPaths, failedFragments };
}

async function moveFragments(fragmentPaths: Dirent[], fragmentTempDirPath: string): Promise<void> {
  // Move fragment files to temp fragments folder
  for (const fragmentFilename of fragmentPaths) {
    const fragmentPath = resolve(fragmentDirPath, fragmentFilename.name);
    const fragmentTempPath = resolve(fragmentTempDirPath, fragmentFilename.name);
    rename(fragmentPath, fragmentTempPath, () => {});
  }
}

function generateChangelog(sections: Changelog) {
  // Generate changelog sections
  const changelogSections = Object.entries(sections).map(([sectionKey, entries]) => {
    const sectionName = SECTION_MAPPING[sectionKey as SectionKey];
    return entries.length === 0
      ? `### ${sectionName}`
      : `### ${sectionName}\n\n${entries.map((entry) => ` - ${entry}`).join('\n')}`;
  });

  // Generate full changelog
  const currentDate = getCurrentDateFormatted();
  const changelog = `## [${pkgVersion}-${currentDate}](https://github.com/opensearch-project/OpenSearch-Dashboards/releases/tag/${pkgVersion})\n\n${changelogSections.join(
    '\n\n'
  )}`;
  // Update changelog file
  addContentAfterUnreleased(filePath, changelog);
  return changelogSections;
}

function generateReleaseNote(changelogSections: string[]) {
  // Generate release note
  const releaseNoteFilename = `opensearch-dashboards.release-notes-${pkgVersion}.md`;
  const releaseNoteHeader = `# VERSION ${pkgVersion} Release Note`;
  const releaseNote = `${releaseNoteHeader}\n\n${changelogSections.join('\n\n')}`;
  writeFileSync(resolve(releaseNotesDirPath, releaseNoteFilename), releaseNote);
}

(async () => {
  const { sections, fragmentPaths, failedFragments } = await readFragments();

  // Only proceed if we have some valid fragments
  if (Object.values(sections).some((section) => section.length > 0)) {
    // create folder for temp fragments
    const fragmentTempDirPath = await fsPromises.mkdtemp(join(fragmentDirPath, 'tmp_fragments-'));
    // move fragments to temp fragments folder
    await moveFragments(fragmentPaths, fragmentTempDirPath);

    const changelogSections = generateChangelog(sections);
    generateReleaseNote(changelogSections);

    // remove temp fragments folder
    await deleteFragments(fragmentTempDirPath);
  } else {
    log.error('No valid changelog entries were found. Release notes generation aborted.');
    process.exit(1);
  }
})();
