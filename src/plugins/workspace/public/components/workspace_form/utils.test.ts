/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  validateWorkspaceForm,
  convertPermissionSettingsToPermissions,
  convertPermissionsToPermissionSettings,
  getNumberOfChanges,
  getNumberOfErrors,
} from './utils';
import { WorkspacePermissionMode } from '../../../common/constants';
import { WorkspacePermissionItemType } from './constants';
import { WorkspaceFormErrorCode } from './types';

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
        type: WorkspacePermissionItemType.Group,
        group: 'bar',
        modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
      },
      {
        id: 1,
        type: WorkspacePermissionItemType.User,
        userId: 'foo',
        modes: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
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
    expect(validateWorkspaceForm({}, false).name).toEqual({
      code: WorkspaceFormErrorCode.WorkspaceNameMissing,
      message: 'Name is required. Enter a name.',
    });
  });
  it('should return error if name is empty string', () => {
    expect(validateWorkspaceForm({ name: '' }, false).name).toEqual({
      code: WorkspaceFormErrorCode.WorkspaceNameMissing,
      message: 'Name is required. Enter a name.',
    });
  });
  it('should return error if name is blank string', () => {
    expect(validateWorkspaceForm({ name: '   ' }, false).name).toEqual({
      code: WorkspaceFormErrorCode.WorkspaceNameMissing,
      message: 'Name is required. Enter a name.',
    });
  });
  it('should return error if name is invalid', () => {
    expect(validateWorkspaceForm({ name: '~' }, false).name).toEqual({
      code: WorkspaceFormErrorCode.InvalidWorkspaceName,
      message: 'Name is invalid. Enter a valid name.',
    });
  });
  it('should return error if color is invalid', () => {
    expect(validateWorkspaceForm({ color: 'QWERTY' }, false).color).toEqual({
      code: WorkspaceFormErrorCode.InvalidColor,
      message: 'Color is invalid. Enter a valid color.',
    });
  });
  it('should return error if use case is empty', () => {
    expect(validateWorkspaceForm({}, false).features).toEqual({
      code: WorkspaceFormErrorCode.UseCaseMissing,
      message: 'Use case is required. Select a use case.',
    });
  });
  it('should return error if permission setting type is invalid', () => {
    expect(
      validateWorkspaceForm(
        {
          name: 'test',
          permissionSettings: [{ id: 0 }],
        },
        true
      ).permissionSettings?.fields
    ).toEqual({
      0: { code: WorkspaceFormErrorCode.InvalidPermissionType, message: 'Invalid type' },
    });
  });
  it('should return error if permission setting modes is invalid', () => {
    expect(
      validateWorkspaceForm(
        {
          name: 'test',
          permissionSettings: [{ id: 0, type: WorkspacePermissionItemType.User, modes: [] }],
        },
        true
      ).permissionSettings?.fields
    ).toEqual({
      0: {
        code: WorkspaceFormErrorCode.InvalidPermissionModes,
        message: 'Invalid permission modes',
      },
    });
  });

  it('should return error if permission setting is duplicate', () => {
    expect(
      validateWorkspaceForm(
        {
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
        },
        true
      ).permissionSettings?.fields
    ).toEqual({
      1: {
        code: WorkspaceFormErrorCode.DuplicateUserIdPermissionSetting,
        message: 'User must be unique. Enter a unique user.',
      },
    });
    expect(
      validateWorkspaceForm(
        {
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
        },
        true
      ).permissionSettings?.fields
    ).toEqual({
      1: {
        code: WorkspaceFormErrorCode.DuplicateUserGroupPermissionSetting,
        message: 'User group must be unique. Enter a unique user group.',
      },
    });
  });

  it('should return error if owner is missing in permission settings', () => {
    expect(
      validateWorkspaceForm(
        {
          name: 'test',
        },
        true
      ).permissionSettings?.overall
    ).toEqual({
      code: WorkspaceFormErrorCode.PermissionSettingOwnerMissing,
      message: 'Add a workspace owner.',
    });

    expect(
      validateWorkspaceForm(
        {
          name: 'test',
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.User,
              modes: [WorkspacePermissionMode.LibraryRead],
              userId: 'foo',
            },
          ],
        },
        true
      ).permissionSettings?.overall
    ).toEqual({
      code: WorkspaceFormErrorCode.PermissionSettingOwnerMissing,
      message: 'Add a workspace owner.',
    });
  });

  it('should return empty object for valid form data', () => {
    expect(
      validateWorkspaceForm(
        {
          name: 'test',
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.Group,
              modes: [WorkspacePermissionMode.LibraryRead],
              group: 'foo',
            },
          ],
          features: ['use-case-observability'],
        },
        false
      )
    ).toEqual({});
  });

  it('should return error if selected data source id is null', () => {
    expect(
      validateWorkspaceForm(
        {
          name: 'test',
          selectedDataSources: [
            {
              id: '',
              title: 'title',
            },
          ],
        },
        false
      ).selectedDataSources
    ).toEqual({
      0: { code: WorkspaceFormErrorCode.InvalidDataSource, message: 'Invalid data source' },
    });
  });

  it('should return error if selected data source id is duplicated', () => {
    expect(
      validateWorkspaceForm(
        {
          name: 'test',
          selectedDataSources: [
            {
              id: 'id',
              title: 'title1',
            },
            {
              id: 'id',
              title: 'title2',
            },
          ],
        },
        false
      ).selectedDataSources
    ).toEqual({
      '1': { code: WorkspaceFormErrorCode.DuplicateDataSource, message: 'Duplicate data sources' },
    });
  });
});

