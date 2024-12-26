/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../../core/public/mocks';
import { checkAgentsExist } from './get_is_summary_agent';

describe('checkAgentsExist', () => {
  const coreSetupMock = coreMock.createSetup({});
  const httpMock = coreSetupMock.http;

  it('should call http.get with one agentConfigName', async () => {
    const agentConfigName = 'name1';
    const dataSourceId = 'testDataSourceId';
    const response = { exists: true };

    httpMock.get.mockResolvedValue(response);

    const result = await checkAgentsExist(httpMock, agentConfigName, dataSourceId);

    expect(httpMock.get).toHaveBeenCalledWith(expect.any(String), {
      query: {
        agentConfigName: 'name1',
        dataSourceId: 'testDataSourceId',
      },
    });
    expect(result).toEqual(response);
  });

  it('should call http.get with agentConfigName array', async () => {
    const agentConfigNames = ['name1', 'name2'];
    const dataSourceId = 'testDataSourceId';
    const response = { exists: true };

    httpMock.get.mockResolvedValue(response);

    const result = await checkAgentsExist(httpMock, agentConfigNames, dataSourceId);

    expect(httpMock.get).toHaveBeenCalledWith(expect.any(String), {
      query: {
        agentConfigName: agentConfigNames,
        dataSourceId,
      },
    });
    expect(result).toEqual(response);
  });

  it('should throw an error if http.get fails', async () => {
    const agentConfigName = 'name1';
    const dataSourceId = 'testDataSourceId';

    const error = new Error('api call error');
    httpMock.get.mockRejectedValue(error);

    await expect(checkAgentsExist(httpMock, agentConfigName, dataSourceId)).rejects.toThrow(error);
  });
});
