/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable no-restricted-syntax */

const fs = require('fs');
const path = require('path');

const startDirs = [
  {
    dir: './docs', // Base directory
    root: true, // Indicates that this is the base directory
  },
  './src',
  './examples',
  './packages',
  './release-notes',
  './scripts',

  {
    dir: './',
    recursively: false, // Do not search recursively from the root directory
    root: true,
  },
]; // Directories to start the search from

const sidebarFile = './docs/_sidebar.md'; // Location to save the generated sidebar
const excludeDirs = ['node_modules', '.git']; // Directories to exclude from the search

// Function to recursively find Markdown files and return a nested structure
function findMarkdownFiles(dir, prefix = '', baseDir = '', recursively = true) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach((entry) => {
    if (entry.isDirectory() && !excludeDirs.includes(entry.name) && recursively) {
      const nestedResults = findMarkdownFiles(
        path.join(dir, entry.name),
        `${prefix}${entry.name}/`,
        baseDir,
        recursively
      );

      if (nestedResults.length > 0) {
        // If there is a readme in the directory, use that as the reference for the directory.
        const readmeIndex = nestedResults.findIndex(
          (item) => item.name.toLowerCase() === 'readme.md'
        );

        if (readmeIndex !== -1) {
          const readme = nestedResults.splice(readmeIndex, 1)[0];
          results.push({
            type: 'directory',
            name: entry.name,
            children: [nestedResults],
            readme: readme,
            baseDir,
          });
        } else {
          results.push({ type: 'directory', name: entry.name, children: nestedResults });
        }
      }
    } else if (entry.name.endsWith('.md') && entry.name !== '_sidebar.md') {
      const docPath = `${prefix}${entry.name}`;
      // Adjust the path based on its base directory ('docs' or 'src')
      const linkPath =
        baseDir === 'docs' ? docPath : `../${baseDir ? baseDir + '/' : ''}${docPath}`;
      results.push({ type: 'file', name: entry.name, path: linkPath.replace(/\\/g, '/') }); // Ensure path format is consistent
    }
  });

  return results;
}

// Function to generate sidebar content from the nested structure
function generateSidebarContent(items, nestLevel = 0) {
  let content = nestLevel === 0 ? '* [Home](/)\n\n' : '';

  // folders first, then files
  items = items.sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
  });

  items.forEach((item) => {
    if (item.type === 'directory') {
      // If there is a readme in the directory, use that as the reference for the directory.
      if (item.readme) {
        const linkLabel = item.name
          .replace(/-/g, ' ')
          .replace(/\.md$/, '')
          .replace(/^\w/, (c) => c.toUpperCase());
        content += `${'  '.repeat(nestLevel)}  - [${linkLabel}](${item.readme.path})\n`;
      } else {
        content += `${'  '.repeat(nestLevel)}  - ${item.name}\n`;
      }
      content += generateSidebarContent(item.children, nestLevel + 1);
    } else if (item.type === 'file') {
      const linkLabel = item.name
        .replace(/-/g, ' ')
        .replace(/\.md$/, '')
        .replace(/^\w/, (c) => c.toUpperCase());
      content += `${'  '.repeat(nestLevel)}  - [${linkLabel}](${item.path})\n`;
    }
  });

  return content;
}

// Adjust the main function call to include the base directory as a parameter
function generateSidebar() {
  let allItems = [];
  startDirs.forEach((directory) => {
    let { dir, recursively, root } = directory;
    if (typeof directory === 'string') {
      recursively = true;
      root = false;
      dir = directory;
    }

    const dirItems = findMarkdownFiles(dir, '', dir.slice(2), recursively); // Remove './' and pass the base directory
    if (dirItems.length > 0 && !root) {
      allItems.push({ type: 'directory', name: dir.slice(2), children: dirItems });
    } else {
      allItems = allItems.concat(
        findMarkdownFiles(dir, '', dir.slice(2), recursively).map((item) => ({
          ...item,
          name: item.name
            .replace(/-/g, ' ')
            .replace(/\.md$/, '')
            .replace(/^\w/, (c) => c.toUpperCase()),
        }))
      ); // Remove './' and pass the base directory
    }
  });
  const sidebarContent = generateSidebarContent(allItems);
  fs.writeFileSync(sidebarFile, sidebarContent);
  console.log('Sidebar generated successfully.');
}

generateSidebar();
