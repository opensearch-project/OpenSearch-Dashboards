/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { formatInspectUrl, formatWorkspaceIdParams } from './utils';
import { CoreStart } from 'opensearch-dashboards/public';

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

  describe('formatInspectUrl', () => {
    let mockCoreStart: CoreStart;
    const savedObject = {
      type: 'dashboard',
      id: 'dashboard',
      attributes: {},
      references: [],
      meta: {
        editUrl: '/management/opensearch-dashboards/objects/dashboard/ID1',
      },
    };
    const savedObjectWithWorkspaces = {
      ...savedObject,
      workspaces: ['workspace1'],
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockCoreStart = coreMock.createStart();
      mockCoreStart.application.capabilities = {
        ...mockCoreStart.application.capabilities,
        workspaces: {
          ...mockCoreStart.application.capabilities.workspaces,
          enabled: true,
        },
      };
      mockCoreStart.uiSettings = {
        ...mockCoreStart.uiSettings,
        get: jest.fn().mockReturnValue(true),
      };
    });

    it('formats URL correctly when useUpdatedUX is false and workspace is disabled', () => {
      mockCoreStart.application.capabilities = {
        ...mockCoreStart.application.capabilities,
        workspaces: {
          ...mockCoreStart.application.capabilities.workspaces,
          enabled: false,
        },
      };
      mockCoreStart.uiSettings = {
        ...mockCoreStart.uiSettings,
        get: jest.fn().mockReturnValue(false),
      };
      const result = formatInspectUrl(savedObject, mockCoreStart);
      expect(result).toBe('/app/management/opensearch-dashboards/objects/dashboard/ID1');
    });

    it('formats URL correctly when useUpdatedUX is false, saved object does not belong to certain workspaces and not in current workspace', () => {
      mockCoreStart.uiSettings = {
        ...mockCoreStart.uiSettings,
        get: jest.fn().mockReturnValue(false),
      };
      const result = formatInspectUrl(savedObject, mockCoreStart);
      expect(result).toBe('/app/management/opensearch-dashboards/objects/dashboard/ID1');
    });

    it('formats URL correctly when useUpdatedUX is true and in current workspace', () => {
      const currentWorkspace = { id: 'workspace1', name: 'workspace1' };
      mockCoreStart.workspaces.currentWorkspace$.next(currentWorkspace);
      const result = formatInspectUrl(savedObjectWithWorkspaces, mockCoreStart);

      expect(result).toBe('http://localhost/w/workspace1/app/objects/dashboard/ID1');
    });

    it('formats URL correctly when useUpdatedUX is true and saved object belongs to certain workspaces', () => {
      mockCoreStart.workspaces.workspaceList$.next([{ id: 'workspace1', name: 'workspace1' }]);
      const result = formatInspectUrl(savedObjectWithWorkspaces, mockCoreStart);

      expect(result).toBe('http://localhost/w/workspace1/app/objects/dashboard/ID1');
    });

    it('formats URL correctly when useUpdatedUX is true and the object does not belong to any workspace', () => {
      mockCoreStart.workspaces.workspaceList$.next([{ id: 'workspace2', name: 'workspace2' }]);
      const result = formatInspectUrl(savedObjectWithWorkspaces, mockCoreStart);

      expect(result).toBe('/app/objects/dashboard/ID1');
    });
  });
});
