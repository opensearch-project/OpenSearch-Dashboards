/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import VectorUploadOptions from './vector_upload_options';
import { screen, render, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import * as serviceApiCalls from '../services';
import { act } from 'react-dom/test-utils';

describe('vector_upload_options', () => {
  const props = {
    vis: {
      http: {
        post: () => {
          Promise.resolve({});
        },
      },
      notifications: {
        toasts: {
          addDanger: (message: string) => jest.fn(),
          addSuccess: (message: string) => jest.fn(),
          addWarning: (message: string) => jest.fn(),
        },
      },
    },
  };

  const getIndexResponseWhenIndexIsNotPresent = {
    ok: false,
    resp: [],
  };

  const getIndexResponseWhenIndexIsPresent = {
    ok: true,
    resp: [
      {
        health: 'yellow',
        index: 'sample-map',
        status: 'open',
      },
    ],
  };

  const failedPostGeojsonResponse = {
    ok: false,
    resp: {},
  };

  const partialFailuresPostGeojsonResponse = {
    ok: true,
    resp: {
      took: 1969,
      errors: true,
      total: 3220,
      success: 3219,
      failure: 1,
      failures: [],
    },
  };

  const noDocumentsIndexedPostGeojsonResponse = {
    ok: true,
    resp: {
      took: 1969,
      errors: true,
      total: 3220,
      success: 0,
      failure: 3220,
      failures: [],
    },
  };

  const successfulPostGeojsonResponse = {
    ok: true,
    resp: {
      took: 1969,
      errors: true,
      total: 3220,
      success: 3220,
      failure: 0,
      failures: [],
    },
  };

  const vectorUploadOptionsWithIndexNameUtil = (userEnteredIndexName: string, message: string) => {
    render(<VectorUploadOptions {...props} />);
    const indexName = screen.getByTestId('customIndex');
    fireEvent.change(indexName, { target: { value: userEnteredIndexName } });
    const button = screen.getByRole('button', { name: 'import-file-button' });
    fireEvent.click(button);
    expect(screen.getByText(message)).toBeInTheDocument();
  };

  const vectorUploadOptionsWithIndexNameRendererUtil = async (
    userEnteredIndexName: string,
    message: string
  ) => {
    const tree = render(<VectorUploadOptions {...props} />);
    const indexName = screen.getByTestId('customIndex');
    fireEvent.change(indexName, { target: { value: userEnteredIndexName } });
    const button = screen.getByRole('button', { name: 'import-file-button' });
    fireEvent.click(button);
    await expect(tree.findAllByText(message)).toBeTruthy();
  };

  const addUserInputToDOM = async () => {
    const { getByTestId } = render(<VectorUploadOptions {...props} />);
    const indexName = screen.getByTestId('customIndex');
    fireEvent.change(indexName, { target: { value: 'sample' } });
    const uploader = getByTestId('filePicker');
    const jsonData = {
      type: 'FeatureCollection',
      name: 'india_china',
      features: [
        {
          type: 'Feature',
          properties: { name: 'sample' },
          geometry: { type: 'Polygon', coordinates: [] },
        },
      ],
    };
    const str = JSON.stringify([jsonData]);
    const blob = new Blob([str]);
    const file = new File([blob], 'sample.json', { type: 'application/JSON' });
    File.prototype.text = jest.fn().mockResolvedValueOnce(JSON.stringify([jsonData]));
    await fireEvent.change(uploader, {
      target: { files: [file] },
    });
    await expect(uploader.files[0].name).toBe('sample.json');
    const selectOption = screen.getByRole('option', { name: 'Geo shape' });
    await fireEvent.change(selectOption, {
      target: { value: 'geo_shape' },
    });
    await expect(selectOption.value).toBe('geo_shape');
  };

  it('renders the VectorUploadOptions based on props provided', () => {
    const vectorUploadOptions = render(<VectorUploadOptions {...props} />);
    expect(vectorUploadOptions).toMatchSnapshot();
  });

  it('renders the VectorUploadOptions component with error message when index name is invalid', () => {
    vectorUploadOptionsWithIndexNameUtil(
      '+abc',
      "Map name can't start with + , _ , - or . It should start with a-z."
    );
  });

  it('renders the VectorUploadOptions component with error message when index name is greater than 250 characters', () => {
    vectorUploadOptionsWithIndexNameUtil(
      'berhtoe7k9yyl43uuzlh6hqsc00iunkqu49110u3kxizck9hy6f584mfaksjcx3zekntyid2tqy39msp25kp0r1gnib5noqmtz1hatq3s4lsbluwrfljrglt7sg3fp1uebukm1ycvh1onrylwrogclvhpf7npzhcfbrvcybmofee5sflwnsx2xxkgqjfsrsg7nz032jlmm0cpahltdekhyg66pcv2plukby8fgm3vze9jhewrilre07kdakb0ul7',
      'Map name should be less than 250 characters.'
    );
  });

  it('renders the VectorUploadOptions component with error message when index name has upper case letters', async () => {
    vectorUploadOptionsWithIndexNameRendererUtil('Abc', 'Upper case letters are not allowed.');
  });

  it('renders the VectorUploadOptions component with error message when index name has special characters', async () => {
    vectorUploadOptionsWithIndexNameRendererUtil('a#bc', 'Special characters are not allowed.');
  });

  it('renders the VectorUploadOptions component with error message when index name has -map as suffix', async () => {
    vectorUploadOptionsWithIndexNameRendererUtil('sample-map', "Map name can't end with -map.");
  });

  it('renders the VectorUploadOptions component when we have successfully indexed all the data', async () => {
    addUserInputToDOM();
    const button = screen.getByRole('button', { name: 'import-file-button' });
    jest.spyOn(serviceApiCalls, 'getIndex').mockImplementation(() => {
      return Promise.resolve(getIndexResponseWhenIndexIsNotPresent);
    });
    jest.spyOn(serviceApiCalls, 'postGeojson').mockImplementation(() => {
      return Promise.resolve(successfulPostGeojsonResponse);
    });
    await waitFor(() => {
      fireEvent.click(button);
    });
  });

  it('renders the VectorUploadOptions component when we have partial failures during indexing', async () => {
    addUserInputToDOM();
    const button = screen.getByRole('button', { name: 'import-file-button' });
    jest.spyOn(serviceApiCalls, 'getIndex').mockImplementation(() => {
      return Promise.resolve(getIndexResponseWhenIndexIsNotPresent);
    });
    jest.spyOn(serviceApiCalls, 'postGeojson').mockImplementation(() => {
      return Promise.resolve(partialFailuresPostGeojsonResponse);
    });
    await waitFor(() => {
      fireEvent.click(button);
    });
  });

  it('renders the VectorUploadOptions component when all the documents fail to index', async () => {
    addUserInputToDOM();
    const button = screen.getByRole('button', { name: 'import-file-button' });
    jest.spyOn(serviceApiCalls, 'getIndex').mockImplementation(() => {
      return Promise.resolve(getIndexResponseWhenIndexIsNotPresent);
    });
    jest.spyOn(serviceApiCalls, 'postGeojson').mockImplementation(() => {
      return Promise.resolve(noDocumentsIndexedPostGeojsonResponse);
    });
    await waitFor(() => {
      fireEvent.click(button);
    });
  });

  it('renders the VectorUploadOptions component when postGeojson call fails', async () => {
    addUserInputToDOM();
    const button = screen.getByRole('button', { name: 'import-file-button' });
    jest.spyOn(serviceApiCalls, 'getIndex').mockImplementation(() => {
      return Promise.resolve(getIndexResponseWhenIndexIsNotPresent);
    });
    jest.spyOn(serviceApiCalls, 'postGeojson').mockImplementation(() => {
      return Promise.resolve(failedPostGeojsonResponse);
    });
    await waitFor(() => {
      fireEvent.click(button);
    });
  });

  it('renders the VectorUploadOptions component when getIndex returns a duplicate index', async () => {
    addUserInputToDOM();
    const button = screen.getByRole('button', { name: 'import-file-button' });
    jest.spyOn(serviceApiCalls, 'getIndex').mockImplementation(() => {
      return Promise.resolve(getIndexResponseWhenIndexIsPresent);
    });
    await waitFor(() => {
      fireEvent.click(button);
    });
  });

  it('renders the VectorUploadOptions component when uploaded file size is zero', async () => {
    const { getByTestId } = render(<VectorUploadOptions {...props} />);
    const indexName = screen.getByTestId('customIndex');
    fireEvent.change(indexName, { target: { value: 'sample' } });
    const uploader = getByTestId('filePicker');
    const jsonData = {};
    const str = JSON.stringify([]);
    const blob = new Blob([str]);
    const file = new File([], 'sample.json', { type: 'application/JSON' });
    File.prototype.text = jest.fn().mockResolvedValueOnce(JSON.stringify([]));
    await fireEvent.change(uploader, {
      target: { files: [file] },
    });
    await expect(uploader.files[0].name).toBe('sample.json');
    const selectOption = screen.getByRole('option', { name: 'Geo shape' });
    await fireEvent.change(selectOption, {
      target: { value: 'geo_shape' },
    });
    await expect(selectOption.value).toBe('geo_shape');
    const button = screen.getByRole('button', { name: 'import-file-button' });
    jest.spyOn(serviceApiCalls, 'getIndex').mockImplementation(() => {
      return Promise.resolve(getIndexResponseWhenIndexIsNotPresent);
    });
    jest.spyOn(serviceApiCalls, 'postGeojson').mockImplementation(() => {
      return Promise.resolve(successfulPostGeojsonResponse);
    });
    await waitFor(() => {
      fireEvent.click(button);
    });
  });

  it('renders the VectorUploadOptions component when uploaded file size is >25 MB', async () => {
    const { getByTestId } = render(<VectorUploadOptions {...props} />);
    const indexName = screen.getByTestId('customIndex');
    fireEvent.change(indexName, { target: { value: 'sample' } });
    const uploader = getByTestId('filePicker');
    const jsonData = {
      type: 'FeatureCollection',
      name: 'india_china',
      features: [
        {
          type: 'Feature',
          properties: { name: 'sample' },
          geometry: { type: 'Polygon', coordinates: [] },
        },
      ],
    };
    const jsonDataArray = [];
    const max = 500000;
    for (; jsonDataArray.push(jsonData) < max; );
    const str = JSON.stringify(jsonDataArray);
    const blob = new Blob([str]);
    const file = new File([blob], 'sample.json', { type: 'application/JSON' });
    File.prototype.text = jest.fn().mockResolvedValueOnce(JSON.stringify(jsonDataArray));
    await fireEvent.change(uploader, {
      target: { files: [file] },
    });
    await expect(uploader.files[0].name).toBe('sample.json');
  });
});
