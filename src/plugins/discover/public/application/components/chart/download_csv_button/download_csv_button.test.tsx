/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { stubIndexPatternWithFields } from '../../../../../../data/common/index_patterns/index_pattern.stub';
import { DownloadCsvButton } from './download_csv_button';
import { discoverPluginMock } from '../../../../mocks';
import { setServices } from '../../../../opensearch_dashboards_services';
import { useSelector } from '../../../utils/state_management';

jest.mock('../../../utils/state_management', () => ({
  useSelector: jest.fn(),
}));

describe('Download CSV Button', () => {
  beforeAll(() => {
    setServices(discoverPluginMock.createDiscoverServicesMock());
  });

  it('Renders the text correctly for multiple rows', () => {
    (useSelector as jest.MockedFunction<any>).mockImplementationOnce(() => ['response']);
    render(<DownloadCsvButton indexPattern={stubIndexPatternWithFields} rows={[{}, {}] as any} />);
    expect(screen.getByText('Download 2 documents as CSV')).toBeInTheDocument();
  });

  it('Renders the text correctly for single row', () => {
    (useSelector as jest.MockedFunction<any>).mockImplementationOnce(() => ['response']);
    render(<DownloadCsvButton indexPattern={stubIndexPatternWithFields} rows={[{}] as any} />);
    expect(screen.getByText('Download 1 document as CSV')).toBeInTheDocument();
  });
});
