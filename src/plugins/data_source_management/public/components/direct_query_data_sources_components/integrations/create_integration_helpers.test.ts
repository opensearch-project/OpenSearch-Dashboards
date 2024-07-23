/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  checkDataSourceName,
  doExistingDataSourceValidation,
  doNestedPropertyValidation,
  doPropertyValidation,
  doTypeValidation,
  fetchDataSourceMappings,
  fetchIntegrationMappings,
} from './create_integration_helpers';
import { HttpStart } from 'opensearch-dashboards/public';

jest.mock('./create_integration_helpers', () => ({
  ...jest.requireActual('./create_integration_helpers'),
  checkDataSourceName: jest.fn(),
}));

describe('doTypeValidation', () => {
  it('should return true if required type is not specified', () => {
    const toCheck = { type: 'string' };
    const required = {};

    const result = doTypeValidation(toCheck, required);

    expect(result.ok).toBe(true);
  });

  it('should return true if types match', () => {
    const toCheck = { type: 'string' };
    const required = { type: 'string' };

    const result = doTypeValidation(toCheck, required);

    expect(result.ok).toBe(true);
  });

  it('should return true if object has properties', () => {
    const toCheck = { properties: { prop1: { type: 'string' } } };
    const required = { type: 'object' };

    const result = doTypeValidation(toCheck, required);

    expect(result.ok).toBe(true);
  });

  it('should return false if types do not match', () => {
    const toCheck = { type: 'string' };
    const required = { type: 'number' };

    const result = doTypeValidation(toCheck, required);

    expect(result.ok).toBe(false);
  });
});

describe('doNestedPropertyValidation', () => {
  it('should return true if type validation passes and no properties are required', () => {
    const toCheck = { type: 'string' };
    const required = { type: 'string' };

    const result = doNestedPropertyValidation(toCheck, required);

    expect(result.ok).toBe(true);
  });

  it('should return false if type validation fails', () => {
    const toCheck = { type: 'string' };
    const required = { type: 'number' };

    const result = doNestedPropertyValidation(toCheck, required);

    expect(result.ok).toBe(false);
  });

  it('should return false if a required property is missing', () => {
    const toCheck = { type: 'object', properties: { prop1: { type: 'string' } } };
    const required = {
      type: 'object',
      properties: { prop1: { type: 'string' }, prop2: { type: 'number' } },
    };

    const result = doNestedPropertyValidation(toCheck, required);

    expect(result.ok).toBe(false);
  });

  it('should return true if all required properties pass validation', () => {
    const toCheck = {
      type: 'object',
      properties: {
        prop1: { type: 'string' },
        prop2: { type: 'number' },
      },
    };
    const required = {
      type: 'object',
      properties: {
        prop1: { type: 'string' },
        prop2: { type: 'number' },
      },
    };

    const result = doNestedPropertyValidation(toCheck, required);

    expect(result.ok).toBe(true);
  });
});

describe('doPropertyValidation', () => {
  it('should return true if all properties pass validation', () => {
    const rootType = 'root';
    const dataSourceProps = {
      prop1: { type: 'string' },
      prop2: { type: 'number' },
    };
    const requiredMappings = {
      root: {
        template: {
          mappings: {
            properties: {
              prop1: { type: 'string' },
              prop2: { type: 'number' },
            },
          },
        },
      },
    };

    const result = doPropertyValidation(rootType, dataSourceProps as any, requiredMappings);

    expect(result.ok).toBe(true);
  });

  it('should return false if a property fails validation', () => {
    const rootType = 'root';
    const dataSourceProps = {
      prop1: { type: 'string' },
      prop2: { type: 'number' },
    };
    const requiredMappings = {
      root: {
        template: {
          mappings: {
            properties: {
              prop1: { type: 'string' },
              prop2: { type: 'boolean' },
            },
          },
        },
      },
    };

    const result = doPropertyValidation(rootType, dataSourceProps as any, requiredMappings);

    expect(result.ok).toBe(false);
  });

  it('should return false if a required nested property is missing', () => {
    const rootType = 'root';
    const dataSourceProps = {
      prop1: { type: 'string' },
    };
    const requiredMappings = {
      root: {
        template: {
          mappings: {
            properties: {
              prop1: { type: 'string' },
              prop2: { type: 'number' },
            },
          },
        },
      },
    };

    const result = doPropertyValidation(rootType, dataSourceProps as any, requiredMappings);

    expect(result.ok).toBe(false);
  });
});

describe('checkDataSourceName', () => {
  beforeEach(() => {
    (checkDataSourceName as jest.Mock).mockImplementation((name, type) => {
      const isValid =
        /^[a-z\d\.][a-z\d\._\-\*]*$/.test(name) &&
        new RegExp(`^ss4?o_${type}-[^\\-]+-.+`).test(name);
      return isValid ? { ok: true } : { ok: false, errors: ['Invalid index name'] };
    });
  });

  it('Filters out invalid index names', () => {
    const result = checkDataSourceName('ss4o_logs-no-exclams!', 'logs');

    expect(result.ok).toBe(false);
  });

  it('Filters out incorrectly typed indices', () => {
    const result = checkDataSourceName('ss4o_metrics-test-test', 'logs');

    expect(result.ok).toBe(false);
  });

  it('Accepts correct indices', () => {
    const result = checkDataSourceName('ss4o_logs-test-test', 'logs');

    expect(result.ok).toBe(true);
  });
});

