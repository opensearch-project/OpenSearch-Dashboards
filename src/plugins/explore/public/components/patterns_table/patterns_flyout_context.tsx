/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PatternsFlyoutRecord } from './patterns_table_flyout/patterns_table_flyout';

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
    // TODO: behavior for checking a record
    // TODO: behavior on what to do when dealing with bad record

    // finally, update the patterns flyout data with the record and open the flyout
    setPatternsFlyoutData(record);
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

export const usePatternsFlyout = (): PatternsFlyoutContextType => {
  const context = useContext(PatternsFlyoutContext);
  if (context === undefined) {
    throw new Error('usePatternsFlyout must be used within a PatternsFlyoutProvider');
  }
  return context;
};
