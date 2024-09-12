/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { readCertificateAuthorities } from './tls_settings_provider';

jest.mock('fs');
const mockReadFileSync: jest.Mock = jest.requireMock('fs').readFileSync;

describe('readCertificateAuthorities', () => {
  test('test readCertificateAuthorities with list of paths', () => {
    const ca: string[] = ['some-path'];
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const certificateAuthorities = readCertificateAuthorities(ca);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    mockReadFileSync.mockClear();
    expect(certificateAuthorities).toEqual({
      certificateAuthorities: ['content-of-some-path'],
    });
  });

  test('test readCertificateAuthorities with single path', () => {
    const ca: string = 'some-path';
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const certificateAuthorities = readCertificateAuthorities(ca);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    mockReadFileSync.mockClear();
    expect(certificateAuthorities).toEqual({
      certificateAuthorities: ['content-of-some-path'],
    });
  });

  test('test readCertificateAuthorities empty list', () => {
    const ca: string[] = [];
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const certificateAuthorities = readCertificateAuthorities(ca);
    expect(mockReadFileSync).toHaveBeenCalledTimes(0);
    mockReadFileSync.mockClear();
    expect(certificateAuthorities).toEqual({
      certificateAuthorities: undefined,
    });
  });

  test('test readCertificateAuthorities undefined', () => {
    const ca = undefined;
    mockReadFileSync.mockReset();
    mockReadFileSync.mockImplementation((path: string) => `content-of-${path}`);
    const certificateAuthorities = readCertificateAuthorities(ca);
    expect(mockReadFileSync).toHaveBeenCalledTimes(0);
    mockReadFileSync.mockClear();
    expect(certificateAuthorities).toEqual({
      certificateAuthorities: undefined,
    });
  });
});
