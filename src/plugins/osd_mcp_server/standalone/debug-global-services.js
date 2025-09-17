#!/usr/bin/env node

/**
 * Debug script to check global services availability
 */

console.log('🔍 Debugging Global Services...');

// Check if global services exist
console.log('📊 Global Services Check:');
console.log('- global.exploreServices exists:', !!global.exploreServices);
console.log('- global.exploreReduxActions exists:', !!global.exploreReduxActions);

if (global.exploreServices) {
  console.log('✅ exploreServices found!');
  console.log('- store exists:', !!global.exploreServices.store);

  if (global.exploreServices.store) {
    console.log('✅ Redux store found!');
    try {
      const state = global.exploreServices.store.getState();
      console.log('📋 Current Redux State:');
      console.log('- query.query:', state.query?.query || 'undefined');
      console.log('- query.language:', state.query?.language || 'undefined');
      console.log('- query.dataset:', state.query?.dataset?.title || 'undefined');
      console.log('- ui.activeTabId:', state.ui?.activeTabId || 'undefined');
    } catch (error) {
      console.error('❌ Error accessing Redux state:', error.message);
    }
  }
} else {
  console.log('❌ exploreServices NOT found');
  console.log('🔍 Available global properties:');
  console.log(
    Object.keys(global).filter((key) => key.includes('explore') || key.includes('redux'))
  );
}

if (global.exploreReduxActions) {
  console.log('✅ exploreReduxActions found!');
  console.log('- Available actions:', Object.keys(global.exploreReduxActions));
} else {
  console.log('❌ exploreReduxActions NOT found');
}

// Check if we're in browser context
if (typeof window !== 'undefined') {
  console.log('🌐 Browser context detected');
  console.log('- window.exploreServices exists:', !!window.exploreServices);
  console.log('- window.exploreReduxActions exists:', !!window.exploreReduxActions);
} else {
  console.log('🖥️ Node.js context detected');
}

console.log('🔍 Debug complete');
