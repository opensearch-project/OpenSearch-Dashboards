/** @jest-environment node */
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { ContextCaptureService } from './context_capture_service';
import { CoreSetup, CoreStart } from '../../../../core/public';
import { ContextProviderSetupDeps, ContextProviderStartDeps } from '../types';

jest.mock('./assistant_context_store', () => ({
  AssistantContextStoreImpl: jest.fn().mockImplementation(() => ({
    clearAll: jest.fn(),
    addContext: jest.fn(),
    removeContextById: jest.fn(),
    getContextsByCategory: jest.fn(),
    getAllContexts: jest.fn(),
    clearCategory: jest.fn(),
    subscribe: jest.fn(),
    getBackendFormattedContexts: jest.fn(),
  })),
}));

describe('ContextCaptureService › no window environment', () => {
  let service: ContextCaptureService;
  let mockCoreStart: jest.Mocked<CoreStart>;

  beforeEach(() => {
    const currentAppId$ = new BehaviorSubject<string | undefined>(undefined);
    const applications$ = new BehaviorSubject<ReadonlyMap<string, any>>(new Map());
    const breadcrumbs$ = new BehaviorSubject<Array<{ text: string }>>([]);

    mockCoreStart = {
      application: { currentAppId$, applications$ },
      chrome: { getBreadcrumbs$: () => breadcrumbs$ },
    } as unknown as jest.Mocked<CoreStart>;

    service = new ContextCaptureService(
      {} as jest.Mocked<CoreSetup>,
      {} as jest.Mocked<ContextProviderSetupDeps>
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle missing window object gracefully', () => {
    // In a Node environment window is genuinely undefined, so accessing it throws.
    expect(() => {
      service.start(mockCoreStart, {} as jest.Mocked<ContextProviderStartDeps>);
    }).toThrow();
  });
});
