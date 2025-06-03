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
  getPermissionSettingsWithPrivacyType,
  convertPermissionsToPrivacyType,
  EMPTY_PERMISSIONS,
} from './utils';
import {
  WorkspacePermissionItemType,
  optionIdToWorkspacePermissionModesMap,
  WorkspacePrivacyItemType,
} from './constants';
import { DataSourceConnectionType } from '../../../common/types';
import { WorkspaceFormErrorCode } from './types';
import { PermissionModeId, WorkspacePermissionMode } from '../../../../../core/public';

describe('convertPermissionSettingsToPermissions', () => {
  it('should return empty permission object if permission items are not provided', () => {
    expect(convertPermissionSettingsToPermissions(undefined)).toBe(EMPTY_PERMISSIONS);
    expect(convertPermissionSettingsToPermissions([])).toBe(EMPTY_PERMISSIONS);
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
    expect(validateWorkspaceForm({}).name).toEqual({
      code: WorkspaceFormErrorCode.WorkspaceNameMissing,
      message: 'Name is required. Enter a name.',
    });
  });
  it('should return error if name is empty string', () => {
    expect(validateWorkspaceForm({ name: '' }).name).toEqual({
      code: WorkspaceFormErrorCode.WorkspaceNameMissing,
      message: 'Name is required. Enter a name.',
    });
  });
  it('should return error if name is blank string', () => {
    expect(validateWorkspaceForm({ name: '   ' }).name).toEqual({
      code: WorkspaceFormErrorCode.WorkspaceNameMissing,
      message: 'Name is required. Enter a name.',
    });
  });
  it('should return error if name is invalid', () => {
    expect(validateWorkspaceForm({ name: '~' }).name).toEqual({
      code: WorkspaceFormErrorCode.InvalidWorkspaceName,
      message: 'Name is invalid. Enter a valid name.',
    });
  });
  it('should return error if color is invalid', () => {
    expect(validateWorkspaceForm({ color: 'QWERTY' }).color).toEqual({
      code: WorkspaceFormErrorCode.InvalidColor,
      message: 'Color is invalid. Choose a valid color.',
    });
  });
  it('should return error if use case is empty', () => {
    expect(validateWorkspaceForm({}).features).toEqual({
      code: WorkspaceFormErrorCode.UseCaseMissing,
      message: 'Use case is required. Select a use case.',
    });
  });

  it('should return empty object for valid form data', () => {
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
        features: ['use-case-observability'],
      })
    ).toEqual({});
  });

  it('should return error if selected data source id is null', () => {
    expect(
      validateWorkspaceForm({
        name: 'test',
        selectedDataSourceConnections: [
          {
            id: '',
            name: 'title',
            connectionType: DataSourceConnectionType.OpenSearchConnection,
            type: 'OpenSearch',
          },
        ],
      }).selectedDataSourceConnections
    ).toEqual({
      0: { code: WorkspaceFormErrorCode.InvalidDataSource, message: 'Invalid data source' },
    });
  });

  it('should return error if selected data source id is duplicated', () => {
    expect(
      validateWorkspaceForm({
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
      }).selectedDataSourceConnections
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
  it('should return consistent permissions changes count', () => {
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
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.User,
              userId: '*',
              modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
            },
          ],
        },
        {
          name: 'foo',
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.User,
              userId: '*',
              modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
            },
          ],
        }
      )
    ).toEqual(0);
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.User,
              userId: '*',
              modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
            },
          ],
        },
        {
          name: 'foo',
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.User,
              userId: '*',
              modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.ReadAndWrite],
            },
          ],
        }
      )
    ).toEqual(1);
    expect(
      getNumberOfChanges(
        {
          name: 'foo',
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.User,
              userId: '*',
              modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
            },
          ],
        },
        {
          name: 'foo',
          permissionSettings: [
            {
              id: 0,
              type: WorkspacePermissionItemType.User,
              userId: 'user-id',
              modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.ReadAndWrite],
            },
          ],
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

describe('convertPermissionsToPrivacyType', () => {
  it('should return AnyoneCanEdit when LibraryWrite permission is present for *', () => {
    const permissionSettings = [
      {
        id: 0,
        type: WorkspacePermissionItemType.User,
        userId: '*',
        modes: [WorkspacePermissionMode.LibraryWrite],
      },
    ];
    expect(convertPermissionsToPrivacyType(permissionSettings)).toEqual(
      WorkspacePrivacyItemType.AnyoneCanEdit
    );
  });

  it('should return AnyoneCanView when LibraryRead permission is present for *', () => {
    const permissionSettings = [
      {
        id: 0,
        type: WorkspacePermissionItemType.User,
        userId: '*',
        modes: [WorkspacePermissionMode.LibraryRead],
      },
    ];
    expect(convertPermissionsToPrivacyType(permissionSettings)).toEqual(
      WorkspacePrivacyItemType.AnyoneCanView
    );
  });

  it('should return PrivateToCollaborators when no * permission is present', () => {
    const permissionSettings = [
      {
        id: 0,
        type: WorkspacePermissionItemType.User,
        userId: 'user1',
        modes: [WorkspacePermissionMode.LibraryRead],
      },
    ];
    expect(convertPermissionsToPrivacyType(permissionSettings)).toEqual(
      WorkspacePrivacyItemType.PrivateToCollaborators
    );
  });
});

describe('getPermissionSettingsWithPrivacyType', () => {
  it('should update star user to read permission when privacyType is AnyoneCanView', () => {
    const expectedPermissionSettings = [
      {
        id: 1,
        type: WorkspacePermissionItemType.User,
        userId: 'user1',
        modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
      },
      {
        id: 3,
        type: WorkspacePermissionItemType.User,
        userId: '*',
        modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
      },
    ];
    expect(
      getPermissionSettingsWithPrivacyType(
        [
          expectedPermissionSettings[0],
          {
            id: 2,
            type: WorkspacePermissionItemType.User,
            userId: '*',
            modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.ReadAndWrite],
          },
        ],
        WorkspacePrivacyItemType.AnyoneCanView
      )
    ).toEqual(expectedPermissionSettings);
  });

  it('should update star user to read and write permission when privacyType is AnyoneCanEdit', () => {
    const expectedPermissionSettings = [
      {
        id: 1,
        type: WorkspacePermissionItemType.User,
        userId: 'user1',
        modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
      },
      {
        id: 3,
        type: WorkspacePermissionItemType.User,
        userId: '*',
        modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.ReadAndWrite],
      },
    ];
    expect(
      getPermissionSettingsWithPrivacyType(
        [
          expectedPermissionSettings[0],
          {
            id: 2,
            type: WorkspacePermissionItemType.User,
            userId: '*',
            modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
          },
        ],
        WorkspacePrivacyItemType.AnyoneCanEdit
      )
    ).toEqual(expectedPermissionSettings);
  });

  it('should remove * permission when privacyType is PrivateToCollaborators', () => {
    const expectedPermissionSettings = [
      {
        id: 1,
        type: WorkspacePermissionItemType.User,
        userId: 'user1',
        modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
      },
    ];
    expect(
      getPermissionSettingsWithPrivacyType(
        [
          expectedPermissionSettings[0],
          {
            id: 2,
            type: WorkspacePermissionItemType.User,
            userId: '*',
            modes: optionIdToWorkspacePermissionModesMap[PermissionModeId.Read],
          },
        ],
        WorkspacePrivacyItemType.PrivateToCollaborators
      )
    ).toEqual(expectedPermissionSettings);
  });
});
