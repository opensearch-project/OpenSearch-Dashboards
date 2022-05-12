/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import VectorUploadOptions from './vector_upload_options';
import { screen, render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';

describe('vector_upload_options', () => {
  const props = {
    vis: {
      http: '',
      notifications: '',
    },
  };

  it('renders the VectorUploadOptions based on props provided', () => {
    const vectorUploadOptions = render(<VectorUploadOptions {...props} />);
    expect(vectorUploadOptions).toMatchSnapshot();
  });

  it('renders the VectorUploadOptions component with error message when index name is invalid', () => {
    render(<VectorUploadOptions {...props} />);
    const indexName = screen.getByTestId('customIndex');
    fireEvent.change(indexName, { target: { value: '+abc' } });
    const button = screen.getByRole('button', { name: 'import-file-button' });
    fireEvent.click(button);
    expect(
      screen.getByText("Map name can't start with + , _ , - or . It should start with a-z.")
    ).toBeInTheDocument();
  });

  it('renders the VectorUploadOptions component with error message when index name is greater than 250 characters', () => {
    render(<VectorUploadOptions {...props} />);
    const indexName = screen.getByTestId('customIndex');
    fireEvent.change(indexName, {
      target: {
        value:
          'berhtoe7k9yyl43uuzlh6hqsc00iunkqu49110u3kxizck9hy6f584mfaksjcx3zekntyid2tqy39msp25kp0r1gnib5noqmtz1hatq3s4lsbluwrfljrglt7sg3fp1uebukm1ycvh1onrylwrogclvhpf7npzhcfbrvcybmofee5sflwnsx2xxkgqjfsrsg7nz032jlmm0cpahltdekhyg66pcv2plukby8fgm3vze9jhewrilre07kdakb0ul7',
      },
    });
    const button = screen.getByRole('button', { name: 'import-file-button' });
    fireEvent.click(button);
    expect(screen.getByText('Map name should be less than 250 characters.')).toBeInTheDocument();
  });
});
