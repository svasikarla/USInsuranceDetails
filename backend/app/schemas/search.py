from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class SearchSortBy(str, Enum):
    relevance = "relevance"
    date = "date"
    name = "name"
    type = "type"

class SearchSortOrder(str, Enum):
    asc = "asc"
    desc = "desc"

class SearchResult(BaseModel):
    id: str
    type: str  # 'policy', 'document', 'carrier'
    title: str
    description: str
    url: str
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    updated_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True

class SearchFacets(BaseModel):
    types: Dict[str, int] = Field(default_factory=dict)
    carriers: Dict[str, int] = Field(default_factory=dict)
    policy_types: Dict[str, int] = Field(default_factory=dict)
    date_ranges: Dict[str, int] = Field(default_factory=dict)

class GlobalSearchResponse(BaseModel):
    results: List[SearchResult]
    total_count: int
    page: int
    limit: int
    search_time_ms: int
    facets: SearchFacets
    suggestions: List[str] = Field(default_factory=list)

class SearchFilters(BaseModel):
    query: Optional[str] = None
    types: Optional[List[str]] = None
    carrier_ids: Optional[List[str]] = None
    policy_types: Optional[List[str]] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    limit: Optional[int] = Field(20, ge=1, le=100)
    page: Optional[int] = Field(1, ge=1)

class AdvancedSearchFilters(SearchFilters):
    # Premium filters
    premium_min: Optional[float] = Field(None, ge=0)
    premium_max: Optional[float] = Field(None, ge=0)
    
    # Processing filters
    processing_status: Optional[List[str]] = None
    processing_confidence_min: Optional[int] = Field(None, ge=0, le=100)
    
    # Red flag filters
    has_red_flags: Optional[bool] = None
    red_flag_severity: Optional[List[str]] = None
    
    # Network and file type filters
    network_types: Optional[List[str]] = None
    file_types: Optional[List[str]] = None
    
    # Sorting
    sort_by: Optional[SearchSortBy] = SearchSortBy.relevance
    sort_order: Optional[SearchSortOrder] = SearchSortOrder.desc

class SearchSuggestion(BaseModel):
    text: str
    type: str  # 'query', 'filter', 'entity'
    count: Optional[int] = None

class SearchAnalytics(BaseModel):
    query: str
    filters: Dict[str, Any]
    result_count: int
    timestamp: datetime
    user_id: str

class QuickSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = Field(8, ge=1, le=20)

class SearchSuggestionsRequest(BaseModel):
    query: str = ""
    limit: Optional[int] = Field(5, ge=1, le=10)

class SearchSuggestionsResponse(BaseModel):
    suggestions: List[str]

# Entity-specific search schemas
class PolicySearchResult(SearchResult):
    policy_number: Optional[str] = None
    policy_type: Optional[str] = None
    premium_amount: Optional[float] = None
    carrier_name: Optional[str] = None

class DocumentSearchResult(SearchResult):
    filename: str
    document_type: Optional[str] = None
    file_size: Optional[int] = None
    processing_status: Optional[str] = None
    confidence_score: Optional[float] = None
    has_red_flags: Optional[bool] = None

class CarrierSearchResult(SearchResult):
    name: str
    contact_email: Optional[str] = None
    phone_number: Optional[str] = None
    policy_count: Optional[int] = None

# Search history and analytics
class SearchHistory(BaseModel):
    id: str
    query: str
    filters: Dict[str, Any]
    result_count: int
    timestamp: datetime
    user_id: str

class PopularSearch(BaseModel):
    query: str
    search_count: int
    last_searched: datetime

class SearchMetrics(BaseModel):
    total_searches: int
    unique_queries: int
    average_results_per_search: float
    most_popular_queries: List[PopularSearch]
    search_trends: Dict[str, int]  # Date -> search count

# Faceted search schemas
class FacetValue(BaseModel):
    value: str
    count: int
    selected: bool = False

class SearchFacet(BaseModel):
    name: str
    display_name: str
    values: List[FacetValue]
    facet_type: str  # 'single', 'multiple', 'range'

class FacetedSearchResponse(BaseModel):
    results: List[SearchResult]
    facets: List[SearchFacet]
    total_count: int
    page: int
    limit: int
    search_time_ms: int

# Export filters for search results
class SearchExportRequest(BaseModel):
    filters: AdvancedSearchFilters
    format: str = Field("csv", pattern="^(csv|json|xlsx)$")
    include_metadata: bool = True

class SearchExportResponse(BaseModel):
    download_url: str
    filename: str
    file_size: int
    expires_at: datetime

# Search configuration
class SearchConfig(BaseModel):
    max_results_per_page: int = 100
    default_results_per_page: int = 20
    max_search_query_length: int = 500
    enable_fuzzy_search: bool = True
    enable_autocomplete: bool = True
    autocomplete_min_chars: int = 2
    search_timeout_seconds: int = 30

# Saved searches
class SavedSearch(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    filters: AdvancedSearchFilters
    user_id: str
    created_at: datetime
    updated_at: datetime
    is_public: bool = False

class CreateSavedSearch(BaseModel):
    name: str
    description: Optional[str] = None
    filters: AdvancedSearchFilters
    is_public: bool = False

class UpdateSavedSearch(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    filters: Optional[AdvancedSearchFilters] = None
    is_public: Optional[bool] = None
