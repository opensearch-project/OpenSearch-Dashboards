import { join, resolve } from 'path';
import { lstatSync, readdirSync } from 'fs';
import { getStorybook, configure } from '@storybook/react';

export interface StoryInfo {
  title: string;
  encodedTitle: string;
}

export interface StoryGroupInfo {
  group: string;
  encodedGroup: string;
  stories: StoryInfo[];
}

function requireAllStories(basedir: string, directory: string) {
  function enumerateFiles(basedir: string, dir: string) {
    let result: string[] = [];
    readdirSync(join(basedir, dir)).forEach(function(file) {
      const relativePath = join(dir, file);
      const stats = lstatSync(join(basedir, relativePath));
      if (stats.isDirectory()) {
        result = result.concat(enumerateFiles(basedir, relativePath));
      } else if (/\.stories\.tsx$/.test(relativePath)) {
        result.push(relativePath);
      }
    });
    return result;
  }
  const absoluteDirectory = resolve(basedir, directory);

  const keys = enumerateFiles(absoluteDirectory, '.');
  function requireContext(key: string) {
    if (!keys.includes(key)) {
      throw new Error(`Cannot find module '${key}'`);
    }
    const fullKey = require('path').resolve(absoluteDirectory, key);
    return require(fullKey);
  }

  requireContext.keys = () => keys;
  return requireContext;
}

function encodeString(string: string) {
  return string
    .replace(/-/g, ' ')
    .replace(/\w-\w/g, ' ')
    .replace(/\//gi, ' ')
    .replace(/-/g, ' ')
    .replace(/[^a-z|A-Z|0-9|\s|\/]+/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function getStorybookInfo(): StoryGroupInfo[] {
  configure(requireAllStories(__dirname, '../stories'), module);
  return getStorybook()
    .filter(({ kind }) => kind)
    .map(({ kind: group, stories: storiesRaw }) => {
      const stories: StoryInfo[] = storiesRaw
        .filter(({ name }) => name)
        .map(({ name: title }) => {
          // cleans story name to match url params
          const encodedTitle = encodeString(title);

          return {
            title,
            encodedTitle,
          };
        });

      const encodedGroup = encodeString(group);

      return {
        group,
        encodedGroup,
        stories,
      };
    });
}
