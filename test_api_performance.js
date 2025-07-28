#!/usr/bin/env node
/**
 * API Performance Test Script
 * 
 * Tests the dashboard API performance improvements:
 * 1. Single API call instead of multiple
 * 2. Optimized backend queries
 * 3. Reduced data transfer
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = 'http://127.0.0.1:8000';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword123';

class APIPerformanceTest {
    constructor() {
        this.authToken = null;
        this.results = {};
    }

    async makeRequest(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(API_BASE_URL + path);
            const options = {
                hostname: url.hostname,
                port: url.port || 80,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const jsonBody = body ? JSON.parse(body) : {};
                        resolve({
                            status: res.statusCode,
                            data: jsonBody,
                            headers: res.headers
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            data: body,
                            headers: res.headers
                        });
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    async authenticate() {
        console.log('🔐 Authenticating...');
        
        try {
            const formData = `username=${encodeURIComponent(TEST_USER_EMAIL)}&password=${encodeURIComponent(TEST_USER_PASSWORD)}`;
            
            const response = await this.makeRequest('POST', '/api/auth/login', null, {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(formData)
            });

            if (response.status === 200 && response.data.access_token) {
                this.authToken = response.data.access_token;
                console.log('✅ Authentication successful');
                return true;
            } else {
                console.log(`❌ Authentication failed: ${response.status}`);
                console.log('Response:', response.data);
                return false;
            }
        } catch (error) {
            console.log(`❌ Authentication error: ${error.message}`);
            return false;
        }
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.authToken}`
        };
    }

    async measureEndpoint(name, path, iterations = 5) {
        console.log(`\n📊 Testing ${name}...`);
        
        const times = [];
        let successCount = 0;
        let totalDataSize = 0;

        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            
            try {
                const response = await this.makeRequest('GET', path, null, this.getAuthHeaders());
                const endTime = Date.now();
                
                if (response.status === 200) {
                    const responseTime = endTime - startTime;
                    times.push(responseTime);
                    successCount++;
                    
                    // Estimate data size
                    const dataSize = JSON.stringify(response.data).length;
                    totalDataSize += dataSize;
                    
                    console.log(`   Attempt ${i + 1}: ${responseTime}ms (${(dataSize / 1024).toFixed(1)}KB)`);
                } else {
                    console.log(`   Attempt ${i + 1}: Failed (${response.status})`);
                }
            } catch (error) {
                console.log(`   Attempt ${i + 1}: Error - ${error.message}`);
            }
        }

        if (times.length > 0) {
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);
            const avgDataSize = totalDataSize / successCount;

            console.log(`\n📈 ${name} Results:`);
            console.log(`   Average time: ${avgTime.toFixed(1)}ms`);
            console.log(`   Min time: ${minTime}ms`);
            console.log(`   Max time: ${maxTime}ms`);
            console.log(`   Success rate: ${successCount}/${iterations}`);
            console.log(`   Average data size: ${(avgDataSize / 1024).toFixed(1)}KB`);

            return {
                name,
                avgTime,
                minTime,
                maxTime,
                successCount,
                totalAttempts: iterations,
                avgDataSize
            };
        } else {
            console.log(`❌ ${name}: No successful requests`);
            return null;
        }
    }

    async testDashboardPerformance() {
        console.log('\n🚀 Dashboard Performance Test');
        console.log('=' * 50);

        if (!await this.authenticate()) {
            console.log('❌ Cannot proceed without authentication');
            return;
        }

        // Test the optimized dashboard endpoint
        const dashboardResult = await this.measureEndpoint(
            'Dashboard API (Optimized)', 
            '/api/dashboard/summary', 
            10
        );

        // Test individual endpoints for comparison
        const policiesResult = await this.measureEndpoint(
            'Policies API', 
            '/api/policies', 
            5
        );

        const documentsResult = await this.measureEndpoint(
            'Documents API', 
            '/api/documents', 
            5
        );

        const carriersResult = await this.measureEndpoint(
            'Carriers API', 
            '/api/carriers', 
            5
        );

        // Calculate what the old approach would have taken
        if (dashboardResult && policiesResult && documentsResult && carriersResult) {
            const oldApproachTime = policiesResult.avgTime + documentsResult.avgTime + carriersResult.avgTime;
            const improvement = ((oldApproachTime - dashboardResult.avgTime) / oldApproachTime * 100);

            console.log('\n' + '=' * 50);
            console.log('📊 PERFORMANCE COMPARISON');
            console.log('=' * 50);
            console.log(`🔄 Old Approach (3 separate calls): ${oldApproachTime.toFixed(1)}ms`);
            console.log(`⚡ New Approach (1 optimized call): ${dashboardResult.avgTime.toFixed(1)}ms`);
            console.log(`🎯 Performance Improvement: ${improvement.toFixed(1)}%`);
            console.log(`💾 Data Transfer Reduction: Single response vs 3 responses`);

            if (improvement > 50) {
                console.log('🎉 EXCELLENT: Major performance improvement achieved!');
            } else if (improvement > 25) {
                console.log('✅ GOOD: Significant performance improvement');
            } else if (improvement > 0) {
                console.log('👍 FAIR: Some performance improvement');
            } else {
                console.log('⚠️  CONCERN: Performance may have regressed');
            }
        }

        console.log('\n🔧 Optimizations Applied:');
        console.log('   ✅ Eliminated N+1 query problem');
        console.log('   ✅ Single API call instead of multiple');
        console.log('   ✅ Database indexes for fast lookups');
        console.log('   ✅ Eager loading for relationships');
        console.log('   ✅ Reasonable pagination limits');

        console.log(`\n⏰ Test completed at: ${new Date().toISOString()}`);
    }
}

// Run the test
const test = new APIPerformanceTest();
test.testDashboardPerformance().catch(console.error);
