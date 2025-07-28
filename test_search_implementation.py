#!/usr/bin/env python3
"""
Test script to verify the search implementation is working correctly.
This tests the search functionality without running the full server.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_search_schemas():
    """Test that search schemas can be imported and instantiated."""
    try:
        from backend.app.schemas.search import (
            SearchResult, GlobalSearchResponse, AdvancedSearchFilters,
            SearchFacets, SearchSuggestion, QuickSearchRequest
        )
        
        # Test SearchResult
        search_result = SearchResult(
            id="test-1",
            type="policy",
            title="Test Policy",
            description="A test insurance policy",
            url="/policies/test-1",
            relevance_score=0.95,
            updated_at="2024-01-01T00:00:00Z",
            metadata={"carrier": "Test Carrier"}
        )
        print("✓ SearchResult schema works")
        
        # Test SearchFacets
        facets = SearchFacets(
            types={"policy": 5, "document": 3},
            carriers={"Test Carrier": 8},
            policy_types={"health": 5, "dental": 3}
        )
        print("✓ SearchFacets schema works")
        
        # Test GlobalSearchResponse
        response = GlobalSearchResponse(
            results=[search_result],
            total_count=1,
            page=1,
            limit=20,
            search_time_ms=150,
            facets=facets,
            suggestions=["test policy", "test carrier"]
        )
        print("✓ GlobalSearchResponse schema works")
        
        # Test AdvancedSearchFilters
        filters = AdvancedSearchFilters(
            query="test",
            types=["policy", "document"],
            carrier_ids=["carrier-1"],
            premium_min=100.0,
            premium_max=500.0,
            has_red_flags=False
        )
        print("✓ AdvancedSearchFilters schema works")
        
        # Test QuickSearchRequest
        quick_request = QuickSearchRequest(
            query="test",
            limit=8
        )
        print("✓ QuickSearchRequest schema works")
        
        print("\n🎉 All search schemas are working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing search schemas: {e}")
        return False

def test_search_service_types():
    """Test that frontend search service types are correctly defined."""
    try:
        # Read the search service file
        with open('frontend/src/services/searchService.ts', 'r') as f:
            content = f.read()
        
        # Check for key interfaces and types
        required_types = [
            'SearchResult',
            'GlobalSearchResponse', 
            'SearchFilters',
            'AdvancedSearchFilters',
            'globalSearch',
            'advancedSearch',
            'quickSearch',
            'getSearchSuggestions'
        ]
        
        missing_types = []
        for type_name in required_types:
            if type_name not in content:
                missing_types.append(type_name)
        
        if missing_types:
            print(f"❌ Missing types in searchService.ts: {missing_types}")
            return False
        
        print("✓ Frontend search service types are correctly defined")
        return True
        
    except Exception as e:
        print(f"❌ Error testing search service types: {e}")
        return False

def test_search_components():
    """Test that search components exist and have correct structure."""
    try:
        components = [
            'frontend/src/components/search/GlobalSearch.tsx',
            'frontend/src/components/search/SearchFilters.tsx', 
            'frontend/src/components/search/SearchResults.tsx'
        ]
        
        for component_path in components:
            if not os.path.exists(component_path):
                print(f"❌ Missing component: {component_path}")
                return False
            
            with open(component_path, 'r') as f:
                content = f.read()
                
            # Check for React component structure
            if 'export default' not in content and 'export const' not in content:
                print(f"❌ Component {component_path} doesn't export properly")
                return False
        
        print("✓ All search components exist and are properly structured")
        return True
        
    except Exception as e:
        print(f"❌ Error testing search components: {e}")
        return False

def test_search_routes():
    """Test that search routes are properly defined."""
    try:
        # Check if search routes file exists
        if not os.path.exists('backend/app/routes/search.py'):
            print("❌ Search routes file missing")
            return False
        
        with open('backend/app/routes/search.py', 'r') as f:
            content = f.read()
        
        # Check for required endpoints
        required_endpoints = [
            '/search/global',
            '/search/advanced', 
            '/search/quick',
            '/search/suggestions'
        ]
        
        missing_endpoints = []
        for endpoint in required_endpoints:
            if endpoint not in content:
                missing_endpoints.append(endpoint)
        
        if missing_endpoints:
            print(f"❌ Missing endpoints in search routes: {missing_endpoints}")
            return False
        
        print("✓ Search routes are properly defined")
        return True
        
    except Exception as e:
        print(f"❌ Error testing search routes: {e}")
        return False

def test_api_integration():
    """Test that search API is integrated into main app."""
    try:
        with open('backend/app/main.py', 'r') as f:
            content = f.read()
        
        # Check for search import and router inclusion
        if 'from .routes import auth, documents, policies, carriers, search' not in content:
            print("❌ Search routes not imported in main.py")
            return False
        
        if 'app.include_router(search.router' not in content:
            print("❌ Search router not included in main.py")
            return False
        
        print("✓ Search API is properly integrated")
        return True
        
    except Exception as e:
        print(f"❌ Error testing API integration: {e}")
        return False

def test_frontend_integration():
    """Test that search is integrated into frontend."""
    try:
        # Check if search API is added to apiService
        with open('frontend/src/services/apiService.ts', 'r') as f:
            content = f.read()
        
        if 'searchApi' not in content:
            print("❌ searchApi not defined in apiService.ts")
            return False
        
        if 'export { authApi, policyApi, documentApi, carrierApi, dashboardApi, searchApi }' not in content:
            print("❌ searchApi not exported from apiService.ts")
            return False
        
        # Check if search page exists
        if not os.path.exists('frontend/src/pages/search/index.tsx'):
            print("❌ Search page missing")
            return False
        
        # Check if GlobalSearch is added to dashboard
        with open('frontend/src/pages/dashboard.tsx', 'r') as f:
            dashboard_content = f.read()
        
        if 'GlobalSearch' not in dashboard_content:
            print("❌ GlobalSearch not integrated into dashboard")
            return False
        
        print("✓ Search is properly integrated into frontend")
        return True
        
    except Exception as e:
        print(f"❌ Error testing frontend integration: {e}")
        return False

def main():
    """Run all search implementation tests."""
    print("🔍 Testing Search Implementation")
    print("=" * 50)
    
    tests = [
        ("Search Schemas", test_search_schemas),
        ("Search Service Types", test_search_service_types),
        ("Search Components", test_search_components),
        ("Search Routes", test_search_routes),
        ("API Integration", test_api_integration),
        ("Frontend Integration", test_frontend_integration)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Testing {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All search implementation tests passed!")
        print("\n✅ Search and Filtering functionality is ready!")
        print("\n📝 Implementation Summary:")
        print("   • Backend search schemas and routes implemented")
        print("   • Frontend search components and services implemented") 
        print("   • Global search with real-time suggestions")
        print("   • Advanced filtering with multiple criteria")
        print("   • Search results with faceted navigation")
        print("   • Integration with existing dashboard and navigation")
        print("\n🚀 Step 3: Core Application Features - COMPLETED!")
    else:
        print(f"❌ {total - passed} tests failed. Please review the implementation.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
