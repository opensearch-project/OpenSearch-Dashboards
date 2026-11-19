/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GroupByRow } from './group_by_row';
import { GroupBy } from './types';
import { VisualBuilderContext, pplVisualBuilder } from './visual_builder_language';
import type { SourceTypeVisualBuilder } from '../../../../services/source_type_registry';

// Surface the tooltip text without hovering.
jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiToolTip: ({ content, children }: { content: string; children: React.ReactNode }) => (
    <span data-test-subj="tooltip" data-content={content}>
      {children}
    </span>
  ),
}));

const withSpan: GroupBy = {
  fields: [],
  span: { field: '@timestamp', interval: '1h', auto: false },
};

const spanTooltip = (language: SourceTypeVisualBuilder) => {
  render(
    <VisualBuilderContext.Provider value={language}>
      <GroupByRow
        groupBy={withSpan}
        options={['service']}
        timeFieldName="@timestamp"
        autoInterval="1h"
        onAddSpan={jest.fn()}
        dispatch={jest.fn()}
      />
    </VisualBuilderContext.Provider>
  );
  return screen
    .getAllByTestId('tooltip')
    .map((el) => el.getAttribute('data-content'))
    .find((text) => text?.includes('time field'));
};

describe('GroupByRow time bucket tooltip', () => {
  it("shows PPL's span() for PPL", () => {
    expect(spanTooltip(pplVisualBuilder)).toBe(
      'span(@timestamp, 1h) — uses the dataset’s time field'
    );
  });

  it("shows the language's own bucket syntax", () => {
    const language = { ...pplVisualBuilder, timeBucketText: () => 'bin(1h)' };
    expect(spanTooltip(language)).toBe('bin(1h) — uses the dataset’s time field');
  });

  it("describes the bucket in words for a language that doesn't write one", () => {
    const { timeBucketText: _omit, ...language } = pplVisualBuilder;
    expect(spanTooltip(language)).toBe('@timestamp in 1h buckets — uses the dataset’s time field');
  });
});
