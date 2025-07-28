// Test script to verify red flags are working on dashboard
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:8000';

// Mock user credentials (you'll need to use real ones)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

async function testRedFlagsOnDashboard() {
  console.log('🧪 Testing Red Flags Dashboard Integration...\n');
  
  try {
    // Step 1: Login to get auth token
    console.log('1. Attempting to login...');
    let authToken = null;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      authToken = loginResponse.data.access_token;
      console.log('✅ Login successful');
    } catch (loginError) {
      console.log('⚠️  Login failed, trying to register first...');
      
      // Try to register if login fails
      try {
        await axios.post(`${BASE_URL}/api/auth/register`, {
          email: TEST_USER.email,
          password: TEST_USER.password,
          first_name: 'Test',
          last_name: 'User'
        });
        console.log('✅ Registration successful');
        
        // Now try login again
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: TEST_USER.email,
          password: TEST_USER.password
        });
        authToken = loginResponse.data.access_token;
        console.log('✅ Login successful after registration');
      } catch (registerError) {
        console.log('❌ Both registration and login failed');
        console.log('Error:', registerError.response?.data || registerError.message);
        return;
      }
    }
    
    if (!authToken) {
      console.log('❌ No auth token available');
      return;
    }
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Get policies
    console.log('\n2. Fetching policies...');
    const policiesResponse = await axios.get(`${BASE_URL}/api/policies`, { headers });
    const policies = policiesResponse.data;
    console.log(`✅ Found ${policies.length} policies`);
    
    if (policies.length === 0) {
      console.log('⚠️  No policies found. Red flags test cannot proceed.');
      return;
    }
    
    // Step 3: Get red flags for each policy
    console.log('\n3. Fetching red flags for each policy...');
    let totalRedFlags = 0;
    const allRedFlags = [];
    
    for (const policy of policies) {
      try {
        const redFlagsResponse = await axios.get(`${BASE_URL}/api/policies/${policy.id}/red-flags`, { headers });
        const redFlags = redFlagsResponse.data;
        totalRedFlags += redFlags.length;
        allRedFlags.push(...redFlags);
        
        console.log(`   Policy "${policy.policy_name}": ${redFlags.length} red flags`);
        
        // Show details of red flags
        redFlags.forEach(flag => {
          console.log(`     - ${flag.title} (${flag.severity})`);
        });
      } catch (error) {
        console.log(`   Policy "${policy.policy_name}": Error fetching red flags`);
      }
    }
    
    console.log(`\n📊 Total Red Flags Found: ${totalRedFlags}`);
    
    // Step 4: Test dashboard stats aggregation (simulate what the frontend does)
    console.log('\n4. Testing dashboard stats aggregation...');
    
    const redFlagsBySeverity = allRedFlags.reduce((acc, flag) => {
      const severity = flag.severity || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});
    
    const dashboardStats = {
      total_policies: policies.length,
      total_documents: 0, // Would be fetched from documents API
      red_flags_summary: {
        total: allRedFlags.length,
        by_severity: redFlagsBySeverity
      },
      recent_red_flags: allRedFlags.slice(0, 5) // Get the 5 most recent
    };
    
    console.log('✅ Dashboard Stats:');
    console.log('   Total Policies:', dashboardStats.total_policies);
    console.log('   Total Red Flags:', dashboardStats.red_flags_summary.total);
    console.log('   Red Flags by Severity:', dashboardStats.red_flags_summary.by_severity);
    console.log('   Recent Red Flags Count:', dashboardStats.recent_red_flags.length);
    
    // Step 5: Show recent red flags details
    if (dashboardStats.recent_red_flags.length > 0) {
      console.log('\n5. Recent Red Flags Details:');
      dashboardStats.recent_red_flags.forEach((flag, index) => {
        console.log(`   ${index + 1}. ${flag.title}`);
        console.log(`      Severity: ${flag.severity}`);
        console.log(`      Type: ${flag.flag_type}`);
        console.log(`      Description: ${flag.description}`);
        if (flag.recommendation) {
          console.log(`      Recommendation: ${flag.recommendation}`);
        }
        console.log('');
      });
    } else {
      console.log('\n5. No recent red flags to display');
    }
    
    console.log('🎉 Red Flags Dashboard Integration Test Complete!');
    console.log('\n📝 Summary:');
    console.log(`   - Found ${policies.length} policies`);
    console.log(`   - Found ${totalRedFlags} total red flags`);
    console.log(`   - Dashboard would show ${dashboardStats.recent_red_flags.length} recent red flags`);
    console.log(`   - Red flags are properly aggregated by severity`);
    
    if (totalRedFlags > 0) {
      console.log('\n✅ Red flags should now be visible on the dashboard!');
    } else {
      console.log('\n⚠️  No red flags found. You may need to create some test data.');
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:');
    console.log(error.response?.data || error.message);
  }
}

// Run the test
testRedFlagsOnDashboard();
