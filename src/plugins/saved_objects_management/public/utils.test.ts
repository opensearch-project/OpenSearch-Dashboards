/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatWorkspaceIdParams } from './utils';

describe('Utils', () => {
  it('formatWorkspaceIdParams with workspace null/undefined', async () => {
    let obj = formatWorkspaceIdParams({ foo: 'bar', workspaces: null });
    expect(obj).not.toHaveProperty('workspaces');
    obj = formatWorkspaceIdParams({ foo: 'bar', workspaces: undefined });
    expect(obj).not.toHaveProperty('workspaces');
  });

  it('formatWorkspaceIdParams with workspace exists', async () => {
    const obj = formatWorkspaceIdParams({ foo: 'bar', workspaces: ['foo'] });
    expect(obj).toEqual({ foo: 'bar', workspaces: ['foo'] });
  });

  it('formatWorkspaceIdParams with availableWorkspaces exists', async () => {
    const obj = formatWorkspaceIdParams({ foo: 'bar', availableWorkspaces: ['foo'] });
    expect(obj).toEqual({ foo: 'bar', availableWorkspaces: ['foo'] });
  });

  it('formatWorkspaceIdParams with availableWorkspaces is empty array', async () => {
    const obj = formatWorkspaceIdParams({ foo: 'bar', availableWorkspaces: [] });
    expect(obj).toEqual({ foo: 'bar' });
  });

  it('formatWorkspaceIdParams with availableWorkspaces is null/undefined', async () => {
    const obj = formatWorkspaceIdParams({ foo: 'bar', availableWorkspaces: null });
    expect(obj).toEqual({ foo: 'bar' });
  });

  it('formatWorkspaceIdParams with both workspaces and availableWorkspaces are not empty', async () => {
    const obj = formatWorkspaceIdParams({
      foo: 'bar',
      availableWorkspaces: ['foo', 'bar'],
      workspaces: ['foo'],
    });
    expect(obj).toEqual({ foo: 'bar', availableWorkspaces: ['foo', 'bar'], workspaces: ['foo'] });
  });
});
