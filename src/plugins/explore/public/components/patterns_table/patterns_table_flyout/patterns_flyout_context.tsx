/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PatternsFlyoutRecord } from './patterns_table_flyout';
import { isValidFiniteNumber } from '../utils/utils';

interface PatternsFlyoutContextType {
  isFlyoutOpen: boolean;
  patternsFlyoutData: PatternsFlyoutRecord | undefined;
  openPatternsTableFlyout: (record?: PatternsFlyoutRecord) => void; // opening the flyout requires a valid 'record'
  closePatternsTableFlyout: () => void; // simply closes the flyout, can just be done
}

const PatternsFlyoutContext = createContext<PatternsFlyoutContextType | undefined>(undefined);

export const PatternsFlyoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFlyoutOpen, setIsFlyoutOpen] = useState<boolean>(false);
  const [patternsFlyoutData, setPatternsFlyoutData] = useState<PatternsFlyoutRecord | undefined>(
    undefined
  );

  const openPatternsTableFlyout = (record?: PatternsFlyoutRecord) => {
    // check the record to make sure that the flyout can be properly opening with the right data
    if (
      typeof record?.count !== 'number' ||
      !isValidFiniteNumber(record.count) ||
      typeof record?.pattern !== 'string' ||
      typeof record?.sample?.[0] !== 'string'
    ) {
      setPatternsFlyoutData(undefined);
    } else {
      setPatternsFlyoutData(record); // update the patterns flyout data with row record
    }

    // finally, open the flyout
    setIsFlyoutOpen(true);
  };

  const closePatternsTableFlyout = () => {
    setIsFlyoutOpen(false);
  };

  return (
    <PatternsFlyoutContext.Provider
      value={{
        isFlyoutOpen,
        patternsFlyoutData,
        openPatternsTableFlyout,
        closePatternsTableFlyout,
      }}
    >
      {children}
    </PatternsFlyoutContext.Provider>
  );
};

export const usePatternsFlyoutContext = (): PatternsFlyoutContextType => {
  const context = useContext(PatternsFlyoutContext);
  if (context === undefined) {
    throw new Error('usePatternsFlyoutContext must be used within a PatternsFlyoutProvider');
  }
  return context;
};
