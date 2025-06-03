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

test('creating section with the same id should override the previous section', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({ id: 'section1', kind: 'dashboard', order: 2000 });
  page.createSection({ id: 'section1', kind: 'card', order: 1000 });
  expect(page.getSections()).toHaveLength(1);
  expect(page.getSections()[0]).toEqual({ id: 'section1', kind: 'card', order: 1000 });
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

test('it should only allow to add one dashboard to a section', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({ id: 'dashboard-section', kind: 'dashboard', order: 1000 });

  page.addContent('dashboard-section', {
    id: 'dashboard-content-1',
    kind: 'dashboard',
    order: 10,
    input: { kind: 'static', id: 'dashboard-id-1' },
  });

  // add another dashboard to the same section
  page.addContent('dashboard-section', {
    id: 'dashboard-content-1',
    kind: 'dashboard',
    order: 10,
    input: { kind: 'static', id: 'dashboard-id-1' },
  });

  // but it should only have one dashboard content
  expect(page.getContents('dashboard-section')).toHaveLength(1);
  expect(page.getContents('dashboard-section')).toEqual([
    {
      id: 'dashboard-content-1',
      kind: 'dashboard',
      order: 10,
      input: { kind: 'static', id: 'dashboard-id-1' },
    },
  ]);

  // add non-dashboard content to a section which already has a dashboard will override the dashboard
  page.addContent('dashboard-section', {
    id: 'vis-content-1',
    kind: 'visualization',
    order: 10,
    input: { kind: 'static', id: 'vis-id-1' },
  });
  page.addContent('dashboard-section', {
    id: 'vis-content-2',
    kind: 'visualization',
    order: 20,
    input: { kind: 'static', id: 'vis-id-2' },
  });
  expect(page.getContents('dashboard-section')).toEqual([
    {
      id: 'vis-content-1',
      kind: 'visualization',
      order: 10,
      input: { kind: 'static', id: 'vis-id-1' },
    },
    {
      id: 'vis-content-2',
      kind: 'visualization',
      order: 20,
      input: { kind: 'static', id: 'vis-id-2' },
    },
  ]);
});

test('it should update dashboard section with new input', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({
    id: 'section_id',
    kind: 'dashboard',
    order: 1000,
    input: { timeRange: { from: 'now-7d', to: 'now' } },
  });
  expect(page.getSections()).toHaveLength(1);
  expect(page.getSections()[0]).toEqual({
    id: 'section_id',
    kind: 'dashboard',
    order: 1000,
    input: { timeRange: { from: 'now-7d', to: 'now' } },
  });

  page.updateSectionInput('section_id', (section) => {
    if (section?.kind === 'dashboard') {
      return { ...section, input: { timeRange: { from: 'now-1d', to: 'now' } } };
    }
    return section;
  });

  expect(page.getSections()[0]).toEqual({
    id: 'section_id',
    kind: 'dashboard',
    order: 1000,
    input: { timeRange: { from: 'now-1d', to: 'now' } },
  });
});

test('it should update card section with new input', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({
    id: 'section_id',
    kind: 'card',
    order: 1000,
    input: {},
  });
  expect(page.getSections()).toHaveLength(1);
  expect(page.getSections()[0]).toEqual({
    id: 'section_id',
    kind: 'card',
    order: 1000,
    input: {},
  });

  page.updateSectionInput('section_id', (section) => {
    if (section?.kind === 'card') {
      return { ...section, input: { title: 'new title' } };
    }
    return section;
  });

  expect(page.getSections()[0]).toEqual({
    id: 'section_id',
    kind: 'card',
    order: 1000,
    input: { title: 'new title' },
  });
});

test('it should not allow to update section property other than `input`', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({
    id: 'section_id',
    kind: 'dashboard',
    order: 1000,
    input: { timeRange: { from: 'now-7d', to: 'now' } },
  });
  expect(page.getSections()).toHaveLength(1);
  expect(page.getSections()[0]).toEqual({
    id: 'section_id',
    kind: 'dashboard',
    order: 1000,
    input: { timeRange: { from: 'now-7d', to: 'now' } },
  });

  // update the section with new kind: custom and new id: section_id_new
  page.updateSectionInput('section_id', (section) => {
    if (section?.kind === 'dashboard') {
      return { ...section, id: 'section_id_new', kind: 'custom', render: jest.fn() };
    }
    return section;
  });

  // section should not changed as it only allows to update `section.input` field
  expect(page.getSections()[0]).toEqual({
    id: 'section_id',
    kind: 'dashboard',
    order: 1000,
    input: { timeRange: { from: 'now-7d', to: 'now' } },
  });
});

test('it should callback with error if section not exist', () => {
  const page = new Page({ id: 'page1' });
  const callbackMock = jest.fn();
  page.updateSectionInput('section_id_not_exist', callbackMock);
  expect(callbackMock.mock.calls[0][0]).toBe(null);
  expect(callbackMock.mock.calls[0][1]).toBeInstanceOf(Error);
});

test('it should remove the specified section', () => {
  const page = new Page({ id: 'page1' });
  page.createSection({
    id: 'section_id',
    kind: 'dashboard',
    order: 1000,
    input: { timeRange: { from: 'now-7d', to: 'now' } },
  });
  expect(page.getSections()).toHaveLength(1);
  page.removeSection('section_id');
  expect(page.getSections()).toHaveLength(0);
});
