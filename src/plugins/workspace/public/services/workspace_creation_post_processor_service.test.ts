/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { ApplicationStart, HttpStart } from '../../../../core/public';
import { coreMock } from '../../../../core/public/mocks';
import {
  WorkspaceCreationPostProcessorService,
  WorkspaceCreationPostProcessor,
} from './workspace_creation_post_processor_service';

describe('WorkspaceCreationPostProcessorService', () => {
  let service: WorkspaceCreationPostProcessorService;
  let mockHttp: HttpStart;
  let mockApplication: ApplicationStart;

  beforeEach(() => {
    const coreStartMock = coreMock.createStart();
    mockHttp = coreStartMock.http;
    mockApplication = coreStartMock.application;

    service = WorkspaceCreationPostProcessorService.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the default processor initially', () => {
    const defaultProcessor = service.getProcessor();
    expect(defaultProcessor).toBeDefined();
  });

  it('should register a new processor', () => {
    const mockProcessor: WorkspaceCreationPostProcessor = jest.fn();
    const unregister = service.registerProcessor(mockProcessor);

    const registeredProcessor = service.getProcessor();
    expect(registeredProcessor).toBe(mockProcessor);

    unregister();
    const defaultProcessor = service.getProcessor();
    expect(defaultProcessor).not.toBe(mockProcessor);
  });

  it('should call the default processor with correct arguments', () => {
    const workspaceId = 'workspace-id';
    const mockUseCaseLandingAppId = 'use-case-landing-app';
    const defaultProcessor = service.getProcessor();
    const { location: originalLocation } = window;
    const setHrefSpy = jest.fn((href) => href);
    if (window.location) {
      // @ts-ignore
      delete window.location;
    }
    window.location = {} as Location;
    Object.defineProperty(window.location, 'href', {
      get: () => 'http://localhost/w/workspace/app/workspace_create',
      set: setHrefSpy,
    });
    jest.spyOn(mockApplication, 'getUrlForApp').mockImplementation((appId) => `/app/${appId}`);

    jest.useFakeTimers();
    defaultProcessor({
      http: mockHttp,
      workspaceId,
      application: mockApplication,
      useCaseLandingAppId: mockUseCaseLandingAppId,
    });
    jest.runAllTimers();

    expect(setHrefSpy).toHaveBeenCalledWith(
      expect.stringContaining(`/w/${workspaceId}/app/${mockUseCaseLandingAppId}`)
    );

    jest.useRealTimers();
    window.location = originalLocation;
  });
});
