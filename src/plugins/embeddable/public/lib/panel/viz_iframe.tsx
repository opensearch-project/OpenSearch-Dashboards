/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export interface VizIframeProps {
  spec: string;
}

export const VizIframe = ({ spec }: VizIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the message is from our specific iframe
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }

      // For data URLs, origin will be 'null', so we need to check that
      // If using a different iframe source, you might need to check specific origins
      if (event.origin !== 'null' && event.origin !== window.location.origin) {
        return;
      }

      // Now we know the message is from our child iframe
      console.log('Message from child iframe:', event.data);

      // Handle different message types
      if (typeof event.data === 'object' && event.data.type) {
        switch (event.data.type) {
          case 'RENDER_SUCCESS':
            console.log('Vega chart rendered successfully');
            break;
          case 'RENDER_ERROR':
            console.error('Vega chart render error:', event.data.error);
            break;
          case 'CHART_READY':
            console.log('Chart is ready');
            break;
          default:
            console.log('Unknown message type:', event.data);
        }
      } else {
        // Handle legacy string messages
        console.log('Legacy message from iframe:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/vega@6"></script>
</head>
<body>
<div id="view"></div>
<script type="text/javascript">
  var view;

  const spec = ${JSON.stringify(spec)};

  spec.width = 400;
  spec.height = 200;
  spec.padding = 5;

  render(spec);

  function render(spec) {
    try {
      view = new vega.View(vega.parse(spec), {
        renderer:  'canvas',
        container: '#view',
        hover:     true
      });

      view.runAsync().then(() => {
        // Send structured message on successful render
        window.parent.postMessage({
          type: 'RENDER_SUCCESS',
          timestamp: Date.now()
        }, '*');
      }).catch((error) => {
        // Send error message
        window.parent.postMessage({
          type: 'RENDER_ERROR',
          error: error.message,
          timestamp: Date.now()
        }, '*');
      });

      return view;
    } catch (e) {
      // Send error message for immediate errors
      window.parent.postMessage({
        type: 'RENDER_ERROR',
        error: e.message,
        timestamp: Date.now()
      }, '*');
    }
  }

  // Send initial ready message
  window.parent.postMessage({
    type: 'CHART_READY',
    timestamp: Date.now(),
    data: spec
  }, '*');
</script>
</body>
</html>`;

  return (
    <>
      <iframe
        ref={iframeRef}
        title="visChart2"
        src={`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`}
        height={500}
        width={500}
      />
    </>
  );
};
