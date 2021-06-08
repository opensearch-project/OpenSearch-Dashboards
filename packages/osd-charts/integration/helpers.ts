/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* eslint-disable jest/no-export */

import { lstatSync, readdirSync } from 'fs';
import path from 'path';

import { getStorybook, configure } from '@storybook/react';

import { Rotation } from '../packages/charts/src';
// @ts-ignore
import { isLegacyVRTServer } from './config';

export type StoryInfo = [string, string, number];

export type StoryGroupInfo = [string, string, StoryInfo[]];

function enumerateFiles(basedir: string, dir: string) {
  let result: string[] = [];
  readdirSync(path.join(basedir, dir)).forEach((file) => {
    const relativePath = path.join(dir, file);
    const stats = lstatSync(path.join(basedir, relativePath));
    if (stats.isDirectory()) {
      result = result.concat(enumerateFiles(basedir, relativePath));
    } else if (/\.stories\.tsx$/.test(relativePath)) {
      result.push(relativePath);
    }
  });
  return result;
}

function requireAllStories(basedir: string, directory: string) {
  const absoluteDirectory = path.resolve(basedir, directory);

  const keys = enumerateFiles(absoluteDirectory, '.');
  function requireContext(key: string) {
    if (!keys.includes(key)) {
      throw new Error(`Cannot find module '${key}'`);
    }
    const fullKey = path.resolve(absoluteDirectory, key);
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
    .replace(/[^\d\s/a-z|]+/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Stories to skip in all vrt based on group.
 */
const storiesToSkip: Record<string, Record<string, string[]>> = {
  'Test Cases': {
    storybook: ['No Series'],
    examples: ['noSeries'],
  },
};

/**
 * Delays for stories to skip in all vrt based on group.
 */
const storiesToDelay: Record<string, Record<string, number>> = {
  // GroupName: {
  //   'some story name': 200,
  // },
};

export function getStorybookInfo(): StoryGroupInfo[] {
  if (isLegacyVRTServer) {
    configure(requireAllStories(__dirname, '../stories'), module);

    return getStorybook()
      .filter(({ kind }) => kind)
      .map(({ kind: group, stories: storiesRaw }) => {
        const stories: StoryInfo[] = storiesRaw
          .filter(({ name }) => name && !storiesToSkip[group]?.storybook.includes(name))
          .map(({ name: title }) => {
            // cleans story name to match url params
            const encodedTitle = encodeString(title);
            const delay = (storiesToDelay[group] ?? {})[title];
            return [title, encodedTitle, delay];
          });

        const encodedGroup = encodeString(group);

        return [group, encodedGroup, stories] as StoryGroupInfo;
      })
      .filter(([, , stories]) => stories.length > 0);
  }
  try {
    const examples = require('./tmp/examples.json');
    return examples.map((d: any) => {
      return [
        d.groupTitle,
        d.slugifiedGroupTitle,
        d.exampleFiles
          .filter(({ name }: any) => name && !storiesToSkip[d.groupTitle]?.examples.includes(name))
          .map((example: any) => {
            return [example.name, example.slugifiedName, 0];
          }),
      ];
    });
  } catch {
    throw new Error('A required file is not available, please run yarn test:integration:generate');
  }
}

const rotationCases: [string, Rotation][] = [
  ['0', 0],
  ['90', 90],
  ['180', 180],
  ['negative 90', -90],
];

/**
 * This is a wrapper around it.each for Rotations
 * This is needed as the negative sign (-) will be excluded from the png filename
 */
export const eachRotation = {
  it(fn: (rotation: Rotation) => any, title = 'rotation - %s') {
    // eslint-disable-next-line jest/valid-title
    return it.each<[string, Rotation]>(rotationCases)(title, (_, r) => fn(r));
  },
  describe(fn: (rotation: Rotation) => any, title = 'rotation - %s') {
    // eslint-disable-next-line jest/valid-title, jest/valid-describe
    return describe.each<[string, Rotation]>(rotationCases)(title, (_, r) => fn(r));
  },
};

/* eslint-enable jest/no-export */
