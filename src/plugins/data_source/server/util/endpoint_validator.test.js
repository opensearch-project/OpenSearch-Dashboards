/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as validator from './endpoint_validator';

describe('endpoint_validator', function () {
  const BLOCKED_IP_LIST = [
    '127.0.0.0/8',
    '::1/128',
    '169.254.0.0/16',
    'fe80::/10',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    'fc00::/7',
    '0.0.0.0/8',
    '100.64.0.0/10',
    '192.0.0.0/24',
    '192.0.2.0/24',
    '198.18.0.0/15',
    '192.88.99.0/24',
    '198.51.100.0/24',
    '203.0.113.0/24',
    '224.0.0.0/4',
    '240.0.0.0/4',
    '255.255.255.255/32',
    '::/128',
    '2001:db8::/32',
    'ff00::/8',
  ];

  it('Url1 that should be blocked should return invalid with error', async function () {
    const result = await validator.isValidURL('http://127.0.0.1', ['127.0.0.0/8']);
    expect(result.valid).toEqual(false);
    expect(result.error).toBeDefined();
  });

  it('Url2 that is invalid should return invalid with error', async function () {
    const result = await validator.isValidURL('www.test.com', []);
    expect(result.valid).toEqual(false);
    expect(result.error).toBeDefined();
  });

  it('Url3 that is invalid should return invalid with error', async function () {
    const result = await validator.isValidURL('ftp://www.test.com', []);
    expect(result.valid).toEqual(false);
    expect(result.error).toBeDefined();
  });

  it('Url4 that should be blocked should return invalid with error', async function () {
    const result = await validator.isValidURL('http://169.254.169.254/latest/meta-data/', [
      '169.254.0.0/16',
    ]);
    expect(result.valid).toEqual(false);
    expect(result.error).toBeDefined();
  });

  it('Url5 that should not be blocked should return valid', async function () {
    const result = await validator.isValidURL('https://www.opensearch.org', ['127.0.0.0/8']);
    expect(result.valid).toEqual(true);
    expect(result.error).toBeUndefined();
  });

  it('Url6 that should not be blocked should return valid when null IPs', async function () {
    const result = await validator.isValidURL('https://www.opensearch.org');
    expect(result.valid).toEqual(true);
    expect(result.error).toBeUndefined();
  });

  it('allowlisted url should bypass IP validation', async function () {
    const allowlistedSuffixes = ['.allowlisted-service.example.com'];
    const result = await validator.isValidURL(
      'https://test.allowlisted-service.example.com',
      BLOCKED_IP_LIST,
      allowlistedSuffixes
    );
    expect(result.valid).toEqual(true);
    expect(result.error).toBeUndefined();
  });

  it('non-allowlisted url should go through normal IP validation', async function () {
    const allowlistedSuffixes = ['.allowlisted-service.example.com'];
    const result = await validator.isValidURL(
      'https://www.opensearch.org',
      BLOCKED_IP_LIST,
      allowlistedSuffixes
    );
    expect(result.valid).toEqual(true);
    expect(result.error).toBeUndefined();
  });

  it('url not matching allowlist should be validated normally', async function () {
    const allowlistedSuffixes = ['.allowlisted.example.com'];
    const result = await validator.isValidURL(
      'https://notallowlisted.example.com',
      BLOCKED_IP_LIST,
      allowlistedSuffixes
    );
    // Will depend on DNS resolution
    expect(result.valid).toBeDefined();
  });

  describe('deniedIPs validation', () => {
    it('should block IPv4 address in denied CIDR range', async () => {
      const result = await validator.isValidURL('http://192.168.1.100', ['192.168.0.0/16']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('192.168.1.100');
      expect(result.error).toContain('192.168.0.0/16');
      expect(result.userMessage).toEqual('Endpoint IP address is not allowed');
    });

    it('should block IPv4 address matching exact IP in denied list', async () => {
      const result = await validator.isValidURL('http://10.0.0.1', ['10.0.0.1/32']);
      expect(result.valid).toEqual(false);
      expect(result.error).toBeDefined();
      expect(result.userMessage).toEqual('Endpoint IP address is not allowed');
    });

    it('should block multiple private IP ranges', async () => {
      const deniedIPs = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

      const result1 = await validator.isValidURL('http://10.5.5.5', deniedIPs);
      expect(result1.valid).toEqual(false);

      const result2 = await validator.isValidURL('http://172.20.1.1', deniedIPs);
      expect(result2.valid).toEqual(false);

      const result3 = await validator.isValidURL('http://192.168.100.50', deniedIPs);
      expect(result3.valid).toEqual(false);
    });

    it('should block loopback addresses', async () => {
      const result1 = await validator.isValidURL('http://127.0.0.1', ['127.0.0.0/8']);
      expect(result1.valid).toEqual(false);

      const result2 = await validator.isValidURL('http://127.255.255.255', ['127.0.0.0/8']);
      expect(result2.valid).toEqual(false);
    });

    it('should block link-local addresses', async () => {
      const result = await validator.isValidURL('http://169.254.1.1', ['169.254.0.0/16']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('169.254.1.1');
    });

    it('should block IPv6 loopback address', async () => {
      const result = await validator.isValidURL('http://[::1]', ['::1/128']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('::1');
    });

    it('should block IPv6 link-local addresses', async () => {
      const result = await validator.isValidURL('http://[fe80::1]', ['fe80::/10']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('fe80::1');
    });

    it('should block IPv6 unique local addresses', async () => {
      const result = await validator.isValidURL('http://[fc00::1]', ['fc00::/7']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('fc00::1');
    });

    it('should allow public IPv4 addresses not in denied list', async () => {
      const deniedIPs = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
      const result = await validator.isValidURL('http://8.8.8.8', deniedIPs);
      expect(result.valid).toEqual(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow public IP when not in denied CIDR range', async () => {
      const deniedIPs = ['192.168.0.0/16'];
      const result = await validator.isValidURL('http://1.1.1.1', deniedIPs);
      expect(result.valid).toEqual(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow IP outside of denied range', async () => {
      const deniedIPs = ['10.0.0.0/8'];
      // Public IP that's not in the 10.0.0.0/8 range
      const result = await validator.isValidURL('http://11.0.0.1', deniedIPs);
      expect(result.valid).toEqual(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle empty deniedIPs array with IP address', async () => {
      const result = await validator.isValidURL('http://8.8.8.8', []);
      expect(result.valid).toEqual(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle undefined deniedIPs with IP address', async () => {
      const result = await validator.isValidURL('http://1.1.1.1');
      expect(result.valid).toEqual(true);
      expect(result.error).toBeUndefined();
    });

    it('should block broadcast address', async () => {
      const result = await validator.isValidURL('http://255.255.255.255', ['255.255.255.255/32']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('255.255.255.255');
    });

    it('should block unspecified address', async () => {
      const result = await validator.isValidURL('http://0.0.0.0', ['0.0.0.0/8']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('0.0.0.0');
    });

    it('should block CGNAT range', async () => {
      const result = await validator.isValidURL('http://100.64.0.1', ['100.64.0.0/10']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('100.64.0.1');
    });

    it('should block multicast addresses', async () => {
      const result = await validator.isValidURL('http://224.0.0.1', ['224.0.0.0/4']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('224.0.0.1');
    });

    it('should block reserved addresses', async () => {
      const result = await validator.isValidURL('http://240.0.0.1', ['240.0.0.0/4']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('240.0.0.1');
    });

    it('should block documentation IPv6 range', async () => {
      const result = await validator.isValidURL('http://[2001:db8::1]', ['2001:db8::/32']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('2001:db8::1');
    });

    it('should block IPv6 multicast addresses', async () => {
      const result = await validator.isValidURL('http://[ff00::1]', ['ff00::/8']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('ff00::1');
    });

    it('should check all denied IPs and stop at first match', async () => {
      const deniedIPs = ['8.8.8.8/32', '10.0.0.0/8', '192.168.0.0/16'];
      const result = await validator.isValidURL('http://10.1.1.1', deniedIPs);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('10.1.1.1');
      expect(result.error).toContain('10.0.0.0/8');
    });

    it('should provide detailed error message with IP range', async () => {
      const result = await validator.isValidURL('http://192.168.1.100', ['192.168.0.0/16']);
      expect(result.valid).toEqual(false);
      expect(result.error).toContain('IP 192.168.1.100 is blocked');
      expect(result.error).toContain('denied range 192.168.0.0/16');
      expect(result.error).toMatch(/\d+\.\d+\.\d+\.\d+ - \d+\.\d+\.\d+\.\d+/); // Should contain range
    });

    it('should validate with comprehensive BLOCKED_IP_LIST', async () => {
      const result = await validator.isValidURL('http://127.0.0.1', BLOCKED_IP_LIST);
      expect(result.valid).toEqual(false);
      expect(result.error).toBeDefined();
      expect(result.userMessage).toEqual('Endpoint IP address is not allowed');
    });
  });
});
