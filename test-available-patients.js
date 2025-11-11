#!/usr/bin/env node
require('dotenv').config();
const PatientModel = require('./src/models/Patient');

async function testAvailablePatients() {
  console.log('🧪 Testing available patients query...\n');
  
  try {
    const startTime = Date.now();
    const patients = await PatientModel.findAvailablePatients({ 
      organizationId: 15,
      limit: 100 
    });
    const endTime = Date.now();
    
    console.log(`✅ Query successful!`);
    console.log(`⚡ Query time: ${endTime - startTime}ms`);
    console.log(`📊 Found ${patients.length} available patients`);
    
    if (patients.length > 0) {
      console.log(`\n📝 Sample patient:`, {
        id: patients[0].id,
        name: `${patients[0].first_name} ${patients[0].last_name}`,
        isOnboarded: patients[0].is_onboarded,
        isActive: patients[0].is_active
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAvailablePatients();
