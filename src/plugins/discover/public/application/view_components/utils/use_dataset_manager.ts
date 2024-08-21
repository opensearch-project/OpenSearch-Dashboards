/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Subscription } from 'rxjs';
import { Dataset } from '../../../../../data/common';
import { DatasetContract } from '../../../../../data/public';

interface UseDatasetManagerProps {
  dataset?: Dataset;
  datasetManager: DatasetContract;
}

export const useDatasetManager = (props: UseDatasetManagerProps) => {
  const [dataset, setDataset] = useState<Dataset | undefined>(
    props.dataset || props.datasetManager.getDataset()
  );

  useEffect(() => {
    const subscriptions = new Subscription();

    subscriptions.add(
      props.datasetManager.getUpdates$().subscribe({
        next: () => {
          const newDataset = props.datasetManager.getDataset();
          setDataset(newDataset);
        },
      })
    );

    return () => {
      subscriptions.unsubscribe();
    };
  }, [dataset, props.dataset, props.datasetManager]);

  return { dataset };
};
