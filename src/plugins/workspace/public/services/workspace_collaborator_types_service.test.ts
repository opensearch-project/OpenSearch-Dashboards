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

      // Track all emitted values
      const emittedValues: WorkspaceCollaboratorType[][] = [];
      const subscription = service.getTypes$().subscribe((types) => {
        emittedValues.push(types);
      });

      // Initially empty
      expect(emittedValues).toHaveLength(1);
      expect(emittedValues[0]).toEqual([]);

      // Set initial types
      service.setTypes(initialTypes);
      expect(emittedValues).toHaveLength(2);
      expect(emittedValues[1]).toEqual(initialTypes);

      // Update to new types
      service.setTypes(updatedTypes);
      expect(emittedValues).toHaveLength(3);
      expect(emittedValues[2]).toEqual(updatedTypes);

      subscription.unsubscribe();
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

      // Track emissions and completion
      const emittedValues: WorkspaceCollaboratorType[][] = [];
      let completed = false;

      const subscription = service.getTypes$().subscribe({
        next: (types) => {
          emittedValues.push(types);
        },
        complete: () => {
          completed = true;
        },
      });

      // BehaviorSubject emits current value immediately on subscribe
      expect(emittedValues).toHaveLength(1);
      expect(emittedValues[0]).toEqual(collaboratorTypes);

      service.stop();

      // Observable should complete
      expect(completed).toBe(true);

      // Trying to update collaborator types after stop() should not emit any values
      service.setTypes([
        {
          id: 'type2',
          name: 'Type 2',
          buttonLabel: 'Button Label 2',
          onAdd: jest.fn(),
        },
      ]);

      // No new emissions after stop
      expect(emittedValues).toHaveLength(1);

      subscription.unsubscribe();
    });
  });
});
