/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLoadingChart,
  EuiPanel,
  EuiPopover,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import useObservable from 'react-use/lib/useObservable';
import { ChromeStart } from 'opensearch-dashboards/public';
import { TracePPLService } from '../../server/ppl_request_trace';
import { SpanDetailTable, SpanDetailTableHierarchy } from './span_detail_table';
import { PanelTitle } from '../utils/helper_functions';
import { GanttChart } from '../gantt_chart_vega/gantt_chart_vega';

// Service Legend component to display in the header
interface ServiceLegendProps {
  colorMap: Record<string, string>;
  data: Span[];
}

const ServiceLegend: React.FC<ServiceLegendProps> = ({ colorMap, data }) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Extract services in the order they appear in the data
  const servicesInOrder = useMemo(() => {
    const serviceSet = new Set<string>();
    // Add services in the order they appear in the data
    data.forEach((span: Span) => {
      const serviceName = span.serviceName;
      if (serviceName && colorMap[serviceName]) {
        serviceSet.add(serviceName);
      }
    });
    return Array.from(serviceSet);
  }, [data, colorMap]);

  if (servicesInOrder.length === 0) {
    return null;
  }

  const togglePopover = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const legendButton = (
    <EuiButtonEmpty
      size="s"
      onClick={togglePopover}
      iconType="inspect"
      data-test-subj="service-legend-toggle"
      isSelected={isPopoverOpen}
    >
      {i18n.translate('explore.spanDetailPanel.button.serviceLegend', {
        defaultMessage: 'Service legend',
      })}
    </EuiButtonEmpty>
  );

  const legendContent = (
    <div style={{ width: '200px' }}>
      <EuiFlexGroup direction="column" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiText size="xs">
            <strong>
              {i18n.translate('explore.spanDetailPanel.title.serviceLegend', {
                defaultMessage: 'Service legend',
              })}
            </strong>
          </EuiText>
        </EuiFlexItem>

        {servicesInOrder.map((service) => (
          <EuiFlexItem grow={false} key={`service-legend-${service}`}>
            <EuiFlexGroup gutterSize="xs" alignItems="center">
              <EuiFlexItem grow={false}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: colorMap[service],
                    borderRadius: '2px',
                    border: '1px solid #fff',
                  }}
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="xs">
                  <span>{service}</span>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </div>
  );

  return (
    <EuiPopover
      button={legendButton}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="s"
      anchorPosition="downRight"
    >
      {legendContent}
    </EuiPopover>
  );
};

export interface Span {
  traceId: string;
  spanId: string;
  traceState: string;
  parentSpanId: string;
  name: string;
  kind: string;
  startTime: string;
  endTime: string;
  durationInNanos: number;
  serviceName: string;
  events: any[];
  links: any[];
  droppedAttributesCount: number;
  droppedEventsCount: number;
  droppedLinksCount: number;
  traceGroup: string;
  traceGroupFields: {
    endTime: string;
    durationInNanos: number;
    statusCode: number;
  };
  status: {
    code: number;
  };
  instrumentationLibrary: {
    name: string;
    version: string;
  };
}

export interface TraceFilter {
  field: string;
  value: any;
}

