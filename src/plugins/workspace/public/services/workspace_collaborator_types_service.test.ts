/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WorkspaceCollaboratorType,
  WorkspaceCollaboratorTypesService,
} from './workspace_collaborator_types_service';

describe('WorkspaceCollaboratorTypesService', () => {
  let service: WorkspaceCollaboratorTypesService;

  beforeEach(() => {
    service = new WorkspaceCollaboratorTypesService();
  });

  afterEach(() => {
    service.stop();
  });

  describe('getTypes$', () => {
    it('should return an observable of collaborator types', () => {
      const collaboratorTypes: WorkspaceCollaboratorType[] = [
        {
          id: 'type1',
          name: 'Type 1',
          buttonLabel: 'Button Label 1',
          onAdd: jest.fn(),
        },
        {
          id: 'type2',
          name: 'Type 2',
          buttonLabel: 'Button Label 2',
          onAdd: jest.fn(),
        },
      ];

      service.setTypes(collaboratorTypes);

      const subscription = service.getTypes$().subscribe((types) => {
        expect(types).toEqual(collaboratorTypes);
      });

      subscription.unsubscribe();
    });
  });

  describe('setTypes', () => {
    it('should update the collaborator types', () => {
      const initialTypes: WorkspaceCollaboratorType[] = [
        {
          id: 'type1',
          name: 'Type 1',
          buttonLabel: 'Button Label 1',
          onAdd: jest.fn(),
        },
      ];

      const updatedTypes: WorkspaceCollaboratorType[] = [
        {
          id: 'type2',
          name: 'Type 2',
          buttonLabel: 'Button Label 2',
          onAdd: jest.fn(),
        },
      ];

      service.setTypes(initialTypes);

      const subscription = service.getTypes$().subscribe((types) => {
        expect(types).toEqual(initialTypes);
        service.setTypes(updatedTypes);
      });

      const secondSubscription = service.getTypes$().subscribe((types) => {
        expect(types).toEqual(updatedTypes);
        subscription.unsubscribe();
        secondSubscription.unsubscribe();
      });
    });
  });

  describe('stop', () => {
    it('should complete the observable and prevent further emissions', () => {
      const collaboratorTypes: WorkspaceCollaboratorType[] = [
        {
          id: 'type1',
          name: 'Type 1',
          buttonLabel: 'Button Label 1',
          onAdd: jest.fn(),
        },
      ];

      service.setTypes(collaboratorTypes);

      const subscription = service.getTypes$().subscribe({
        next: () => {
          // This should not be called after stop()
          expect(true).toBe(false);
        },
        complete: () => {
          // The observable should complete
          expect(true).toBe(true);
        },
      });

      service.stop();

      // Trying to update collaborator types after stop() should not emit any values
      service.setTypes([
        {
          id: 'type2',
          name: 'Type 2',
          buttonLabel: 'Button Label 2',
          onAdd: jest.fn(),
        },
      ]);

      subscription.unsubscribe();
    });
  });
});
