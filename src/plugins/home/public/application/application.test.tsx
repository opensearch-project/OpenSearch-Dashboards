/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { render, waitFor } from '@testing-library/react';
import { coreMock, scopedHistoryMock } from '../../../../core/public/mocks';
import { renderImportSampleDataApp } from './application';

jest.mock('./components/home_app', () => ({
  HomeApp: () => 'HomeApp',
  ImportSampleDataApp: () => 'ImportSampleDataApp',
}));

const coreStartMocks = coreMock.createStart();

const ComponentForRender = (props: {
  renderFn: typeof renderImportSampleDataApp;
  historyMock?: ReturnType<typeof scopedHistoryMock.create>;
}) => {
  const container = useRef<HTMLDivElement>(null);
  const historyMock = props.historyMock || scopedHistoryMock.create();
  historyMock.listen.mockReturnValueOnce(() => () => null);
  useEffect(() => {
    if (container.current) {
      const destroyFn = props.renderFn(container.current, coreStartMocks, historyMock);
      return () => {
        destroyFn.then((res) => res());
      };
    }
  }, [historyMock, props]);

  return <div ref={container} />;
};

describe('renderImportSampleDataApp', () => {
  it('should render ImportSampleDataApp when calling renderImportSampleDataApp', async () => {
    const { container } = render(<ComponentForRender renderFn={renderImportSampleDataApp} />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          ImportSampleDataApp
        </div>
      </div>
    `);
  });
  it('should call unlisten history after destroy', async () => {
    const historyMock = scopedHistoryMock.create();
    const unlistenMock = jest.fn(() => null);
    historyMock.listen.mockImplementationOnce(() => unlistenMock);
    const { unmount } = render(
      <ComponentForRender renderFn={renderImportSampleDataApp} historyMock={historyMock} />
    );
    unmount();
    await waitFor(() => {
      expect(unlistenMock).toHaveBeenCalled();
    });
  });
});
