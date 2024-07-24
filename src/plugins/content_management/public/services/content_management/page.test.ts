/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Page } from './page';

test('it should create a Page instance', () => {
  const page = new Page({ id: 'page1' });
  expect(page.config).toEqual({ id: 'page1' });
});

test('it should create sections', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({ id: 'section1', kind: 'dashboard', order: 2000 });
  page.createSection({ id: 'section2', kind: 'dashboard', order: 1000 });
  expect(page.getSections()).toHaveLength(2);
});

test('it should not create section with existing id', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({ id: 'section1', kind: 'dashboard', order: 2000 });
  expect(() =>
    page.createSection({ id: 'section1', kind: 'dashboard', order: 1000 })
  ).toThrowError();
});

test('it should return sections in order', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({ id: 'section1', kind: 'dashboard', order: 2000 });
  page.createSection({ id: 'section2', kind: 'dashboard', order: 1000 });
  expect(page.getSections()).toEqual([
    { id: 'section2', kind: 'dashboard', order: 1000 },
    { id: 'section1', kind: 'dashboard', order: 2000 },
  ]);
  expect(page.getSections$().value).toEqual([
    { id: 'section2', kind: 'dashboard', order: 1000 },
    { id: 'section1', kind: 'dashboard', order: 2000 },
  ]);
});

test('it should add contents to section', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({ id: 'section1', kind: 'dashboard', order: 2000 });
  page.addContent('section1', {
    id: 'content1',
    kind: 'visualization',
    order: 10,
    input: { kind: 'static', id: 'viz-id-1' },
  });
  page.addContent('section1', {
    id: 'content2',
    kind: 'visualization',
    order: 5,
    input: { kind: 'static', id: 'viz-id-2' },
  });
  expect(page.getContents('section1')).toHaveLength(2);
});

test('it should return contents in order', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({ id: 'section1', kind: 'dashboard', order: 2000 });
  page.addContent('section1', {
    id: 'content1',
    kind: 'visualization',
    order: 10,
    input: { kind: 'static', id: 'viz-id-1' },
  });
  page.addContent('section1', {
    id: 'content2',
    kind: 'visualization',
    order: 5,
    input: { kind: 'static', id: 'viz-id-2' },
  });
  expect(page.getContents('section1')).toEqual([
    {
      id: 'content2',
      kind: 'visualization',
      order: 5,
      input: { kind: 'static', id: 'viz-id-2' },
    },
    {
      id: 'content1',
      kind: 'visualization',
      order: 10,
      input: { kind: 'static', id: 'viz-id-1' },
    },
  ]);

  expect(page.getContents$('section1').value).toEqual([
    {
      id: 'content2',
      kind: 'visualization',
      order: 5,
      input: { kind: 'static', id: 'viz-id-2' },
    },
    {
      id: 'content1',
      kind: 'visualization',
      order: 10,
      input: { kind: 'static', id: 'viz-id-1' },
    },
  ]);
});
