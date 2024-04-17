/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppNavLinkStatus, DEFAULT_APP_CATEGORIES } from '../../../../../core/public';
import {
  validateWorkspaceForm,
  convertApplicationsToFeaturesOrGroups,
  convertPermissionSettingsToPermissions,
  convertPermissionsToPermissionSettings,
} from './utils';
import { WorkspacePermissionMode } from '../../../common/constants';
import { WorkspacePermissionItemType } from './constants';

describe('convertApplicationsToFeaturesOrGroups', () => {
  it('should group same category applications in same feature group', () => {
    expect(
      convertApplicationsToFeaturesOrGroups([
        {
          id: 'foo',
          title: 'Foo',
          navLinkStatus: AppNavLinkStatus.visible,
          category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
        },
        {
          id: 'bar',
          title: 'Bar',
          navLinkStatus: AppNavLinkStatus.visible,
          category: DEFAULT_APP_CATEGORIES.opensearchDashboards,
        },
        {
          id: 'baz',
          title: 'Baz',
          navLinkStatus: AppNavLinkStatus.visible,
          category: DEFAULT_APP_CATEGORIES.observability,
        },
      ])
    ).toEqual([
      {
        name: 'OpenSearch Dashboards',
        features: [
          {
            id: 'foo',
            name: 'Foo',
          },
          {
            id: 'bar',
            name: 'Bar',
          },
        ],
      },
      {
        name: 'Observability',
        features: [
          {
            id: 'baz',
            name: 'Baz',
          },
        ],
      },
    ]);
  });
  it('should return features if application without category', () => {
    expect(
      convertApplicationsToFeaturesOrGroups([
        {
          id: 'foo',
          title: 'Foo',
          navLinkStatus: AppNavLinkStatus.visible,
        },
        {
          id: 'baz',
          title: 'Baz',
          navLinkStatus: AppNavLinkStatus.visible,
          category: DEFAULT_APP_CATEGORIES.observability,
        },
        {
          id: 'bar',
          title: 'Bar',
          navLinkStatus: AppNavLinkStatus.visible,
        },
      ])
    ).toEqual([
      {
        id: 'foo',
        name: 'Foo',
      },
      {
        id: 'bar',
        name: 'Bar',
      },
      {
        name: 'Observability',
        features: [
          {
            id: 'baz',
            name: 'Baz',
          },
        ],
      },
    ]);
  });
});

describe('convertPermissionSettingsToPermissions', () => {
  it('should return undefined if permission items not provided', () => {
    expect(convertPermissionSettingsToPermissions(undefined)).toBeUndefined();
    expect(convertPermissionSettingsToPermissions([])).toBeUndefined();
  });

  it('should not add duplicate users and groups', () => {
    expect(
      convertPermissionSettingsToPermissions([
        {
          id: 0,
          type: WorkspacePermissionItemType.User,
          userId: 'duplicate-user',
          modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
        },
        {
          id: 1,
          type: WorkspacePermissionItemType.User,
          userId: 'duplicate-user',
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
        },
        {
          id: 2,
          type: WorkspacePermissionItemType.Group,
          group: 'duplicate-group',
          modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
        },
        {
          id: 3,
          type: WorkspacePermissionItemType.Group,
          group: 'duplicate-group',
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
        },
      ])
    ).toEqual({
      library_read: { users: ['duplicate-user'], groups: ['duplicate-group'] },
      library_write: { users: ['duplicate-user'], groups: ['duplicate-group'] },
      read: { users: ['duplicate-user'], groups: ['duplicate-group'] },
    });
  });

  it('should return consistent permissions', () => {
    expect(
      convertPermissionSettingsToPermissions([
        {
          id: 0,
          type: WorkspacePermissionItemType.User,
          userId: 'foo',
          modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
        },
        {
          id: 1,
          type: WorkspacePermissionItemType.Group,
          group: 'bar',
          modes: [WorkspacePermissionMode.LibraryWrite],
        },
      ])
    ).toEqual({
      library_read: { users: ['foo'] },
      library_write: { groups: ['bar'] },
      read: { users: ['foo'] },
    });
  });
});

