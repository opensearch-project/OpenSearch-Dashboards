/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

interface SavedObjectsClient {
  get: (type: string, id: string) => Promise<{ attributes: any }>;
}

export const useDataSourceTitle = (
  savedObjectsClient: SavedObjectsClient,
  dataSourceId?: string
) => {
  const [dataSourceTitle, setDataSourceTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDataSourceTitle = async () => {
      if (dataSourceId) {
        try {
          const dataSourceSavedObject = await savedObjectsClient.get('data-source', dataSourceId);
          const attributes = dataSourceSavedObject.attributes as any;
          setDataSourceTitle(attributes.title || dataSourceId);
        } catch (error) {
          // Fallback to ID if fetch fails
          setDataSourceTitle(dataSourceId);
        }
      } else {
        setDataSourceTitle('');
      }
      setIsLoading(false);
    };

    fetchDataSourceTitle();
  }, [dataSourceId, savedObjectsClient]);

  return { dataSourceTitle, isLoading };
};
