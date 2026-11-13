/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { MultiQueryBuilder } from './multi_query_builder';
import { getServices as getExploreServices } from '../../../services/services';

const MultiQueryBuilderContext = createContext<MultiQueryBuilder | undefined>(undefined);

export const MultiQueryBuilderProvider = ({ children }: { children: ReactNode }) => {
  const [builder, setBuilder] = useState<MultiQueryBuilder | undefined>(undefined);

  useEffect(() => {
    const newBuilder = new MultiQueryBuilder(getExploreServices);
    setBuilder(newBuilder);
    return () => {
      newBuilder.dispose();
    };
  }, []);

  if (!builder) return null;

  return (
    <MultiQueryBuilderContext.Provider value={builder}>
      {children}
    </MultiQueryBuilderContext.Provider>
  );
};

export const useMultiQueryBuilder = () => {
  const builder = useContext(MultiQueryBuilderContext);
  if (!builder) {
    throw new Error('useMultiQueryBuilder must be used within a MultiQueryBuilderProvider');
  }
  return builder;
};
