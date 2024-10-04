/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WorkspaceCollaboratorTypesService,
  defaultWorkspaceCollaboratorTypes,
  WorkspaceCollaboratorType,
} from './workspace_collaborator_types_service';

describe('defaultWorkspaceCollaboratorTypes', () => {
  it('should have the correct user collaborator type', () => {
    const userType = defaultWorkspaceCollaboratorTypes.find((type) => type.id === 'user');

    expect(userType).toEqual(
      expect.objectContaining({
        id: 'user',
        name: 'User',
        pluralName: 'Users',
        permissionSettingType: 'user',
        modal: {
          title: 'Add Users',
        },
      })
    );
  });

  it('should have the correct group collaborator type', () => {
    const groupType = defaultWorkspaceCollaboratorTypes.find((type) => type.id === 'group');

    expect(groupType).toEqual(
      expect.objectContaining({
        id: 'group',
        name: 'Group',
        pluralName: 'Groups',
        permissionSettingType: 'group',
        modal: {
          title: 'Add Groups',
        },
      })
    );
  });

  it('should match user collaborator correctly', () => {
    const userType = defaultWorkspaceCollaboratorTypes.find((type) => type.id === 'user');
    expect(
      userType?.collaboratorMatcher?.({
        type: 'user',
        userOrGroupId: 'test',
      })
    ).toBe(true);
  });

  it('should match group collaborator correctly', () => {
    const groupType = defaultWorkspaceCollaboratorTypes.find((type) => type.id === 'group');

    expect(
      groupType?.collaboratorMatcher?.({
        type: 'group',
        userOrGroupId: 'test',
      })
    ).toBe(true);
  });
});

describe('WorkspaceCollaboratorTypesService', () => {
  let service: WorkspaceCollaboratorTypesService;

  beforeEach(() => {
    service = new WorkspaceCollaboratorTypesService();
  });

  afterEach(() => {
    service.stop();
  });

  it('should initialize with default collaborator types', (done) => {
    service.getTypes$().subscribe((types) => {
      expect(types).toEqual(defaultWorkspaceCollaboratorTypes);
      done();
    });
  });

  it('should allow setting new collaborator types', () => {
    const newTypes: WorkspaceCollaboratorType[] = [
      {
        id: 'custom',
        name: 'Custom',
        pluralName: 'Customs',
        permissionSettingType: 'user',
        modal: {
          title: 'Add Custom',
        },
        collaboratorMatcher: () => true,
      },
    ];

    service.setTypes(newTypes);

    expect(service.getTypes$().getValue()).toEqual(newTypes);
  });

  it('should stop the observable when stop method is called', (done) => {
    service.getTypes$().subscribe({
      next: () => {
        // Do nothing
      },
      error: (err) => {
        done.fail(err);
      },
      complete: () => {
        done();
      },
    });

    service.stop();
  });
});
