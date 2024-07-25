/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Subscription } from 'rxjs';
import { SimpleDataSet } from '../../../../../data/common';
import { DataSetContract } from '../../../query';

interface UseDataSetManagerProps {
  dataSet?: SimpleDataSet;
  dataSetManager: DataSetContract;
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
