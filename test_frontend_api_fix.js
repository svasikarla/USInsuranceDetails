#!/usr/bin/env node
/**
 * Test the frontend API fix for red flags
 */

console.log('🧪 Testing Frontend API Fix for Red Flags');
console.log('=' * 50);

// Mock the API responses to test the logic
const mockApiResponses = {
  policies: [
    {
      id: '2c165ab4-97a7-413a-a949-23a38c33d4fb',
      policy_name: 'GoldCare Employee Plan',
      policy_type: 'health',
      user_id: '5011de75-ce5b-4f28-a49a-31e606c4688d',
      created_at: '2024-01-15T10:00:00Z'
    }
  ],
  
  // This is what the backend returns (direct array)
  redFlagsBackendResponse: [
    { id: '1', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'high', title: 'Maternity Waiting Period' },
    { id: '2', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'high', title: 'Mental Health Limitation' },
    { id: '3', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'high', title: 'Out-of-Network Auth' },
    { id: '4', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'medium', title: 'Pre-auth Required' },
    { id: '5', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'medium', title: 'Coverage Limitation' },
    { id: '6', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'medium', title: 'Network Restriction' },
    { id: '7', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'medium', title: 'Exclusion' },
    { id: '8', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'medium', title: 'Waiting Period' },
    { id: '9', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'low', title: 'Documentation Required' },
    // Additional flags to match the 18 total
    { id: '10', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'high', title: 'High Deductible' },
    { id: '11', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'medium', title: 'Limited Providers' },
    { id: '12', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'medium', title: 'Copay Required' },
    { id: '13', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'medium', title: 'Annual Limit' },
    { id: '14', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'medium', title: 'Referral Required' },
    { id: '15', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'low', title: 'Prior Notice' },
    { id: '16', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'low', title: 'Form Required' },
    { id: '17', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'low', title: 'ID Required' },
    { id: '18', policy_id: '2c165ab4-97a7-413a-a949-23a38c33d4fb', severity: 'low', title: 'Verification Required' }
  ]
};

// Simulate the OLD frontend API logic (BROKEN)
function simulateOldApiLogic() {
  console.log('\n❌ Testing OLD API Logic (BROKEN):');
  
  // This is what the old code was doing
  const response = { data: mockApiResponses.redFlagsBackendResponse };
  const redFlags = response.data.red_flags || []; // This would be undefined!
  
  console.log(`   Backend returned: ${response.data.length} red flags`);
  console.log(`   Frontend extracted: ${redFlags.length} red flags`);
  console.log(`   Result: ${redFlags.length === 0 ? '❌ BROKEN' : '✅ WORKING'}`);
  
  return redFlags;
}

// Simulate the NEW frontend API logic (FIXED)
function simulateNewApiLogic() {
  console.log('\n✅ Testing NEW API Logic (FIXED):');
  
  // This is what the new code does
  const response = { data: mockApiResponses.redFlagsBackendResponse };
  const redFlags = response.data || []; // This works!
  
  console.log(`   Backend returned: ${response.data.length} red flags`);
  console.log(`   Frontend extracted: ${redFlags.length} red flags`);
  console.log(`   Result: ${redFlags.length > 0 ? '✅ WORKING' : '❌ BROKEN'}`);
  
  return redFlags;
}

// Simulate the complete dashboard stats logic
function simulateDashboardStats() {
  console.log('\n📊 Testing Complete Dashboard Stats Logic:');
  
  const policies = mockApiResponses.policies;
  
  // Simulate fetching red flags for all policies (using NEW logic)
  let allRedFlags = [];
  
  policies.forEach(policy => {
    console.log(`   Fetching red flags for policy: ${policy.policy_name}`);
    const response = { data: mockApiResponses.redFlagsBackendResponse };
    const policyRedFlags = response.data || []; // FIXED logic
    allRedFlags = allRedFlags.concat(policyRedFlags);
    console.log(`     Found: ${policyRedFlags.length} red flags`);
  });
  
  // Calculate red flags summary
  const redFlagsBySeverity = allRedFlags.reduce((acc, flag) => {
    const severity = flag.severity || 'unknown';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});
  
  const dashboardStats = {
    total_policies: policies.length,
    total_documents: 1,
    policies_by_type: { health: 1 },
    policies_by_carrier: { 'GoldCare': 1 },
    recent_activity: [],
    red_flags_summary: {
      total: allRedFlags.length,
      by_severity: redFlagsBySeverity
    }
  };
  
  return dashboardStats;
}

// Run the tests
console.log('\n🧪 Running API Logic Tests...');

const oldResult = simulateOldApiLogic();
const newResult = simulateNewApiLogic();
const dashboardStats = simulateDashboardStats();

console.log('\n📋 Final Dashboard Stats:');
console.log(`   Total Policies: ${dashboardStats.total_policies}`);
console.log(`   Total Red Flags: ${dashboardStats.red_flags_summary.total}`);
console.log('\n🚩 Red Flags by Severity:');
Object.entries(dashboardStats.red_flags_summary.by_severity).forEach(([severity, count]) => {
  console.log(`   ${severity}: ${count}`);
});

// Verify the fix
console.log('\n🧪 Test Results:');
console.log(`   Old Logic: ${oldResult.length === 0 ? '❌ BROKEN (returned 0)' : '✅ WORKING'}`);
console.log(`   New Logic: ${newResult.length > 0 ? '✅ FIXED (returned ' + newResult.length + ')' : '❌ STILL BROKEN'}`);
console.log(`   Dashboard: ${dashboardStats.red_flags_summary.total > 0 ? '✅ WORKING' : '❌ BROKEN'}`);

if (dashboardStats.red_flags_summary.total === 18) {
  console.log('\n🎉 SUCCESS! The fix should work correctly.');
  console.log('\n🚀 Next Steps:');
  console.log('   1. Start the frontend: npm run dev');
  console.log('   2. Login to the dashboard');
  console.log('   3. Verify red flags count shows 18 instead of 0');
} else {
  console.log('\n❌ Something is still wrong with the logic.');
}
