#!/usr/bin/env node

/**
 * Manual Redux Bridge Test
 * 
 * This script tests the Redux Bridge by making direct HTTP requests
 * to the OpenSearch Dashboards server, bypassing the SSH connection issues.
 */

const http = require('http');

console.log('🧪 Manual Redux Bridge Test Starting...');
console.log('🎯 This will test if the Redux Bridge Client can intercept HTTP requests');

// Test function to make HTTP request to Redux bridge
async function testReduxBridge() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: 'source = opensearch_dashboards_sample_data_logs | head 10',
      language: 'PPL'
    });

    const options = {
      hostname: 'localhost',
      port: 5601,
      path: '/api/osd-mcp-server/redux/update-query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'osd-xsrf': 'true'
      }
    };

    console.log('🔧 Making HTTP request to:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('📤 Request payload:', postData);

    const req = http.request(options, (res) => {
      let data = '';
      
      console.log('📡 Response status:', res.statusCode);
      console.log('📡 Response headers:', res.headers);

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Response received:', JSON.stringify(response, null, 2));
          
          if (response.action === 'execute_direct_redux') {
            console.log('🎯 SUCCESS: Server returned "execute_direct_redux" instructions!');
            console.log('🎯 Direct execution details:', response.directExecution);
            console.log('');
            console.log('🔍 Next step: Check browser console for Redux Bridge Client logs:');
            console.log('   - Open OpenSearch Dashboards in browser');
            console.log('   - Go to Explore interface');
            console.log('   - Open browser console');
            console.log('   - Look for: "🎯 MCP Redux Request Intercepted"');
            console.log('   - Look for: "🎯 Executing Direct Redux Instructions"');
          } else {
            console.log('⚠️ Server did not return "execute_direct_redux" action');
          }
          
          resolve(response);
        } catch (error) {
          console.log('📄 Raw response:', data);
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ HTTP request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test sequence
async function runTests() {
  try {
    console.log('');
    console.log('='.repeat(60));
    console.log('🧪 TEST 1: Direct HTTP Request to Redux Bridge');
    console.log('='.repeat(60));
    
    const response = await testReduxBridge();
    
    console.log('');
    console.log('='.repeat(60));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    if (response.action === 'execute_direct_redux') {
      console.log('✅ Redux Bridge Server Routes: WORKING');
      console.log('✅ "execute_direct_redux" Response: RECEIVED');
      console.log('🔍 Next: Check if browser Redux Bridge Client intercepts this');
      console.log('');
      console.log('📝 To test browser interception:');
      console.log('   1. Open OpenSearch Dashboards: http://localhost:5601');
      console.log('   2. Go to Explore interface');
      console.log('   3. Open browser console (F12)');
      console.log('   4. Run this command in browser console:');
      console.log('');
      console.log('   fetch("/api/osd-mcp-server/redux/update-query", {');
      console.log('     method: "POST",');
      console.log('     headers: {');
      console.log('       "Content-Type": "application/json",');
      console.log('       "osd-xsrf": "true"');
      console.log('     },');
      console.log('     body: JSON.stringify({');
      console.log('       query: "source = test_browser_request | head 5",');
      console.log('       language: "PPL"');
      console.log('     })');
      console.log('   });');
      console.log('');
      console.log('   5. Look for these logs in browser console:');
      console.log('      - "🎯 MCP Redux Request Intercepted"');
      console.log('      - "🎯 Executing Direct Redux Instructions (Option D)"');
      console.log('      - "🔄 Browser Redux Monitor - Query state changed"');
      console.log('');
      console.log('   6. Check if query editor text updates automatically');
    } else {
      console.log('❌ Redux Bridge Server Routes: NOT WORKING');
      console.log('❌ Expected "execute_direct_redux", got:', response.action || 'unknown');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Make sure OpenSearch Dashboards is running: yarn start');
    console.log('   2. Make sure OSD MCP Server plugin is enabled');
    console.log('   3. Check OSD server logs for errors');
  }
}

// Run the tests
runTests();