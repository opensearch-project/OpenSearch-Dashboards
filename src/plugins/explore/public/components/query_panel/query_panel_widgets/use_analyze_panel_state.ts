/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { getPPLAnalyzeResult$, getPPLAnalyzeLoading$ } from '../../../../../data/public';

export const useAnalyzePanelState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const resultSub = getPPLAnalyzeResult$().subscribe((result) => {
      if (result) {
        setHasResult(true);
      } else {
        setHasResult(false);
        setIsOpen(false);
      }
    });
    const loadingSub = getPPLAnalyzeLoading$().subscribe(setIsLoading);
    return () => {
      resultSub.unsubscribe();
      loadingSub.unsubscribe();
    };
  }, []);

  return { isOpen, setIsOpen, hasResult, isLoading };
};
