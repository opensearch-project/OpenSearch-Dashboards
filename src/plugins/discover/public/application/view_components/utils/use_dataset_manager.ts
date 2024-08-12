/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Subscription } from 'rxjs';
import { DataSetManager } from '../../../../../data/public';
import { SimpleDataSet } from '../../../../../data/common';

interface UseDataSetManagerProps {
  dataSet?: SimpleDataSet;
  dataSetManager: DataSetManager;
}

export const useDataSetManager = (props: UseDataSetManagerProps) => {
  const [dataSet, setDataSet] = useState<SimpleDataSet | undefined>(
    props.dataSet || props.dataSetManager.getDataSet()
  );

  useEffect(() => {
    const subscriptions = new Subscription();

    subscriptions.add(
      props.dataSetManager.getUpdates$().subscribe({
        next: () => {
          const newDataSet = props.dataSetManager.getDataSet();
          setDataSet(newDataSet);
        },
      })
    );

    return () => {
      subscriptions.unsubscribe();
    };
  }, [dataSet, props.dataSet, props.dataSetManager]);

  return { dataSet };
};
