/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { setServices } from '../opensearch_dashboards_services';
import { getMockedServices } from '../opensearch_dashboards_services.mock';
// @ts-expect-error TS7016 TODO(ts-error): fixme
import { ImportSampleDataApp, HomeApp } from './home_app';

jest.mock('./legacy/home', () => ({
  Home: () => <div>Home</div>,
}));

jest.mock('../load_tutorials', () => ({
  getTutorial: () => {},
}));

jest.mock('./tutorial_directory', () => ({
  TutorialDirectory: (props: { withoutHomeBreadCrumb?: boolean }) => (
    <div
      data-test-subj="tutorial_directory"
      data-without-home-bread-crumb={!!props.withoutHomeBreadCrumb}
    />
  ),
}));

describe('<HomeApp />', () => {
  let currentService: ReturnType<typeof getMockedServices>;
  beforeEach(() => {
    currentService = getMockedServices();
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    setServices(currentService);
  });

  it('should not pass withoutHomeBreadCrumb to TutorialDirectory component', async () => {
    const originalHash = window.location.hash;
    const { findByTestId } = render(<HomeApp />);
    window.location.hash = '/tutorial_directory';
    const tutorialRenderResult = await findByTestId('tutorial_directory');
    expect(tutorialRenderResult.dataset.withoutHomeBreadCrumb).toEqual('false');

    // revert to original hash
    window.location.hash = originalHash;
  });
});

describe('<ImportSampleDataApp />', () => {
  let currentService: ReturnType<typeof getMockedServices>;
  beforeEach(() => {
    currentService = getMockedServices();
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    setServices(currentService);
  });

  it('should pass withoutHomeBreadCrumb to TutorialDirectory component', async () => {
    const { findByTestId } = render(<ImportSampleDataApp />);
    const tutorialRenderResult = await findByTestId('tutorial_directory');
    expect(tutorialRenderResult.dataset.withoutHomeBreadCrumb).toEqual('true');
  });
});
