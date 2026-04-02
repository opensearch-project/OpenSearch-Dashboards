/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { setupSessionExpiredInterceptor } from './session_expired_interceptor';
import { httpServiceMock } from './http_service.mock';
import { notificationServiceMock } from '../notifications/notifications_service.mock';
import { HttpInterceptor, IHttpInterceptController } from './types';

describe('setupSessionExpiredInterceptor', () => {
  let http: ReturnType<typeof httpServiceMock.createSetupContract>;
  let notifications: ReturnType<typeof notificationServiceMock.createSetupContract>;
  let interceptor: HttpInterceptor;
  let controller: jest.Mocked<IHttpInterceptController>;

  beforeEach(() => {
    jest.useFakeTimers();
    http = httpServiceMock.createSetupContract();
    notifications = notificationServiceMock.createSetupContract();

    setupSessionExpiredInterceptor(http, notifications);

    // Extract the interceptor that was registered
    expect(http.intercept).toHaveBeenCalledTimes(1);
    interceptor = http.intercept.mock.calls[0][0];

    controller = {
      halted: false,
      halt: jest.fn(),
    } as any;

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('registers an http interceptor', () => {
    expect(http.intercept).toHaveBeenCalledTimes(1);
    expect(interceptor.responseError).toBeDefined();
  });

  it('shows a warning toast and redirects on 401 with X-Auth-Redirect-URL header', () => {
    const mockHeaders = new Headers({ 'X-Auth-Redirect-URL': '/auth/login' });
    const mockResponse = { status: 401, headers: mockHeaders } as Response;

    interceptor.responseError!(
      {
        error: new Error('Unauthorized'),
        response: mockResponse,
        request: {} as Request,
        fetchOptions: { path: '/api/test' } as any,
        body: undefined,
      },
      controller
    );

    expect(notifications.toasts.addWarning).toHaveBeenCalledTimes(1);
    expect(notifications.toasts.addWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(String),
        text: expect.any(String),
      }),
      { toastLifeTimeMs: 5000 }
    );
    const callArgs = (notifications.toasts.addWarning as jest.Mock).mock.calls[0];
    expect(callArgs[0].title).toContain('Session expired');
    expect(callArgs[0].text).toContain('Redirecting to the login page');
    expect(controller.halt).toHaveBeenCalledTimes(1);

    // Redirect should not happen immediately
    expect(window.location.href).toBe('');

    // Redirect should happen after 5 seconds
    jest.advanceTimersByTime(5000);
    expect(window.location.href).toBe('/auth/login');
  });

  it('does not redirect or show toast for non-401 errors', () => {
    const mockHeaders = new Headers();
    const mockResponse = { status: 500, headers: mockHeaders } as Response;

    interceptor.responseError!(
      {
        error: new Error('Internal Server Error'),
        response: mockResponse,
        request: {} as Request,
        fetchOptions: { path: '/api/test' } as any,
        body: undefined,
      },
      controller
    );

    expect(notifications.toasts.addWarning).not.toHaveBeenCalled();
    expect(controller.halt).not.toHaveBeenCalled();
  });

  it('does not redirect if X-Auth-Redirect-URL header is missing', () => {
    const mockHeaders = new Headers();
    const mockResponse = { status: 401, headers: mockHeaders } as Response;

    interceptor.responseError!(
      {
        error: new Error('Unauthorized'),
        response: mockResponse,
        request: {} as Request,
        fetchOptions: { path: '/api/test' } as any,
        body: undefined,
      },
      controller
    );

    expect(notifications.toasts.addWarning).not.toHaveBeenCalled();
    expect(controller.halt).not.toHaveBeenCalled();
  });

  it('does not show multiple toasts when multiple 401s arrive', () => {
    const mockHeaders = new Headers({ 'X-Auth-Redirect-URL': '/auth/login' });
    const mockResponse = { status: 401, headers: mockHeaders } as Response;
    const errorResponse = {
      error: new Error('Unauthorized'),
      response: mockResponse,
      request: {} as Request,
      fetchOptions: { path: '/api/test' } as any,
      body: undefined,
    };

    // First 401
    interceptor.responseError!(errorResponse, controller);
    // Second 401
    interceptor.responseError!(errorResponse, controller);
    // Third 401
    interceptor.responseError!(errorResponse, controller);

    // Toast and halt should only fire once
    expect(notifications.toasts.addWarning).toHaveBeenCalledTimes(1);
    expect(controller.halt).toHaveBeenCalledTimes(1);
  });

  it('does not act when response is undefined', () => {
    interceptor.responseError!(
      {
        error: new Error('Network error'),
        response: undefined as any,
        request: {} as Request,
        fetchOptions: { path: '/api/test' } as any,
        body: undefined,
      },
      controller
    );

    expect(notifications.toasts.addWarning).not.toHaveBeenCalled();
    expect(controller.halt).not.toHaveBeenCalled();
  });

  it('rejects absolute URLs to external domains (open redirect protection)', () => {
    const mockHeaders = new Headers({
      'X-Auth-Redirect-URL': 'https://evil.com/phishing',
    });
    const mockResponse = { status: 401, headers: mockHeaders } as Response;

    interceptor.responseError!(
      {
        error: new Error('Unauthorized'),
        response: mockResponse,
        request: {} as Request,
        fetchOptions: { path: '/api/test' } as any,
        body: undefined,
      },
      controller
    );

    expect(notifications.toasts.addWarning).not.toHaveBeenCalled();
    expect(controller.halt).not.toHaveBeenCalled();
  });

  it('rejects protocol-relative URLs (open redirect protection)', () => {
    const mockHeaders = new Headers({
      'X-Auth-Redirect-URL': '//evil.com/phishing',
    });
    const mockResponse = { status: 401, headers: mockHeaders } as Response;

    interceptor.responseError!(
      {
        error: new Error('Unauthorized'),
        response: mockResponse,
        request: {} as Request,
        fetchOptions: { path: '/api/test' } as any,
        body: undefined,
      },
      controller
    );

    expect(notifications.toasts.addWarning).not.toHaveBeenCalled();
    expect(controller.halt).not.toHaveBeenCalled();
  });

  it('allows same-origin absolute URLs', () => {
    // In jsdom, window.location.origin is typically 'http://localhost'
    (window as any).location = { href: '', origin: 'http://localhost' };
    const sameOriginURL = 'http://localhost/auth/login';
    const mockHeaders = new Headers({ 'X-Auth-Redirect-URL': sameOriginURL });
    const mockResponse = { status: 401, headers: mockHeaders } as Response;

    interceptor.responseError!(
      {
        error: new Error('Unauthorized'),
        response: mockResponse,
        request: {} as Request,
        fetchOptions: { path: '/api/test' } as any,
        body: undefined,
      },
      controller
    );

    expect(notifications.toasts.addWarning).toHaveBeenCalledTimes(1);
    expect(controller.halt).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(5000);
    expect(window.location.href).toBe(sameOriginURL);
  });

  it('resets isRedirecting flag after redirect timeout so subsequent 401s can retrigger', () => {
    const mockHeaders = new Headers({ 'X-Auth-Redirect-URL': '/auth/login' });
    const mockResponse = { status: 401, headers: mockHeaders } as Response;
    const errorResponse = {
      error: new Error('Unauthorized'),
      response: mockResponse,
      request: {} as Request,
      fetchOptions: { path: '/api/test' } as any,
      body: undefined,
    };

    // First 401
    interceptor.responseError!(errorResponse, controller);
    expect(notifications.toasts.addWarning).toHaveBeenCalledTimes(1);

    // Advance past the redirect timeout — flag resets
    jest.advanceTimersByTime(5000);

    // Second 401 after reset should trigger again
    interceptor.responseError!(errorResponse, controller);
    expect(notifications.toasts.addWarning).toHaveBeenCalledTimes(2);
  });

  it('calls controller.halt() before the redirect timeout fires', () => {
    const mockHeaders = new Headers({ 'X-Auth-Redirect-URL': '/auth/login' });
    const mockResponse = { status: 401, headers: mockHeaders } as Response;

    interceptor.responseError!(
      {
        error: new Error('Unauthorized'),
        response: mockResponse,
        request: {} as Request,
        fetchOptions: { path: '/api/test' } as any,
        body: undefined,
      },
      controller
    );

    // halt() is called synchronously, before the setTimeout fires
    expect(controller.halt).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('');
  });
});