describe('convertPermissionsToPermissionSettings', () => {
  it('should return consistent permission settings', () => {
    expect(
      convertPermissionsToPermissionSettings({
        library_read: { users: ['foo'] },
        library_write: { groups: ['bar'] },
        read: { users: ['foo'] },
        write: { groups: ['bar'] },
      })
    ).toEqual([
      {
        id: 0,
        type: WorkspacePermissionItemType.User,
        userId: 'foo',
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
      },
      {
        id: 1,
        type: WorkspacePermissionItemType.Group,
        group: 'bar',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
      },
    ]);
  });
  it('should separate to multi permission settings', () => {
    expect(
      convertPermissionsToPermissionSettings({
        library_read: { users: ['foo'] },
        library_write: { users: ['foo'] },
        read: { users: ['foo'] },
      })
    ).toEqual([
      {
        id: 0,
        type: WorkspacePermissionItemType.User,
        userId: 'foo',
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
      },
      {
        id: 1,
        type: WorkspacePermissionItemType.User,
        userId: 'foo',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
      },
    ]);
    expect(
      convertPermissionsToPermissionSettings({
        library_read: { groups: ['bar'] },
        library_write: { groups: ['bar'] },
        read: { groups: ['bar'] },
      })
    ).toEqual([
      {
        id: 0,
        type: WorkspacePermissionItemType.Group,
        group: 'bar',
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
      },
      {
        id: 1,
        type: WorkspacePermissionItemType.Group,
        group: 'bar',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
      },
    ]);
  });
  it('should only convert workspace supported permissions', () => {
    expect(
      convertPermissionsToPermissionSettings({
        another_read: { users: ['foo'] },
      })
    ).toEqual([]);
  });
});

describe('validateWorkspaceForm', () => {
  it('should return error if name is empty', () => {
    expect(validateWorkspaceForm({}).name).toEqual("Name can't be empty.");
  });
  it('should return error if name is invalid', () => {
    expect(validateWorkspaceForm({ name: '~' }).name).toEqual('Invalid workspace name');
  });
  it('should return error if description is invalid', () => {
    expect(validateWorkspaceForm({ description: '~' }).description).toEqual(
      'Invalid workspace description'
    );
  });
  it('should return error if permission setting type is invalid', () => {
    expect(
      validateWorkspaceForm({
        name: 'test',
        permissionSettings: [{ id: 0 }],
      }).permissionSettings
    ).toEqual({ 0: 'Invalid type' });
  });
  it('should return error if permission setting modes is invalid', () => {
    expect(
      validateWorkspaceForm({
        name: 'test',
        permissionSettings: [{ id: 0, type: WorkspacePermissionItemType.User, modes: [] }],
      }).permissionSettings
    ).toEqual({ 0: 'Invalid permission modes' });
  });
  it('should return error if permission setting user id is invalid', () => {
    expect(
      validateWorkspaceForm({
        name: 'test',
        permissionSettings: [
          {
            id: 0,
            type: WorkspacePermissionItemType.User,
            modes: [WorkspacePermissionMode.LibraryRead],
            userId: '',
          },
        ],
      }).permissionSettings
    ).toEqual({ 0: 'Invalid user id' });
  });
  it('should return error if permission setting group is invalid', () => {
    expect(
      validateWorkspaceForm({
        name: 'test',
        permissionSettings: [
          {
            id: 0,
            type: WorkspacePermissionItemType.Group,
            modes: [WorkspacePermissionMode.LibraryRead],
            group: '',
          },
        ],
      }).permissionSettings
    ).toEqual({ 0: 'Invalid user group' });
  });

  it('should return error if permission setting is duplicate', () => {
    expect(
      validateWorkspaceForm({
        name: 'test',
        permissionSettings: [
          {
            id: 0,
            type: WorkspacePermissionItemType.User,
            modes: [WorkspacePermissionMode.LibraryRead],
            userId: 'foo',
          },
          {
            id: 1,
            type: WorkspacePermissionItemType.User,
            modes: [WorkspacePermissionMode.LibraryRead],
            userId: 'foo',
          },
        ],
      }).permissionSettings
    ).toEqual({ 1: 'Duplicate permission setting' });
    expect(
      validateWorkspaceForm({
        name: 'test',
        permissionSettings: [
          {
            id: 0,
            type: WorkspacePermissionItemType.Group,
            modes: [WorkspacePermissionMode.LibraryRead],
            group: 'foo',
          },
          {
            id: 1,
            type: WorkspacePermissionItemType.Group,
            modes: [WorkspacePermissionMode.LibraryRead],
            group: 'foo',
          },
        ],
      }).permissionSettings
    ).toEqual({ 1: 'Duplicate permission setting' });
  });

  it('should return empty object for valid for data', () => {
    expect(
      validateWorkspaceForm({
        name: 'test',
        permissionSettings: [
          {
            id: 0,
            type: WorkspacePermissionItemType.Group,
            modes: [WorkspacePermissionMode.LibraryRead],
            group: 'foo',
          },
        ],
      })
    ).toEqual({});
  });
});