export function SpanDetailPanel(props: {
  chrome: ChromeStart;
  spanFilters: TraceFilter[];
  setSpanFiltersWithStorage: (newFilters: TraceFilter[]) => void;
  payloadData: string;
  isGanttChartLoading?: boolean;
  dataSourceMDSId: string;
  dataSourceMDSLabel: string | undefined;
  traceId?: string;
  pplService?: TracePPLService;
  indexPattern?: string;
  colorMap?: Record<string, string>;
  onSpanSelect?: (spanId: string) => void;
  selectedSpanId?: string;
}) {
  const {
    chrome,
    spanFilters,
    setSpanFiltersWithStorage,
    payloadData,
    onSpanSelect,
    dataSourceMDSId,
    colorMap,
  } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState<number>(window.innerWidth);
  const isLocked = useObservable(chrome.getIsNavDrawerLocked$());

  const updateAvailableWidth = () => {
    if (containerRef.current) {
      setAvailableWidth(containerRef.current.getBoundingClientRect().width);
    } else {
      setAvailableWidth(window.innerWidth);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateAvailableWidth);
    updateAvailableWidth();

    return () => {
      window.removeEventListener('resize', updateAvailableWidth);
    };
  }, []);

  const addSpanFilter = useCallback(
    (field: string, value: any) => {
      const newFilters = [...spanFilters];
      const index = newFilters.findIndex(({ field: filterField }) => field === filterField);
      if (index === -1) {
        newFilters.push({ field, value });
      } else {
        newFilters.splice(index, 1, { field, value });
      }
      setSpanFiltersWithStorage(newFilters);
    },
    [spanFilters, setSpanFiltersWithStorage]
  );

  const removeSpanFilter = useCallback(
    (field: string) => {
      const newFilters = [...spanFilters];
      const index = newFilters.findIndex(({ field: filterField }) => field === filterField);
      if (index !== -1) {
        newFilters.splice(index, 1);
        setSpanFiltersWithStorage(newFilters);
      }
    },
    [spanFilters, setSpanFiltersWithStorage]
  );

  const renderFilters = useMemo(() => {
    return spanFilters.map(({ field, value }) => (
      <EuiFlexItem grow={false} key={`span-filter-badge-${field}`}>
        <EuiBadge
          iconType="cross"
          iconSide="right"
          iconOnClick={() => removeSpanFilter(field)}
          iconOnClickAriaLabel={i18n.translate(
            'explore.spanDetailPanel.ariaLabel.removeCurrentFilter',
            {
              defaultMessage: 'remove current filter',
            }
          )}
        >
          {`${field}: ${value}`}
        </EuiBadge>
      </EuiFlexItem>
    ));
  }, [spanFilters, removeSpanFilter]);

  const toggleOptions = [
    {
      id: 'timeline',
      label: i18n.translate('explore.spanDetailPanel.toggle.timeline', {
        defaultMessage: 'Timeline',
      }),
    },
    {
      id: 'span_list',
      label: i18n.translate('explore.spanDetailPanel.toggle.spanList', {
        defaultMessage: 'Span list',
      }),
    },
    {
      id: 'hierarchy_span_list',
      label: i18n.translate('explore.spanDetailPanel.toggle.treeView', {
        defaultMessage: 'Tree view',
      }),
    },
  ];
  const [toggleIdSelected, setToggleIdSelected] = useState(toggleOptions[0].id);

  const spanDetailTable = useMemo(
    () => (
      <div style={{ width: 'auto' }}>
        <SpanDetailTable
          hiddenColumns={['traceId', 'traceGroup']}
          openFlyout={(spanId: string) => {
            if (onSpanSelect) {
              onSpanSelect(spanId);
            }
          }}
          dataSourceMDSId={dataSourceMDSId}
          availableWidth={availableWidth - (isLocked ? 390 : 200)}
          payloadData={payloadData}
          filters={spanFilters}
        />
      </div>
    ),
    [onSpanSelect, payloadData, spanFilters, availableWidth, isLocked, dataSourceMDSId]
  );

  const spanDetailTableHierarchy = useMemo(
    () => (
      <div style={{ width: 'auto' }}>
        <SpanDetailTableHierarchy
          hiddenColumns={['traceId', 'traceGroup']}
          openFlyout={(spanId: string) => {
            if (onSpanSelect) {
              onSpanSelect(spanId);
            }
          }}
          dataSourceMDSId={dataSourceMDSId}
          availableWidth={availableWidth - (isLocked ? 390 : 200)}
          payloadData={payloadData}
          filters={spanFilters}
        />
      </div>
    ),
    [onSpanSelect, payloadData, spanFilters, availableWidth, isLocked, dataSourceMDSId]
  );

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(payloadData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing payload data:', error);
      return [];
    }
  }, [payloadData]);

  const errorCount = useMemo(() => {
    return parsedData.filter((span: Span) => span.status?.code === 2).length;
  }, [parsedData]);

  const handleErrorFilterClick = useCallback(() => {
    addSpanFilter('status.code', 2);
  }, [addSpanFilter]);

  // Calculate dynamic height based on number of spans
  const calculateGanttHeight = (spanCount: number): number => {
    const rowHeight = 35;
    const baseHeight = 100;

    if (spanCount === 0) {
      return 150;
    }

    if (spanCount === 1) {
      return 120;
    }

    if (spanCount <= 3) {
      return Math.max(150, spanCount * rowHeight + baseHeight);
    }

    const calculatedHeight = spanCount * rowHeight + baseHeight;
    const minHeight = 200;
    const maxHeight = 600;

    return Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
  };

  const ganttChart = useMemo(
    () => (
      <div style={{ width: '100%' }}>
        <GanttChart
          data={parsedData}
          colorMap={colorMap || {}}
          height={calculateGanttHeight(parsedData.length)}
          onSpanClick={(spanId) => {
            if (onSpanSelect) {
              onSpanSelect(spanId);
            }
          }}
          selectedSpanId={props.selectedSpanId}
        />
      </div>
    ),
    [parsedData, colorMap, onSpanSelect, props.selectedSpanId]
  );

  return (
    <>
      <EuiPanel data-test-subj="span-gantt-chart-panel">
        <EuiFlexGroup direction="column" gutterSize="m">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize="xs" alignItems="center">
                  <EuiFlexItem grow={false}>
                    <PanelTitle
                      title={i18n.translate('explore.spanDetailPanel.title.spans', {
                        defaultMessage: 'Spans',
                      })}
                      totalItems={parsedData.length}
                    />
                  </EuiFlexItem>
                  {errorCount > 0 &&
                    !spanFilters.some(
                      (filter) => filter.field === 'status.code' && filter.value === 2
                    ) && (
                      <EuiFlexItem grow={false}>
                        <EuiToolTip
                          content={i18n.translate(
                            'explore.spanDetailPanel.tooltip.clickToApplyFilter',
                            {
                              defaultMessage: 'Click to apply filter',
                            }
                          )}
                        >
                          <EuiButton
                            onClick={handleErrorFilterClick}
                            data-test-subj="error-count-button"
                            size="s"
                            color="secondary"
                          >
                            {i18n.translate('explore.spanDetailPanel.button.filterErrors', {
                              defaultMessage: 'Filter errors ({errorCount})',
                              values: { errorCount },
                            })}
                          </EuiButton>
                        </EuiToolTip>
                      </EuiFlexItem>
                    )}
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem />
              <EuiFlexItem grow={false}>
                <EuiFlexGroup justifyContent="flexEnd" alignItems="center" gutterSize="s">
                  <EuiFlexItem grow={false}>
                    <ServiceLegend colorMap={props.colorMap || {}} data={parsedData} />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonGroup
                      isDisabled={props.isGanttChartLoading}
                      legend={i18n.translate('explore.spanDetailPanel.legend.selectViewOfSpans', {
                        defaultMessage: 'Select view of spans',
                      })}
                      options={toggleOptions}
                      idSelected={toggleIdSelected}
                      onChange={(id) => setToggleIdSelected(id)}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          {props.isGanttChartLoading ? (
            <div className="center-loading-div">
              <EuiLoadingChart size="l" />
            </div>
          ) : (
            <>
              {props.spanFilters.length > 0 && (
                <EuiFlexItem grow={false}>
                  <EuiSpacer size="s" />
                  <EuiFlexGroup gutterSize="s" wrap>
                    {renderFilters}
                  </EuiFlexGroup>
                </EuiFlexItem>
              )}

              <EuiHorizontalRule margin="m" />

              <EuiFlexItem style={{ overflowY: 'auto', maxHeight: 800, minHeight: 150 }}>
                {toggleIdSelected === 'timeline'
                  ? ganttChart
                  : toggleIdSelected === 'span_list'
                  ? spanDetailTable
                  : spanDetailTableHierarchy}
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
      </EuiPanel>
    </>
  );
}
