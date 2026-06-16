/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { findReferencingDashboards } from './find_referencing_dashboards';
import { SavedObjectsClientContract, NotificationsStart } from '../../../../../core/public';

describe('findReferencingDashboards', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;
  let mockNotifications: jest.Mocked<NotificationsStart>;

  beforeEach(() => {
    mockSavedObjectsClient = {
      find: jest.fn(),
    } as any;

    mockNotifications = {
      toasts: {
        addError: jest.fn(),
        addSuccess: jest.fn(),
        addWarning: jest.fn(),
        addDanger: jest.fn(),
      },
    } as any;

    jest.clearAllMocks();
  });

  it('should return dashboards that reference the visualization', async () => {
    const mockResponse = {
      savedObjects: [
        {
          id: 'dashboard-1',
          attributes: {
            title: 'Dashboard 1',
            description: 'First dashboard description',
          },
        },
        {
          id: 'dashboard-2',
          attributes: {
            title: 'Dashboard 2',
            description: 'Second dashboard description',
          },
        },
      ],
      total: 2,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
      type: 'dashboard',
      hasReference: {
        type: 'explore',
        id: 'viz-123',
      },
      perPage: 1000,
      fields: ['title', 'description'],
    });

    expect(result).toEqual([
      {
        id: 'dashboard-1',
        title: 'Dashboard 1',
        description: 'First dashboard description',
      },
      {
        id: 'dashboard-2',
        title: 'Dashboard 2',
        description: 'Second dashboard description',
      },
    ]);
  });

  it('should return empty array when no dashboards reference the visualization', async () => {
    const mockResponse = {
      savedObjects: [],
      total: 0,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([]);
  });

  it('should use dashboard id as title when title is missing', async () => {
    const mockResponse = {
      savedObjects: [
        {
          id: 'dashboard-without-title',
          attributes: {},
        },
      ],
      total: 1,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([
      {
        id: 'dashboard-without-title',
        title: 'dashboard-without-title',
        description: undefined,
      },
    ]);
  });

  it('should handle dashboard without description', async () => {
    const mockResponse = {
      savedObjects: [
        {
          id: 'dashboard-1',
          attributes: {
            title: 'Dashboard Without Description',
          },
        },
      ],
      total: 1,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([
      {
        id: 'dashboard-1',
        title: 'Dashboard Without Description',
        description: undefined,
      },
    ]);
  });

  it('should handle empty title gracefully', async () => {
    const mockResponse = {
      savedObjects: [
        {
          id: 'dashboard-1',
          attributes: {
            title: '',
            description: 'Has description but no title',
          },
        },
      ],
      total: 1,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([
      {
        id: 'dashboard-1',
        title: 'dashboard-1',
        description: 'Has description but no title',
      },
    ]);
  });

  it('should return empty array and show error toast when savedObjectsClient.find throws error', async () => {
    const mockError = new Error('Failed to fetch dashboards');
    mockSavedObjectsClient.find.mockRejectedValue(mockError);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([]);
    expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(mockError, {
      title: 'Error find referencing dashboards',
    });
  });

  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network request failed');
    mockSavedObjectsClient.find.mockRejectedValue(networkError);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([]);
    expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(networkError, {
      title: 'Error find referencing dashboards',
    });
  });

  it('should handle large number of dashboards', async () => {
    const mockDashboards = Array.from({ length: 50 }, (_, i) => ({
      id: `dashboard-${i}`,
      attributes: {
        title: `Dashboard ${i}`,
        description: `Description ${i}`,
      },
    }));

    const mockResponse = {
      savedObjects: mockDashboards,
      total: 50,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toHaveLength(50);
    expect(result[0]).toEqual({
      id: 'dashboard-0',
      title: 'Dashboard 0',
      description: 'Description 0',
    });
    expect(result[49]).toEqual({
      id: 'dashboard-49',
      title: 'Dashboard 49',
      description: 'Description 49',
    });
  });

  it('should handle dashboards with special characters in title', async () => {
    const mockResponse = {
      savedObjects: [
        {
          id: 'dashboard-1',
          attributes: {
            title: 'Dashboard with "quotes" & <tags>',
            description: 'Special chars: !@#$%^&*()',
          },
        },
      ],
      total: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([
      {
        id: 'dashboard-1',
        title: 'Dashboard with "quotes" & <tags>',
        description: 'Special chars: !@#$%^&*()',
      },
    ]);
  });

  it('should call find with correct parameters for different visualization IDs', async () => {
    const mockResponse = {
      savedObjects: [],
      total: 0,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    await findReferencingDashboards(mockSavedObjectsClient, 'custom-viz-id-456', mockNotifications);

    expect(mockSavedObjectsClient.find).toHaveBeenCalledWith({
      type: 'dashboard',
      hasReference: {
        type: 'explore',
        id: 'custom-viz-id-456',
      },
      perPage: 1000,
      fields: ['title', 'description'],
    });
  });

  it('should handle dashboard with null title', async () => {
    const mockResponse = {
      savedObjects: [
        {
          id: 'dashboard-null-title',
          attributes: {
            title: null,
            description: 'Dashboard with null title',
          },
        },
      ],
      total: 1,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([
      {
        id: 'dashboard-null-title',
        title: 'dashboard-null-title',
        description: 'Dashboard with null title',
      },
    ]);
  });

  it('should handle dashboard with undefined attributes', async () => {
    const mockResponse = {
      savedObjects: [
        {
          id: 'dashboard-no-attrs',
          attributes: undefined,
        },
      ],
      total: 1,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([
      {
        id: 'dashboard-no-attrs',
        title: 'dashboard-no-attrs',
        description: undefined,
      },
    ]);
  });

  it('should handle dashboard with null description', async () => {
    const mockResponse = {
      savedObjects: [
        {
          id: 'dashboard-1',
          attributes: {
            title: 'Dashboard with Null Description',
            description: null,
          },
        },
      ],
      total: 1,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([
      {
        id: 'dashboard-1',
        title: 'Dashboard with Null Description',
        description: null,
      },
    ]);
  });

  it('should handle mixed scenarios with various attribute states', async () => {
    const mockResponse = {
      savedObjects: [
        {
          id: 'dashboard-complete',
          attributes: {
            title: 'Complete Dashboard',
            description: 'Has everything',
          },
        },
        {
          id: 'dashboard-no-description',
          attributes: {
            title: 'No Description',
          },
        },
        {
          id: 'dashboard-empty-title',
          attributes: {
            title: '',
          },
        },
        {
          id: 'dashboard-minimal',
          attributes: {},
        },
      ],
      total: 4,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([
      {
        id: 'dashboard-complete',
        title: 'Complete Dashboard',
        description: 'Has everything',
      },
      {
        id: 'dashboard-no-description',
        title: 'No Description',
        description: undefined,
      },
      {
        id: 'dashboard-empty-title',
        title: 'dashboard-empty-title',
        description: undefined,
      },
      {
        id: 'dashboard-minimal',
        title: 'dashboard-minimal',
        description: undefined,
      },
    ]);
  });

  it('should only request necessary fields from saved objects', async () => {
    const mockResponse = {
      savedObjects: [],
      total: 0,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    await findReferencingDashboards(mockSavedObjectsClient, 'viz-123', mockNotifications);

    const callArgs = mockSavedObjectsClient.find.mock.calls[0][0];
    expect(callArgs.fields).toEqual(['title', 'description']);
    expect(callArgs.fields).toHaveLength(2);
  });

  it('should verify reference type is explore', async () => {
    const mockResponse = {
      savedObjects: [],
      total: 0,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    await findReferencingDashboards(mockSavedObjectsClient, 'viz-123', mockNotifications);

    const callArgs = mockSavedObjectsClient.find.mock.calls[0][0];
    expect(callArgs.hasReference?.type).toBe('explore');
  });

  it('should use perPage limit of 1000', async () => {
    const mockResponse = {
      savedObjects: [],
      total: 0,
      page: 1,
      perPage: 1000,
    };

    mockSavedObjectsClient.find.mockResolvedValue(mockResponse as any);

    await findReferencingDashboards(mockSavedObjectsClient, 'viz-123', mockNotifications);

    const callArgs = mockSavedObjectsClient.find.mock.calls[0][0];
    expect(callArgs.perPage).toBe(1000);
  });

  it('should handle 401 unauthorized error', async () => {
    const unauthorizedError = new Error('Unauthorized');
    mockSavedObjectsClient.find.mockRejectedValue(unauthorizedError);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([]);
    expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(unauthorizedError, {
      title: 'Error find referencing dashboards',
    });
  });

  it('should handle timeout errors', async () => {
    const timeoutError = new Error('Request timeout');
    mockSavedObjectsClient.find.mockRejectedValue(timeoutError);

    const result = await findReferencingDashboards(
      mockSavedObjectsClient,
      'viz-123',
      mockNotifications
    );

    expect(result).toEqual([]);
    expect(mockNotifications.toasts.addError).toHaveBeenCalledWith(timeoutError, {
      title: 'Error find referencing dashboards',
    });
  });
});
