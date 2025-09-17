#!/usr/bin/env node

/**
 * Option 1 (Polling) Complete Test
 * 
 * This script tests the complete Option 1 implementation:
 * 1. MCP Server adds command to pending queue
 * 2. Browser polls for pending commands
 * 3. Browser executes Redux actions directly
 */

const http = require('http');

console.log('🧪 Option 1 (Polling) Complete Test Starting...');
console.log('🎯 This will test the complete MCP → Polling → Redux flow');

// Test function to simulate MCP server request
async function simulateMCPRequest() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: 'source = test_polling_mechanism | head 7',
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

    console.log('🔧 Step 1: Simulating MCP server request...');
    console.log('📤 Request:', `POST ${options.path}`);
    console.log('📤 Payload:', postData);

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Step 1 Complete: MCP request processed');
          console.log('📥 Response:', JSON.stringify(response, null, 2));
          
          if (response.action === 'execute_direct_redux') {
            console.log('🎯 SUCCESS: Command should be added to pending queue');
          }
          
          resolve(response);
        } catch (error) {
          console.log('📄 Raw response:', data);
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ MCP request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test function to check pending commands
async function checkPendingCommands() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5601,
      path: '/api/osd-mcp-server/pending-commands',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'osd-xsrf': 'true'
      }
    };

    console.log('🔧 Step 2: Checking pending commands (simulating browser poll)...');
    console.log('📤 Request:', `GET ${options.path}`);

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const commands = JSON.parse(data);
          console.log('✅ Step 2 Complete: Pending commands retrieved');
          console.log('📥 Pending commands:', JSON.stringify(commands, null, 2));
          
          if (Array.isArray(commands) && commands.length > 0) {
            console.log(`🎯 SUCCESS: Found ${commands.length} pending command(s)`);
            commands.forEach((cmd, index) => {
              console.log(`   Command ${index + 1}: ${cmd.type} - ${cmd.payload?.query}`);
            });
          } else {
            console.log('⚠️ No pending commands found');
          }
          
          resolve(commands);
        } catch (error) {
          console.log('📄 Raw response:', data);
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Pending commands request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Test sequence
async function runCompleteTest() {
  try {
    console.log('');
    console.log('='.repeat(80));
    console.log('🧪 OPTION 1 (POLLING) COMPLETE TEST');
    console.log('='.repeat(80));
    
    // Step 1: Simulate MCP server request
    console.log('\n📋 STEP 1: Simulate MCP Server Request');
    console.log('-'.repeat(50));
    const mcpResponse = await simulateMCPRequest();
    
    // Wait a moment for server processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 2: Check pending commands
    console.log('\n📋 STEP 2: Check Pending Commands (Browser Poll)');
    console.log('-'.repeat(50));
    const pendingCommands = await checkPendingCommands();
    
    // Results summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    const step1Success = mcpResponse.action === 'execute_direct_redux';
    const step2Success = Array.isArray(pendingCommands) && pendingCommands.length > 0;
    
    console.log(`✅ Step 1 - MCP Request Processing: ${step1Success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Step 2 - Pending Commands Queue: ${step2Success ? 'PASS' : 'FAIL'}`);
    
    if (step1Success && step2Success) {
      console.log('\n🎉 OPTION 1 (POLLING) INFRASTRUCTURE: WORKING!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Open OpenSearch Dashboards: http://localhost:5601');
      console.log('   2. Go to Explore interface');
      console.log('   3. Open browser console (F12)');
      console.log('   4. Look for these logs:');
      console.log('      - "🔄 MCP Command Polling: Starting"');
      console.log('      - "📨 MCP Polling: Found pending commands"');
      console.log('      - "🎯 MCP Polling: Executing direct Redux command"');
      console.log('      - "🔄 Browser Redux Monitor - Query state changed"');
      console.log('   5. Check if query editor updates automatically');
      console.log('\n🔧 To trigger a test:');
      console.log('   Run this script again to add more commands to the queue');
      console.log('   The browser should pick them up within 2 seconds');
    } else {
      console.log('\n❌ OPTION 1 (POLLING) INFRASTRUCTURE: ISSUES DETECTED');
      
      if (!step1Success) {
        console.log('   - MCP request processing failed');
        console.log('   - Check OSD server logs for errors');
      }
      
      if (!step2Success) {
        console.log('   - Pending commands queue not working');
        console.log('   - Check if /api/osd-mcp-server/pending-commands endpoint exists');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure OpenSearch Dashboards is running: yarn start');
    console.log('   2. Make sure OSD MCP Server plugin is enabled');
    console.log('   3. Check OSD server logs for errors');
    console.log('   4. Restart OSD if you just added the polling endpoints');
  }
}

// Run the complete test
runCompleteTest();