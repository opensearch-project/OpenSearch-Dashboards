/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { formatInspectUrl, formatWorkspaceIdParams } from './utils';

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
    const mockCoreStart = coreMock.createStart();
    const savedObject = {
      type: 'dashboard',
      id: 'dashboard',
      attributes: {},
      references: [],
      meta: {
        editUrl: '/management/opensearch-dashboards/objects/savedDashboards/ID1',
      },
    };

    beforeEach(() => {
      mockCoreStart.application.capabilities = {
        ...mockCoreStart.application.capabilities,
        workspaces: {
          ...mockCoreStart.application.capabilities.workspaces,
          enabled: true,
        },
      };
      jest.clearAllMocks();
    });

    it('formats URL correctly when useUpdatedUX is false and workspace is disabled', () => {
      const currentWorkspace = { id: 'workspace1', name: 'workspace1' };
      mockCoreStart.application.capabilities = {
        ...mockCoreStart.application.capabilities,
        workspaces: {
          ...mockCoreStart.application.capabilities.workspaces,
          enabled: false,
        },
      };
      const result = formatInspectUrl(savedObject, false, currentWorkspace, mockCoreStart);
      expect(result).toBe('/management/opensearch-dashboards/objects/savedDashboards/ID1');
    });

    it('formats URL correctly when useUpdatedUX is false, saved object does not belong to certain workspaces and not in current workspace', () => {
      const result = formatInspectUrl(savedObject, false, null, mockCoreStart);
      expect(result).toBe('/management/opensearch-dashboards/objects/savedDashboards/ID1');
    });

    it('formats URL correctly when useUpdatedUX is true and in current workspace', () => {
      const savedObjectWithWorkspaces = {
        ...savedObject,
        workspaces: ['workspace1'],
      };
      const currentWorkspace = { id: 'workspace1', name: 'workspace1' };
      const result = formatInspectUrl(
        savedObjectWithWorkspaces,
        true,
        currentWorkspace,
        mockCoreStart
      );

      expect(result).toBe('http://localhost/w/workspace1/app/objects/savedDashboards/ID1');
    });

    it('formats URL correctly when useUpdatedUX is true and saved object belongs to certain workspaces', () => {
      const savedObjectWithWorkspaces = {
        ...savedObject,
        workspaces: ['workspace1'],
      };
      mockCoreStart.workspaces.workspaceList$.next([{ id: 'workspace1', name: 'workspace1' }]);
      const result = formatInspectUrl(savedObjectWithWorkspaces, true, null, mockCoreStart);

      expect(result).toBe('http://localhost/w/workspace1/app/objects/savedDashboards/ID1');
    });

    it('formats URL correctly when useUpdatedUX is true and no workspace permission', () => {
      const savedObjectWithWorkspaces = {
        ...savedObject,
        workspaces: ['workspace1'],
      };
      mockCoreStart.workspaces.workspaceList$.next([{ id: 'workspace2', name: 'workspace2' }]);
      const result = formatInspectUrl(savedObjectWithWorkspaces, true, null, mockCoreStart);

      expect(result).toBe('/app/objects/savedDashboards/ID1');
    });
  });
});
