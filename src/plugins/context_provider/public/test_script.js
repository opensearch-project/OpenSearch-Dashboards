/*
 * Context Provider Test Script
 * 
 * Copy and paste these commands into the browser console to test the context provider
 * Make sure you're on a Dashboard or Discover page in OpenSearch Dashboards
 */

console.log('🧪 Context Provider Test Script');
console.log('================================');

// Check if context provider is available
if (typeof window.contextProvider === 'undefined') {
  console.error('❌ Context Provider not available. Make sure the plugin is loaded.');
} else {
  console.log('✅ Context Provider is available!');
  console.log('📋 Available methods:', Object.keys(window.contextProvider));
}

// Test functions
const testContextProvider = {
  
  // Test 1: Get current context
  async getCurrentContext() {
    console.log('\n🔍 Test 1: Getting current context...');
    try {
      const context = await window.contextProvider.getCurrentContext();
      console.log('📊 Current context:', context);
      return context;
    } catch (error) {
      console.error('❌ Error getting context:', error);
    }
  },

  // Test 2: Get available actions
  getAvailableActions() {
    console.log('\n📋 Test 2: Getting available actions...');
    try {
      const actions = window.contextProvider.getAvailableActions();
      console.log('🎯 Available actions:', actions);
      return actions;
    } catch (error) {
      console.error('❌ Error getting actions:', error);
    }
  },

  // Test 3: Test manual context capture
  testManualCapture() {
    console.log('\n⚡ Test 3: Testing manual context capture...');
    try {
      // Test table row click
      console.log('🔍 Testing table row click...');
      window.contextProvider.testTableRowClick();
      
      // Test embeddable hover
      console.log('🎯 Testing embeddable hover...');
      window.contextProvider.testEmbeddableHover();
      
      // Test filter application
      console.log('🔍 Testing filter application...');
      window.contextProvider.testFilterApplication();
      
      console.log('✅ Manual capture tests completed');
    } catch (error) {
      console.error('❌ Error in manual capture:', error);
    }
  },

  // Test 4: Execute actions
  async testActions() {
    console.log('\n🎯 Test 4: Testing action execution...');
    
    try {
      // Test adding a filter
      console.log('➕ Testing ADD_FILTER...');
      const filterResult = await window.contextProvider.executeAction('ADD_FILTER', {
        field: 'response.keyword',
        value: '200'
      });
      console.log('✅ Filter added:', filterResult);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test changing time range
      console.log('⏰ Testing CHANGE_TIME_RANGE...');
      const timeResult = await window.contextProvider.executeAction('CHANGE_TIME_RANGE', {
        from: 'now-1h',
        to: 'now'
      });
      console.log('✅ Time range changed:', timeResult);
      
      // Test refresh
      console.log('🔄 Testing REFRESH_DATA...');
      const refreshResult = await window.contextProvider.executeAction('REFRESH_DATA', {});
      console.log('✅ Data refreshed:', refreshResult);
      
    } catch (error) {
      console.error('❌ Error executing actions:', error);
    }
  },

  // Test 5: Navigation actions
  async testNavigation() {
    console.log('\n🧭 Test 5: Testing navigation actions...');
    
    try {
      const currentUrl = window.location.href;
      console.log('📍 Current URL:', currentUrl);
      
      if (currentUrl.includes('/discover')) {
        console.log('🧭 Currently in Discover, testing navigation to Dashboard...');
        await window.contextProvider.executeAction('NAVIGATE_TO_DASHBOARD', {});
      } else if (currentUrl.includes('/dashboard')) {
        console.log('🧭 Currently in Dashboard, testing navigation to Discover...');
        await window.contextProvider.executeAction('NAVIGATE_TO_DISCOVER', {});
      } else {
        console.log('🧭 Testing navigation to Discover...');
        await window.contextProvider.executeAction('NAVIGATE_TO_DISCOVER', {});
      }
      
    } catch (error) {
      console.error('❌ Error in navigation:', error);
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('\n🚀 Running all Context Provider tests...');
    console.log('=====================================');
    
    await this.getCurrentContext();
    this.getAvailableActions();
    this.testManualCapture();
    await this.testActions();
    
    console.log('\n✅ All tests completed!');
    console.log('📝 Check the console output above for results');
    console.log('💡 Try navigating between Dashboard and Discover to see context updates');
  }
};

// Make test functions globally available
window.testContextProvider = testContextProvider;

console.log('\n💡 Usage:');
console.log('- testContextProvider.runAllTests() - Run all tests');
console.log('- testContextProvider.getCurrentContext() - Get current context');
console.log('- testContextProvider.testActions() - Test action execution');
console.log('- testContextProvider.testNavigation() - Test navigation');
console.log('\n🎯 Or use individual context provider methods:');
console.log('- window.contextProvider.getCurrentContext()');
console.log('- window.contextProvider.executeAction("ADD_FILTER", {field: "status", value: "active"})');
console.log('- window.contextProvider.testTableRowClick()');