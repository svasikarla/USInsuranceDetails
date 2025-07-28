#!/usr/bin/env node
/**
 * Frontend Component Validation Test
 * 
 * This script validates the frontend components for the enhanced
 * automatic policy creation workflow.
 */

const fs = require('fs');
const path = require('path');

function testComponentFile(filePath, componentName) {
    console.log(`🔍 Testing ${componentName}...`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ Component file not found: ${filePath}`);
        return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for required imports
    const requiredImports = [
        'React',
        'useState',
        'useEffect',
        'motion',
        'AnimatePresence'
    ];
    
    let importsValid = true;
    requiredImports.forEach(importName => {
        if (content.includes(importName)) {
            console.log(`✅ Import found: ${importName}`);
        } else {
            console.log(`⚠️  Import missing: ${importName}`);
            importsValid = false;
        }
    });
    
    // Check for export
    if (content.includes('export default')) {
        console.log(`✅ Default export found`);
    } else {
        console.log(`❌ Default export missing`);
        return false;
    }
    
    // Check for TypeScript interfaces
    if (content.includes('interface') && content.includes('Props')) {
        console.log(`✅ TypeScript interfaces defined`);
    } else {
        console.log(`⚠️  TypeScript interfaces may be missing`);
    }
    
    console.log(`✅ ${componentName} validation completed\n`);
    return true;
}

function testAPIService() {
    console.log(`🔍 Testing API Service...`);
    
    const apiServicePath = 'frontend/src/services/apiService.ts';
    
    if (!fs.existsSync(apiServicePath)) {
        console.log(`❌ API service file not found: ${apiServicePath}`);
        return false;
    }
    
    const content = fs.readFileSync(apiServicePath, 'utf8');
    
    // Check for new API methods
    const newMethods = [
        'getExtractedPolicyData',
        'createPolicyFromReview'
    ];
    
    let methodsValid = true;
    newMethods.forEach(method => {
        if (content.includes(method)) {
            console.log(`✅ API method found: ${method}`);
        } else {
            console.log(`❌ API method missing: ${method}`);
            methodsValid = false;
        }
    });
    
    console.log(`✅ API Service validation completed\n`);
    return methodsValid;
}

function testDocumentDetailPage() {
    console.log(`🔍 Testing Document Detail Page Integration...`);
    
    const documentPagePath = 'frontend/src/pages/documents/[id].tsx';
    
    if (!fs.existsSync(documentPagePath)) {
        console.log(`❌ Document detail page not found: ${documentPagePath}`);
        return false;
    }
    
    const content = fs.readFileSync(documentPagePath, 'utf8');
    
    // Check for new component imports
    const componentImports = [
        'PolicyReviewModal',
        'AutoCreationStatusCard'
    ];
    
    let importsValid = true;
    componentImports.forEach(component => {
        if (content.includes(component)) {
            console.log(`✅ Component import found: ${component}`);
        } else {
            console.log(`❌ Component import missing: ${component}`);
            importsValid = false;
        }
    });
    
    // Check for new state variables
    const stateVariables = [
        'autoCreationData',
        'showReviewModal',
        'creatingPolicy'
    ];
    
    stateVariables.forEach(variable => {
        if (content.includes(variable)) {
            console.log(`✅ State variable found: ${variable}`);
        } else {
            console.log(`⚠️  State variable missing: ${variable}`);
        }
    });
    
    // Check for new handler functions
    const handlers = [
        'handleReviewExtractedData',
        'handleApprovePolicy',
        'handleRejectPolicy'
    ];
    
    handlers.forEach(handler => {
        if (content.includes(handler)) {
            console.log(`✅ Handler function found: ${handler}`);
        } else {
            console.log(`⚠️  Handler function missing: ${handler}`);
        }
    });
    
    console.log(`✅ Document Detail Page integration validation completed\n`);
    return importsValid;
}

function testTypeDefinitions() {
    console.log(`🔍 Testing Type Definitions...`);
    
    const typesPath = 'frontend/src/types/api.ts';
    
    if (!fs.existsSync(typesPath)) {
        console.log(`❌ Types file not found: ${typesPath}`);
        return false;
    }
    
    const content = fs.readFileSync(typesPath, 'utf8');
    
    // Check for existing types that should be compatible
    const requiredTypes = [
        'ExtractedPolicyData',
        'InsurancePolicyCreate',
        'PolicyDocument'
    ];
    
    let typesValid = true;
    requiredTypes.forEach(type => {
        if (content.includes(type)) {
            console.log(`✅ Type definition found: ${type}`);
        } else {
            console.log(`⚠️  Type definition missing: ${type}`);
            typesValid = false;
        }
    });
    
    console.log(`✅ Type definitions validation completed\n`);
    return typesValid;
}

function main() {
    console.log('🚀 Starting Frontend Component Validation Tests\n');
    
    const tests = [
        {
            name: 'PolicyReviewModal',
            test: () => testComponentFile(
                'frontend/src/components/policy/PolicyReviewModal.tsx',
                'PolicyReviewModal'
            )
        },
        {
            name: 'AutoCreationStatusCard',
            test: () => testComponentFile(
                'frontend/src/components/policy/AutoCreationStatusCard.tsx',
                'AutoCreationStatusCard'
            )
        },
        {
            name: 'API Service',
            test: testAPIService
        },
        {
            name: 'Document Detail Page',
            test: testDocumentDetailPage
        },
        {
            name: 'Type Definitions',
            test: testTypeDefinitions
        }
    ];
    
    const results = [];
    
    tests.forEach(({ name, test }) => {
        try {
            const result = test();
            results.push({ name, result });
        } catch (error) {
            console.log(`❌ ${name} test crashed: ${error.message}`);
            results.push({ name, result: false });
        }
    });
    
    // Summary
    console.log('='.repeat(60));
    console.log('📊 FRONTEND VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    let passed = 0;
    const total = results.length;
    
    results.forEach(({ name, result }) => {
        const status = result ? '✅ PASSED' : '❌ FAILED';
        console.log(`${name.padEnd(25)} ${status}`);
        if (result) passed++;
    });
    
    console.log(`\nOverall: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('\n🎉 All frontend components are properly integrated!');
        console.log('✅ Enhanced automatic policy creation workflow is ready for testing.');
    } else {
        console.log(`\n⚠️  ${total - passed} test(s) failed. Please review the issues above.`);
    }
    
    return passed === total;
}

if (require.main === module) {
    const success = main();
    process.exit(success ? 0 : 1);
}
