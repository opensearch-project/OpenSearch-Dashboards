/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/react';
import { queryByDataTestSubj } from './query_by_data_test_subj';

export const findByDataTestSubj = async (
  container: HTMLElement,
  dataTestSubj: string,
  timeout: number = 1000
): Promise<HTMLElement> => {
  let element: HTMLElement | null = null;
  await waitFor(
    () => {
      element = queryByDataTestSubj(container, dataTestSubj);
    },
    { timeout }
  );

  if (!element) {
    throw new Error(`Unable to find an element by: [data-test-subj="${dataTestSubj}"]`);
  }
  return element;
};
