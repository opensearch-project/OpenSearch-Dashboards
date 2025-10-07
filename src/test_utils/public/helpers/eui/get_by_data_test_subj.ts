/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { queryByDataTestSubj } from './query_by_data_test_subj';

export const getByDataTestSubj = (container: HTMLElement, dataTestSubj: string): HTMLElement => {
  const element = queryByDataTestSubj(container, dataTestSubj);
  if (!element) {
    throw new Error(`Unable to find an element by: [data-test-subj="${dataTestSubj}"]`);
  }
  return element;
};