describe('fetchDataSourceMappings', () => {
  it('Retrieves mappings', async () => {
    const mockHttp = {
      post: jest.fn().mockResolvedValue({
        source1: { mappings: { properties: { test: true } } },
        source2: { mappings: { properties: { test: true } } },
      }),
    } as Partial<HttpStart>;

    const result = fetchDataSourceMappings('sample', mockHttp as HttpStart);

    await expect(result).resolves.toMatchObject({
      source1: { properties: { test: true } },
      source2: { properties: { test: true } },
    });
  });

  it('Catches errors', async () => {
    const mockHttp = {
      post: jest.fn().mockRejectedValue(new Error('Mock error')),
    } as Partial<HttpStart>;

    const result = fetchDataSourceMappings('sample', mockHttp as HttpStart);

    await expect(result).resolves.toBeNull();
  });
});

describe('fetchIntegrationMappings', () => {
  it('Returns schema mappings', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({ data: { mappings: { test: true } }, statusCode: 200 }),
    } as Partial<HttpStart>;

    const result = fetchIntegrationMappings('target', mockHttp as HttpStart);

    await expect(result).resolves.toStrictEqual({ test: true });
  });

  it('Returns null if response fails', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({ statusCode: 404 }),
    } as Partial<HttpStart>;

    const result = fetchIntegrationMappings('target', mockHttp as HttpStart);

    await expect(result).resolves.toBeNull();
  });

  it('Catches request error', async () => {
    const mockHttp = {
      get: jest.fn().mockRejectedValue(new Error('mock error')),
    } as Partial<HttpStart>;

    const result = fetchIntegrationMappings('target', mockHttp as HttpStart);

    await expect(result).resolves.toBeNull();
  });
});

describe('doExistingDataSourceValidation', () => {
  const mockHttp = ({
    post: jest.fn(),
    get: jest.fn(),
  } as unknown) as HttpStart;

  it('Catches and returns checkDataSourceName errors', async () => {
    (checkDataSourceName as jest.Mock).mockReturnValue({
      ok: false,
      errors: ['This index does not match the suggested naming convention.'],
    });

    const result = await doExistingDataSourceValidation(
      'ss4o_metrics-test-test',
      'target',
      'logs',
      mockHttp
    );

    expect(result).toEqual({
      ok: false,
      errors: ['This index does not match the suggested naming convention.'],
    });
  });

  it('Catches data stream fetch errors', async () => {
    (checkDataSourceName as jest.Mock).mockReturnValue({ ok: true });
    mockHttp.post.mockRejectedValueOnce(new Error('Error'));
    mockHttp.get.mockResolvedValueOnce({
      data: { mappings: { logs: { template: { mappings: { properties: { test: true } } } } } },
      statusCode: 200,
    });

    const result = await doExistingDataSourceValidation(
      'ss4o_logs-test-test',
      'target',
      'logs',
      mockHttp
    );
    expect(result).toEqual({ ok: false, errors: ['Provided data stream could not be retrieved'] });
  });

  it('Catches integration fetch errors', async () => {
    (checkDataSourceName as jest.Mock).mockReturnValue({ ok: true });
    mockHttp.post.mockResolvedValueOnce({ logs: { mappings: { properties: { test: true } } } });
    mockHttp.get.mockRejectedValueOnce(new Error('Error'));

    const result = await doExistingDataSourceValidation(
      'ss4o_logs-test-test',
      'target',
      'logs',
      mockHttp
    );
    expect(result).toEqual({
      ok: false,
      errors: ['Failed to retrieve integration schema information'],
    });
  });

  it('Catches type validation issues', async () => {
    (checkDataSourceName as jest.Mock).mockReturnValue({ ok: true });
    mockHttp.post.mockResolvedValueOnce({ logs: { mappings: { properties: { test: true } } } });
    mockHttp.get.mockResolvedValueOnce({
      data: { mappings: { logs: { template: { mappings: { properties: { test2: true } } } } } },
      statusCode: 200,
    });

    const result = await doExistingDataSourceValidation(
      'ss4o_logs-test-test',
      'target',
      'logs',
      mockHttp
    );
    expect(result).toEqual({ ok: false, errors: ['The provided index does not match the schema'] });
  });

  it('Returns no errors if everything passes', async () => {
    (checkDataSourceName as jest.Mock).mockReturnValue({ ok: true });
    mockHttp.post.mockResolvedValueOnce({ logs: { mappings: { properties: { test: true } } } });
    mockHttp.get.mockResolvedValueOnce({
      data: { mappings: { logs: { template: { mappings: { properties: { test: true } } } } } },
      statusCode: 200,
    });

    const result = await doExistingDataSourceValidation(
      'ss4o_logs-test-test',
      'target',
      'logs',
      mockHttp
    );
    expect(result).toEqual({ ok: true });
  });
});
