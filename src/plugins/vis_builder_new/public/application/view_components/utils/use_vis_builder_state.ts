/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisBuilderViewServices } from '../../../types';
import { useIndexPattern } from '../../utils/use';

export const useVisBuilderState = (services: VisBuilderViewServices) => {
  const indexPattern = useIndexPattern(services);

  return { indexPattern };
};

export type VisBuilderContextValue = ReturnType<typeof useVisBuilderState>;
