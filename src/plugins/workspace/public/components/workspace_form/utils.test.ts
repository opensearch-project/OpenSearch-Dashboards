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
  isWorkspacePermissionSetting,
  getPermissionModeName,
} from './utils';
import { WorkspacePermissionMode } from '../../../common/constants';
import { WorkspacePermissionItemType, optionIdToWorkspacePermissionModesMap } from './constants';
import { DataSourceConnectionType } from '../../../common/types';
import { WorkspaceFormErrorCode } from './types';
import { PermissionModeId } from '../../../../../core/public';

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
      message: 'Color is invalid. Choose a valid color.',
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
          selectedDataSourceConnections: [
            {
              id: '',
              name: 'title',
              connectionType: DataSourceConnectionType.OpenSearchConnection,
              type: 'OpenSearch',
            },
          ],
        },
        false
      ).selectedDataSourceConnections
    ).toEqual({
      0: { code: WorkspaceFormErrorCode.InvalidDataSource, message: 'Invalid data source' },
    });
  });

  it('should return error if selected data source id is duplicated', () => {
    expect(
      validateWorkspaceForm(
        {
          name: 'test',
          selectedDataSourceConnections: [
            {
              id: 'id',
              name: 'title1',
              connectionType: DataSourceConnectionType.OpenSearchConnection,
              type: 'OpenSearch',
            },
            {
              id: 'id',
              name: 'title2',
              connectionType: DataSourceConnectionType.OpenSearchConnection,
              type: 'OpenSearch',
            },
          ],
        },
        false
      ).selectedDataSourceConnections
    ).toEqual({
      '1': { code: WorkspaceFormErrorCode.DuplicateDataSource, message: 'Duplicate data sources' },
    });
  });
});

describe('getNumberOfErrors', () => {
  it('should calculate the error number of data sources form', () => {
    expect(
      getNumberOfErrors({
        selectedDataSourceConnections: {
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
});

describe('isWorkspacePermissionSetting', () => {
  it('should return true for a valid user permission setting', () => {
    const validUserPermissionSetting = {
      modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
      type: WorkspacePermissionItemType.User,
      userId: 'user123',
    };
    const result = isWorkspacePermissionSetting(validUserPermissionSetting);
    expect(result).toBe(true);
  });

  it('should return true for a valid group permission setting', () => {
    const validGroupPermissionSetting = {
      modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Owner],
      type: WorkspacePermissionItemType.Group,
      group: 'group456',
    };
    const result = isWorkspacePermissionSetting(validGroupPermissionSetting);
    expect(result).toBe(true);
  });

  it('should return false if modes is missing', () => {
    const permissionSettingWithoutModes = {
      type: WorkspacePermissionItemType.User,
      userId: 'user123',
    };
    const result = isWorkspacePermissionSetting(permissionSettingWithoutModes);
    expect(result).toBe(false);
  });

  it('should return false if modes are invalid', () => {
    const permissionSettingWithInvalidModes = {
      modes: ['invalid' as WorkspacePermissionMode],
      type: WorkspacePermissionItemType.User,
      userId: 'user123',
    };
    const result = isWorkspacePermissionSetting(permissionSettingWithInvalidModes);
    expect(result).toBe(false);
  });

  it('should return false if type is invalid', () => {
    const permissionSettingWithInvalidType = {
      modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Owner],
      type: 'invalid',
      userId: 'user123',
    };
    const result = isWorkspacePermissionSetting(permissionSettingWithInvalidType);
    expect(result).toBe(false);
  });

  it('should return false if userId is missing for user type', () => {
    const permissionSettingWithoutUserId = {
      modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Owner],
      type: WorkspacePermissionItemType.User,
    };
    const result = isWorkspacePermissionSetting(permissionSettingWithoutUserId);
    expect(result).toBe(false);
  });

  it('should return false if group is missing for group type', () => {
    const permissionSettingWithoutGroup = {
      modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Owner],
      type: WorkspacePermissionItemType.Group,
    };
    const result = isWorkspacePermissionSetting(permissionSettingWithoutGroup);
    expect(result).toBe(false);
  });
});

describe('getPermissionModeName', () => {
  it('should return Owner for a valid WorkspacePermissionMode mode', () => {
    const result = getPermissionModeName(['library_write', 'write'] as WorkspacePermissionMode[]);
    expect(result).toBe('Admin');
  });

  it('should return Read & write for a valid WorkspacePermissionMode mode', () => {
    const result = getPermissionModeName(['library_write', 'read'] as WorkspacePermissionMode[]);
    expect(result).toBe('Read and write');
  });

  it('should return Read for a valid WorkspacePermissionMode mode', () => {
    const result = getPermissionModeName(['library_read', 'read'] as WorkspacePermissionMode[]);
    expect(result).toBe('Read only');
  });

  it('should return Read for a invalid WorkspacePermissionMode mode', () => {
    const result = getPermissionModeName([] as WorkspacePermissionMode[]);
    expect(result).toBe('Read only');
  });
});
