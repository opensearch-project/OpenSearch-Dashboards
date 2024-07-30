/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Subscription } from 'rxjs';
import { DataSetContract } from '../../../../../data/public';
import { SimpleDataSet } from '../../../../../data/common';

interface UseDataSetManagerProps {
  dataSet?: SimpleDataSet;
  dataSetManager: DataSetContract;
}

export const useDataSetManager = (props: UseDataSetManagerProps) => {
  const [dataSet, setDataSet] = useState<SimpleDataSet | undefined>(
    props.dataSet || props.dataSetManager.getDataSet()
  );

  useEffect(() => {
    let isMounted = true;
    const subscriptions = new Subscription();

    // Subscribe to all updates, including the first emission
    subscriptions.add(
      props.dataSetManager.getUpdates$().subscribe({
        next: (newDataSet) => {
          if (isMounted) {
            setDataSet(newDataSet);
          }
        },
      })
    );

    return () => {
      isMounted = false;
      subscriptions.unsubscribe();
    };
  }, [props.dataSetManager]);

  const updateDataSet = useCallback(
    (newDataSet: SimpleDataSet) => {
      props.dataSetManager.setDataSet(newDataSet);
      // We don't need to call setDataSet here as the subscription will handle that
    },
    [props.dataSetManager]
  );

  return useMemo(() => ({ dataSet, setDataSet: updateDataSet }), [dataSet, updateDataSet]);
};
