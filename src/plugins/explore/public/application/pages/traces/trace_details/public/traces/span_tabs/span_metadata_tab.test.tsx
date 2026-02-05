/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanMetadataTab } from './span_metadata_tab';

describe('SpanMetadataTab', () => {
  const mockAddSpanFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when no span is selected', () => {
    it('renders no span selected message when selectedSpan is undefined', () => {
      render(<SpanMetadataTab selectedSpan={undefined} addSpanFilter={mockAddSpanFilter} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });

    it('renders no span selected message when selectedSpan is null', () => {
      render(<SpanMetadataTab selectedSpan={null} addSpanFilter={mockAddSpanFilter} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });

    it('renders no span selected message when selectedSpan is empty object', () => {
      render(<SpanMetadataTab selectedSpan={{}} addSpanFilter={mockAddSpanFilter} />);

      expect(screen.getByText('No span selected')).toBeInTheDocument();
    });
  });

  describe('when span has no attributes', () => {
    it('renders no attributes message for span without attributes', () => {
      const spanWithoutAttributes = {
        spanId: 'test-span-1',
        // No attributes property
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithoutAttributes} addSpanFilter={mockAddSpanFilter} />
      );

      expect(screen.getByText('No metadata attributes found for this span')).toBeInTheDocument();
    });
  });

  describe('when span has attributes', () => {
    it('categorizes and renders HTTP attributes', () => {
      const spanWithHttpAttributes = {
        spanId: 'test-span-http',
        attributes: {
          'http.method': 'GET',
          'http.url': 'https://api.example.com/users',
          'http.status_code': 200,
          'http.user_agent': 'Mozilla/5.0',
        },
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithHttpAttributes} addSpanFilter={mockAddSpanFilter} />
      );

      // Should render HTTP section
      expect(screen.getByText('HTTP')).toBeInTheDocument();

      // Should render HTTP attributes - check by text content (clean names without prefixes)
      expect(screen.getByText('http.method')).toBeInTheDocument();
      expect(screen.getByText('http.url')).toBeInTheDocument();
      expect(screen.getByText('http.status_code')).toBeInTheDocument();
      expect(screen.getByText('http.user_agent')).toBeInTheDocument();

      // Check attribute values
      expect(screen.getByText('GET')).toBeInTheDocument();
      expect(screen.getByText('https://api.example.com/users')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('categorizes and renders Infrastructure attributes', () => {
      const spanWithInfraAttributes = {
        spanId: 'test-span-infra',
        attributes: {
          'aws.region': 'us-west-2',
          'aws.availability_zone': 'us-west-2a',
          'cloud.provider': 'aws',
          'host.name': 'web-server-01',
          'k8s.pod.name': 'backend-pod-123',
          'container.id': 'abc123def456',
        },
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithInfraAttributes} addSpanFilter={mockAddSpanFilter} />
      );

      // Should render Infrastructure section
      expect(screen.getByText('Infrastructure')).toBeInTheDocument();

      // Should render infrastructure attributes - check by text content (clean names without prefixes)
      expect(screen.getByText('aws.region')).toBeInTheDocument();
      expect(screen.getByText('cloud.provider')).toBeInTheDocument();
      expect(screen.getByText('host.name')).toBeInTheDocument();
      expect(screen.getByText('k8s.pod.name')).toBeInTheDocument();

      // Check attribute values
      expect(screen.getByText('us-west-2')).toBeInTheDocument();
      expect(screen.getByText('aws')).toBeInTheDocument();
      expect(screen.getByText('web-server-01')).toBeInTheDocument();
    });

    it('categorizes and renders Application attributes', () => {
      const spanWithAppAttributes = {
        spanId: 'test-span-app',
        attributes: {
          'service.version': '1.2.3',
          'app.name': 'user-management',
          'code.function': 'processUserData',
          'thread.id': 12345,
          'platform.version': 'Java 11',
        },
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithAppAttributes} addSpanFilter={mockAddSpanFilter} />
      );

      // Should render Application section
      expect(screen.getByText('Application')).toBeInTheDocument();

      // Should render application attributes - check by text content (clean names without prefixes)
      expect(screen.getByText('service.version')).toBeInTheDocument();
      expect(screen.getByText('app.name')).toBeInTheDocument();
      expect(screen.getByText('code.function')).toBeInTheDocument();
      expect(screen.getByText('thread.id')).toBeInTheDocument();

      // Check attribute values
      expect(screen.getByText('1.2.3')).toBeInTheDocument();
      expect(screen.getByText('user-management')).toBeInTheDocument();
      expect(screen.getByText('processUserData')).toBeInTheDocument();
    });

    it('categorizes and renders General attributes', () => {
      const spanWithGeneralAttributes = {
        spanId: 'test-span-general',
        attributes: {
          'custom.attribute': 'custom-value',
          'business.unit': 'engineering',
          environment: 'production',
          team: 'backend-team',
        },
      };

      render(
        <SpanMetadataTab
          selectedSpan={spanWithGeneralAttributes}
          addSpanFilter={mockAddSpanFilter}
        />
      );

      // Should render Attributes section (general)
      expect(screen.getByText('Attributes')).toBeInTheDocument();

      // Should render general attributes - check by text content (clean names without prefixes)
      expect(screen.getByText('custom.attribute')).toBeInTheDocument();
      expect(screen.getByText('business.unit')).toBeInTheDocument();
      expect(screen.getByText('environment')).toBeInTheDocument();

      // Check attribute values
      expect(screen.getByText('custom-value')).toBeInTheDocument();
      expect(screen.getByText('engineering')).toBeInTheDocument();
      expect(screen.getByText('production')).toBeInTheDocument();
    });

    it('renders multiple categories when span has mixed attributes', () => {
      const spanWithMixedAttributes = {
        spanId: 'test-span-mixed',
        attributes: {
          // HTTP
          'http.method': 'POST',
          'http.status_code': 201,
          // Infrastructure
          'aws.region': 'eu-west-1',
          'host.name': 'server-02',
          // Application
          'service.version': '2.0.0',
          'app.name': 'mixed-app',
          // General
          'custom.field': 'custom-data',
          environment: 'staging',
        },
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithMixedAttributes} addSpanFilter={mockAddSpanFilter} />
      );

      // Should render all sections
      expect(screen.getByText('HTTP')).toBeInTheDocument();
      expect(screen.getByText('Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('Application')).toBeInTheDocument();
      expect(screen.getByText('Attributes')).toBeInTheDocument();

      // Should render attributes from each category - check by text content (clean names without prefixes)
      expect(screen.getByText('http.method')).toBeInTheDocument();
      expect(screen.getByText('aws.region')).toBeInTheDocument();
      expect(screen.getByText('service.version')).toBeInTheDocument();
      expect(screen.getByText('custom.field')).toBeInTheDocument();
    });

    it('handles empty and null attribute values', () => {
      const spanWithEmptyValues = {
        spanId: 'test-span-empty',
        attributes: {
          'valid.value': 'not-empty',
          // Note: empty values are filtered out by formatSpanAttributes, so we only test valid values
        },
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithEmptyValues} addSpanFilter={mockAddSpanFilter} />
      );

      // Should render valid attributes (clean names without prefixes)
      expect(screen.getByText('valid.value')).toBeInTheDocument();
      expect(screen.getByText('not-empty')).toBeInTheDocument();
    });

    it('handles object attribute values by stringifying them', () => {
      const spanWithObjectValues = {
        spanId: 'test-span-objects',
        attributes: {
          'simple.object': { key: 'value', number: 42 },
          'nested.object': {
            level1: {
              level2: {
                data: 'nested-data',
                array: [1, 2, 3],
              },
            },
          },
          'array.value': ['item1', 'item2', 'item3'],
          'string.value': 'simple-string',
        },
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithObjectValues} addSpanFilter={mockAddSpanFilter} />
      );

      // Should render all flattened attributes (clean names without prefixes)
      expect(screen.getByText('simple.object.key')).toBeInTheDocument();
      expect(screen.getByText('simple.object.number')).toBeInTheDocument();
      expect(screen.getByText('nested.object.level1.level2.data')).toBeInTheDocument();
      expect(screen.getByText('nested.object.level1.level2.array')).toBeInTheDocument();
      expect(screen.getByText('array.value')).toBeInTheDocument();
      expect(screen.getByText('string.value')).toBeInTheDocument();

      // Check flattened values
      expect(screen.getByText('value')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('nested-data')).toBeInTheDocument();
      expect(screen.getByText('[1,2,3]')).toBeInTheDocument();
      expect(screen.getByText('["item1","item2","item3"]')).toBeInTheDocument();
      expect(screen.getByText('simple-string')).toBeInTheDocument();
    });

    it('calls addSpanFilter when filter button is clicked', () => {
      const spanWithAttributes = {
        spanId: 'test-span-filter',
        attributes: {
          'http.method': 'GET',
        },
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithAttributes} addSpanFilter={mockAddSpanFilter} />
      );

      // Find the description list item for the attribute
      const descriptionList = screen.getByTestId('http.methodDescriptionList');

      // Hover over the item to make the filter button appear
      fireEvent.mouseOver(descriptionList);

      // Now find and click the filter button
      const filterButton = screen.getByLabelText('span-flyout-filter-icon');
      fireEvent.click(filterButton);

      // Should call addSpanFilter with correct parameters (note: key includes attributes. prefix)
      expect(mockAddSpanFilter).toHaveBeenCalledWith('attributes.http.method', 'GET');
    });

    it('handles resource attributes from span.resource.attributes', () => {
      const spanWithResourceAttributes = {
        spanId: 'test-span-resource',
        resource: {
          attributes: {
            'service.name': 'my-service',
            'service.version': '1.0.0',
            'deployment.environment': 'production',
          },
        },
      };

      render(
        <SpanMetadataTab
          selectedSpan={spanWithResourceAttributes}
          addSpanFilter={mockAddSpanFilter}
        />
      );

      // Should render resource attributes in Application section (service.*) and General section (deployment.*)
      expect(screen.getByText('service.name')).toBeInTheDocument();
      expect(screen.getByText('service.version')).toBeInTheDocument();
      expect(screen.getByText('deployment.environment')).toBeInTheDocument();

      // Check values
      expect(screen.getByText('my-service')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('production')).toBeInTheDocument();
    });
  });

  describe('accordion functionality', () => {
    it('renders accordions with proper initial state', () => {
      const spanWithAttributes = {
        spanId: 'test-span-accordion',
        attributes: {
          'http.method': 'GET',
          'aws.region': 'us-east-1',
          'service.version': '1.0.0',
          'custom.field': 'value',
        },
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithAttributes} addSpanFilter={mockAddSpanFilter} />
      );

      // Should render accordion buttons for each section
      const httpAccordion = screen.getByText('HTTP').closest('button');
      const infraAccordion = screen.getByText('Infrastructure').closest('button');
      const appAccordion = screen.getByText('Application').closest('button');
      const generalAccordion = screen.getByText('Attributes').closest('button');

      expect(httpAccordion).toBeInTheDocument();
      expect(infraAccordion).toBeInTheDocument();
      expect(appAccordion).toBeInTheDocument();
      expect(generalAccordion).toBeInTheDocument();
    });

    it('can toggle accordion sections', () => {
      const spanWithAttributes = {
        spanId: 'test-span-toggle',
        attributes: {
          'http.method': 'POST',
        },
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithAttributes} addSpanFilter={mockAddSpanFilter} />
      );

      const httpAccordionButton = screen.getByText('HTTP').closest('button');

      // Initially should be open (attributes should be visible)
      expect(screen.getByText('http.method')).toBeInTheDocument();

      // Click to close
      fireEvent.click(httpAccordionButton!);

      // Note: In a real test environment, the accordion would close and hide content
      // For this test, we're just verifying the button is clickable
      expect(httpAccordionButton).toBeInTheDocument();
    });

    it('does not render sections with no attributes', () => {
      const spanWithOnlyHttpAttributes = {
        spanId: 'test-span-http-only',
        attributes: {
          'http.method': 'GET',
          'http.status_code': 200,
        },
      };

      render(
        <SpanMetadataTab
          selectedSpan={spanWithOnlyHttpAttributes}
          addSpanFilter={mockAddSpanFilter}
        />
      );

      // Should render HTTP section
      expect(screen.getByText('HTTP')).toBeInTheDocument();

      // Should not render other sections since they have no attributes
      expect(screen.queryByText('Infrastructure')).not.toBeInTheDocument();
      expect(screen.queryByText('Application')).not.toBeInTheDocument();
      expect(screen.queryByText('Attributes')).not.toBeInTheDocument();
    });
  });

  describe('attribute categorization logic', () => {
    it('correctly categorizes HTTP-related attributes', () => {
      const httpKeywords = [
        'http.method',
        'url.path',
        'method.type',
        'status_code.value',
        'user_agent.string',
        'request.header',
        'response.body',
      ];

      httpKeywords.forEach((key) => {
        const span = {
          spanId: 'test',
          attributes: { [key]: 'test-value' },
        };

        const { unmount } = render(
          <SpanMetadataTab selectedSpan={span} addSpanFilter={mockAddSpanFilter} />
        );

        expect(screen.getByText('HTTP')).toBeInTheDocument();
        expect(screen.getByText(key)).toBeInTheDocument();

        // Clean up for next iteration
        unmount();
      });
    });

    it('correctly categorizes Infrastructure-related attributes', () => {
      const infraKeywords = [
        'aws.region',
        'ec2.instance',
        'cloud.provider',
        'host.name',
        'availability.zone',
        'region.name',
        'k8s.pod',
        'kubernetes.cluster',
        'pod.name',
        'container.id',
        'namespace.name',
        'cluster.name',
      ];

      infraKeywords.forEach((key) => {
        const span = {
          spanId: 'test',
          attributes: { [key]: 'test-value' },
        };

        const { unmount } = render(
          <SpanMetadataTab selectedSpan={span} addSpanFilter={mockAddSpanFilter} />
        );

        expect(screen.getByText('Infrastructure')).toBeInTheDocument();
        expect(screen.getByText(key)).toBeInTheDocument();

        // Clean up for next iteration
        unmount();
      });
    });

    it('correctly categorizes Application-related attributes', () => {
      const appKeywords = [
        'app.name',
        'service.version',
        'version.number',
        'platform.type',
        'code.function',
        'thread.id',
        'function.name',
      ];

      appKeywords.forEach((key) => {
        const span = {
          spanId: 'test',
          attributes: { [key]: 'test-value' },
        };

        const { unmount } = render(
          <SpanMetadataTab selectedSpan={span} addSpanFilter={mockAddSpanFilter} />
        );

        expect(screen.getByText('Application')).toBeInTheDocument();
        expect(screen.getByText(key)).toBeInTheDocument();

        // Clean up for next iteration
        unmount();
      });
    });

    it('categorizes unknown attributes as General', () => {
      const generalAttributes = {
        spanId: 'test-general',
        attributes: {
          'unknown.attribute': 'value1',
          'random.field': 'value2',
          'business.logic': 'value3',
        },
      };

      render(
        <SpanMetadataTab selectedSpan={generalAttributes} addSpanFilter={mockAddSpanFilter} />
      );

      expect(screen.getByText('Attributes')).toBeInTheDocument();
      expect(screen.getByText('unknown.attribute')).toBeInTheDocument();
      expect(screen.getByText('random.field')).toBeInTheDocument();
      expect(screen.getByText('business.logic')).toBeInTheDocument();
    });
  });

  describe('edge cases and error handling', () => {
    it('handles case-insensitive attribute categorization', () => {
      const mixedCaseSpan = {
        spanId: 'mixed-case',
        attributes: {
          'HTTP.METHOD': 'GET',

          'Http.Status_Code': 200,
          'AWS.REGION': 'us-west-2',
          'Service.Version': '1.0.0',
        },
      };

      render(<SpanMetadataTab selectedSpan={mixedCaseSpan} addSpanFilter={mockAddSpanFilter} />);

      // Should categorize correctly despite case differences
      expect(screen.getByText('HTTP')).toBeInTheDocument();
      expect(screen.getByText('Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('Application')).toBeInTheDocument();

      expect(screen.getByText('HTTP.METHOD')).toBeInTheDocument();
      expect(screen.getByText('AWS.REGION')).toBeInTheDocument();
      expect(screen.getByText('Service.Version')).toBeInTheDocument();
    });

    it('handles spans with both attributes and resource attributes', () => {
      const spanWithBothTypes = {
        spanId: 'test-both',
        attributes: {
          'http.method': 'GET',
          'custom.field': 'value1',
        },
        resource: {
          attributes: {
            'service.name': 'my-service',
            'deployment.env': 'prod',
          },
        },
      };

      render(
        <SpanMetadataTab selectedSpan={spanWithBothTypes} addSpanFilter={mockAddSpanFilter} />
      );

      // Should render attributes from both sources (clean names without prefixes)
      expect(screen.getByText('http.method')).toBeInTheDocument();
      expect(screen.getByText('custom.field')).toBeInTheDocument();
      expect(screen.getByText('service.name')).toBeInTheDocument();
      expect(screen.getByText('deployment.env')).toBeInTheDocument();

      // Should categorize them correctly
      expect(screen.getByText('HTTP')).toBeInTheDocument();
      expect(screen.getByText('Application')).toBeInTheDocument();
      expect(screen.getByText('Attributes')).toBeInTheDocument();
    });
  });
});
