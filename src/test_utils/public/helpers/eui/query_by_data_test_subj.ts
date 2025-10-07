/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const queryByDataTestSubj = (
  container: HTMLElement,
  dataTestSubj: string
): HTMLElement | null => {
  return container.querySelector(`[data-test-subj="${dataTestSubj}"]`);
};
