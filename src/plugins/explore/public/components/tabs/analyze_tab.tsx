/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EuiText } from '@elastic/eui';
import { getPPLAnalyzeResult$, PPLAnalyzeResult, PPLAnalyzePanel } from '../../../../data/public';

export const AnalyzeTab = () => {
  const [analyzeResult, setAnalyzeResult] = useState<PPLAnalyzeResult | null>(null);

  useEffect(() => {
    const sub = getPPLAnalyzeResult$().subscribe((result) => {
      setAnalyzeResult(result);
    });
    return () => sub.unsubscribe();
  }, []);

  if (!analyzeResult) {
    return (
      <div style={{ padding: 16 }}>
        <EuiText size="s" color="subdued">
          Run a PPL query to see analysis results here.
        </EuiText>
      </div>
    );
  }

  return (
    <div className="explore-analyze-tab tab-container">
      <PPLAnalyzePanel analyzeResult={analyzeResult} />
    </div>
  );
};