describe('getNumberOfErrors', () => {
  it('should calculate the error number of data sources form', () => {
    expect(
      getNumberOfErrors({
        selectedDataSources: {
          0: { code: WorkspaceFormErrorCode.InvalidDataSource, message: 'Invalid data source' },
        },
      })
    ).toEqual(1);
    expect(getNumberOfErrors({})).toEqual(0);
  });
  it('should return zero if errors is empty', () => {
    expect(getNumberOfErrors({})).toEqual(0);
  });
  it('should return consistent name errors count', () => {
    expect(
      getNumberOfErrors({
        name: {
          code: WorkspaceFormErrorCode.WorkspaceNameMissing,
          message: '',
        },
      })
    ).toEqual(1);
  });

  it('should return consistent color errors count', () => {
    expect(
      getNumberOfErrors({
        name: {
          code: WorkspaceFormErrorCode.InvalidColor,
          message: '',
        },
      })
    ).toEqual(1);
  });

  it('should return consistent permission settings errors count', () => {
    expect(
      getNumberOfErrors({
        permissionSettings: {
          overall: {
            code: WorkspaceFormErrorCode.PermissionSettingOwnerMissing,
            message: '',
          },
          fields: {
            1: {
              code: WorkspaceFormErrorCode.DuplicateUserIdPermissionSetting,
              message: '',
            },
          },
        },
      })
    ).toEqual(2);
  });
});

describe('getNumberOfChanges', () => {
  it('should return consistent name changes count', () => {
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
        },
        {
          name: 'foo',
        }
      )
    ).toEqual(0);
    expect(
      getNumberOfChanges(
        {
          name: 'foo1',
        },
        {
          name: 'foo',
        }
      )
    ).toEqual(1);
  });
  it('should return consistent description changes count', () => {
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
          description: 'bar',
        },
        {
          name: 'foo',
          description: 'bar',
        }
      )
    ).toEqual(0);
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
        },
        {
          name: 'foo',
          description: 'bar',
        }
      )
    ).toEqual(1);
  });
  it('should return consistent color changes count', () => {
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
          color: '#000',
        },
        {
          name: 'foo',
          color: '#000',
        }
      )
    ).toEqual(0);
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
          color: '#000',
        },
        {
          name: 'foo',
          color: '#001',
        }
      )
    ).toEqual(1);
  });
  it('should return consistent features changes count', () => {
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
          features: ['bar'],
        },
        {
          name: 'foo',
          features: ['bar'],
        }
      )
    ).toEqual(0);
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
          features: [],
        },
        {
          name: 'foo',
          features: ['bar'],
        }
      )
    ).toEqual(1);
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
          features: ['bar'],
        },
        {
          name: 'foo',
          features: [],
        }
      )
    ).toEqual(1);
  });
  it('should return consistent permission settings changes count', () => {
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.User,
              userId: 'user-1',
              modes: [WorkspacePermissionMode.Write, WorkspacePermissionMode.LibraryWrite],
            },
          ],
        },
        {
          name: 'foo',
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.User,
              userId: 'user-1',
              modes: [WorkspacePermissionMode.Write, WorkspacePermissionMode.LibraryWrite],
            },
          ],
        }
      )
    ).toEqual(0);
    // for remove permission setting
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.User,
              userId: 'user-1',
              modes: [WorkspacePermissionMode.Write, WorkspacePermissionMode.LibraryWrite],
            },
            {
              id: 1,
              type: WorkspacePermissionItemType.Group,
              group: 'group-1',
              modes: [WorkspacePermissionMode.Write, WorkspacePermissionMode.LibraryWrite],
            },
          ],
        },
        {
          name: 'foo',
          /**
           * These include three changes:
           * 1.Remove permission setting#0
           * 2.Modify permission setting#1
           * 3.Add permission setting#2
           */
          permissionSettings: [
            {
              id: 1,
              type: WorkspacePermissionItemType.Group,
              group: 'group-1',
              modes: [WorkspacePermissionMode.Read, WorkspacePermissionMode.LibraryWrite],
            },
            {
              id: 2,
              type: WorkspacePermissionItemType.User,
              userId: 'user-1',
              modes: [WorkspacePermissionMode.Write, WorkspacePermissionMode.LibraryWrite],
            },
          ],
        }
      )
    ).toEqual(3);
  });
});
