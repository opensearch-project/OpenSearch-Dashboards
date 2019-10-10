import { join } from 'path';
import { readdirSync } from 'fs';
import { getStorybook } from '@storybook/react';

export interface StoryInfo {
  title: string;
  encodedTitle: string;
}

export interface StoryGroupInfo {
  group: string;
  encodedGroup: string;
  stories: StoryInfo[];
}

function requireAllStories() {
  const normalizedPath = join(__dirname, '../stories');

  readdirSync(normalizedPath).forEach((file) => {
    require(join(normalizedPath, file));
  });
}

function encodeString(string: string) {
  return string
    .replace(/\//gi, ' ')
    .replace(/[^a-z|A-Z|0-9|\s|\/]+/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function getStorybookInfo(): StoryGroupInfo[] {
  requireAllStories();

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
