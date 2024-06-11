/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { render } from '@testing-library/react';
import { coreMock } from '../../../../core/public/mocks';
import { renderImportSampleDataApp } from './application';

jest.mock('./components/home_app', () => ({
  HomeApp: () => 'HomeApp',
  ImportSampleDataApp: () => 'ImportSampleDataApp',
}));

const coreStartMocks = coreMock.createStart();

const ComponentForRender = (props: { renderFn: typeof renderImportSampleDataApp }) => {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (container.current) {
      const destroyFn = props.renderFn(container.current, coreStartMocks);
      return () => {
        destroyFn.then((res) => res());
      };
    }
  }, [props]);

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
});
