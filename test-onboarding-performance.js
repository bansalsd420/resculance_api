#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';
const ORG_ID = 15;

async function testOnboardingPerformance() {
  console.log('🚀 TESTING ONBOARDING PAGE PERFORMANCE\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Fetch ambulances (should be fast - just status check)
    console.log('\n📍 Test 1: Fetching ambulances...');
    const start1 = Date.now();
    const ambulancesResp = await axios.get(`${API_BASE}/ambulances`, {
      params: { organizationId: ORG_ID }
    });
    const end1 = Date.now();
    const ambulances = ambulancesResp.data?.data?.ambulances || ambulancesResp.data?.ambulances || [];
    console.log(`✅ Fetched ${ambulances.length} ambulances in ${end1 - start1}ms`);
    
    // Test 2: Fetch available patients (denormalized query)
    console.log('\n📍 Test 2: Fetching available patients...');
    const start2 = Date.now();
    const patientsResp = await axios.get(`${API_BASE}/patients/available`, {
      params: { organizationId: ORG_ID }
    });
    const end2 = Date.now();
    const patients = patientsResp.data?.data?.patients || patientsResp.data?.patients || [];
    console.log(`✅ Fetched ${patients.length} available patients in ${end2 - start2}ms`);
    
    // Total time
    const totalTime = (end1 - start1) + (end2 - start2);
    console.log('\n' + '='.repeat(60));
    console.log(`\n⚡ TOTAL PAGE LOAD TIME: ${totalTime}ms`);
    console.log(`\n📊 Performance Breakdown:`);
    console.log(`   - Ambulances: ${end1 - start1}ms`);
    console.log(`   - Available Patients: ${end2 - start2}ms`);
    console.log(`   - Total: ${totalTime}ms`);
    
    if (totalTime < 3000) {
      console.log('\n✅ EXCELLENT! Page loads in under 3 seconds');
    } else if (totalTime < 5000) {
      console.log('\n⚠️  ACCEPTABLE: Page loads in under 5 seconds');
    } else {
      console.log('\n❌ SLOW: Page takes more than 5 seconds (remote DB latency)');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
  }
}

testOnboardingPerformance();
