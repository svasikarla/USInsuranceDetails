// API Types for US Insurance Platform
// These interfaces match the backend Pydantic schemas

export interface InsurancePolicy {
  id: string;
  document_id: string;
  user_id: string;
  carrier_id?: string;
  policy_name: string;
  policy_type?: 'health' | 'dental' | 'vision' | 'life';
  policy_number?: string;
  plan_year?: string;
  effective_date?: string;
  expiration_date?: string;
  group_number?: string;
  network_type?: 'HMO' | 'PPO' | 'EPO' | 'POS';
  deductible_individual?: number;
  deductible_family?: number;
  out_of_pocket_max_individual?: number;
  out_of_pocket_max_family?: number;
  premium_monthly?: number;
  premium_annual?: number;
  created_at: string;
  updated_at: string;
}

export interface InsurancePolicyCreate {
  document_id: string;
  carrier_id?: string;
  policy_name: string;
  policy_type?: 'health' | 'dental' | 'vision' | 'life';
  policy_number?: string;
  plan_year?: string;
  effective_date?: string;
  expiration_date?: string;
  group_number?: string;
  network_type?: 'HMO' | 'PPO' | 'EPO' | 'POS';
  deductible_individual?: number;
  deductible_family?: number;
  out_of_pocket_max_individual?: number;
  out_of_pocket_max_family?: number;
  premium_monthly?: number;
  premium_annual?: number;
}

export interface InsuranceCarrier {
  id: string;
  name: string;
  code: string;
  api_endpoint?: string;
  api_auth_method?: string;
  api_key_name?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsuranceCarrierCreate {
  name: string;
  code: string;
  api_endpoint?: string;
  api_auth_method?: string;
  api_key_name?: string;
  logo_url?: string;
}

export interface InsuranceCarrierUpdate {
  name?: string;
  code?: string;
  api_endpoint?: string;
  api_auth_method?: string;
  api_key_name?: string;
  is_active?: boolean;
  logo_url?: string;
}

export interface CarrierFilters {
  search?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

export interface CarrierStats {
  total_policies: number;
  total_documents: number;
  active_policies: number;
  recent_activity: number;
}

export interface PolicyDocument {
  policy_id?: string;
  id: string;
  user_id: string;
  carrier_id?: string;
  original_filename: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  upload_method: 'manual_upload' | 'api_fetch' | 'email_import';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  ocr_confidence_score?: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export interface PolicyDocumentWithText extends PolicyDocument {
  extracted_text?: string;
}

export interface CoverageBenefit {
  id: string;
  policy_id: string;
  benefit_category: 'preventive' | 'emergency' | 'specialist' | 'prescription';
  benefit_name: string;
  coverage_percentage?: number;
  copay_amount?: number;
  coinsurance_percentage?: number;
  requires_preauth: boolean;
  network_restriction?: 'in_network_only' | 'out_of_network_allowed' | 'no_restriction';
  annual_limit?: number;
  visit_limit?: number;
  notes?: string;
  created_at: string;
}

export interface RedFlag {
  id: string;
  policy_id: string;
  flag_type: 'preauth_required' | 'coverage_limitation' | 'exclusion' | 'network_limitation';
  severity: 'high' | 'medium' | 'low' | 'critical';
  title: string;
  description: string;
  source_text?: string;
  page_number?: string;
  recommendation?: string;
  confidence_score?: number;
  detected_by: 'system' | 'manual' | 'ai';
  // Categorization fields (optional)
  regulatory_level?: 'federal' | 'state' | 'federal_state';
  prominent_category?: 'coverage_access' | 'cost_financial' | 'medical_necessity_exclusions' | 'process_administrative' | 'special_populations';
  federal_regulation?: 'aca_ehb' | 'erisa' | 'federal_consumer_protection' | 'mental_health_parity' | 'preventive_care' | 'emergency_services';
  state_regulation?: 'state_mandated_benefits' | 'state_consumer_protection' | 'state_network_adequacy' | 'state_prior_auth_limits' | 'state_coverage_requirements';
  state_code?: string;
  regulatory_context?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

// Dashboard specific types
export interface DashboardStats {
  total_policies: number;
  total_documents: number;
  policies_by_type: Record<string, number>;
  policies_by_carrier: Record<string, number>;
  recent_activity: ActivityItem[];
  red_flags_summary: {
    total: number;
    by_severity: Record<string, number>;
  };
  recent_red_flags: RedFlag[];
  recent_policies: InsurancePolicy[];
  categorization_summary?: any; // backend includes categorization summary in dashboard summary
}

export interface ActivityItem {
  id: string;
  type: 'policy_created' | 'document_uploaded' | 'red_flag_detected';
  title: string;
  description: string;
  timestamp: string;
  policy_id?: string;
  document_id?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// Search and filter types
export interface PolicyFilters {
  policy_type?: string;
  carrier_id?: string;
  network_type?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface DocumentFilters {
  processing_status?: string;
  carrier_id?: string;
  upload_method?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface DocumentPolicyStatus {
  document_id: string;
  processing_status: string;
  has_auto_created_policy: boolean;
  policies: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  processed_at?: string;
  extraction_confidence?: number;
}

export interface ExtractedPolicyData {
  policy_name?: string;
  policy_type?: 'health' | 'dental' | 'vision' | 'life';
  policy_number?: string;
  plan_year?: string;
  group_number?: string;
  network_type?: 'HMO' | 'PPO' | 'EPO' | 'POS';
  effective_date?: string;
  expiration_date?: string;
  deductible_individual?: number;
  deductible_family?: number;
  out_of_pocket_max_individual?: number;
  out_of_pocket_max_family?: number;
  premium_monthly?: number;
  premium_annual?: number;
  extraction_confidence: number;
  extraction_method: string;
  extraction_errors: string[];
  missing_fields: string[];
  data_quality?: string;
  extraction_timestamp: string;
}

export interface AutoPolicyCreationResponse {
  success: boolean;
  policy_id?: string;
  extracted_data: ExtractedPolicyData;
  validation_errors: string[];
  warnings: string[];
  requires_review: boolean;
  confidence_score: number;
  created_at: string;
}

// Enhanced Processing Status Types
export interface ProcessingStage {
  name: string;  // 'upload', 'extraction', 'ai_analysis', 'policy_creation'
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress_percentage: number;
  message?: string;
  completed_at?: string;
}

export interface DocumentProcessingStatus {
  document_id: string;
  overall_status: 'pending' | 'processing' | 'completed' | 'failed';
  overall_progress: number;  // 0-100
  current_stage: string;
  stages: ProcessingStage[];

  // Processing results
  extraction_confidence?: number;
  auto_creation_status?: string;
  auto_creation_confidence?: number;

  // Routing information
  should_review: boolean;
  policy_created: boolean;
  policy_id?: string;

  // Timing
  started_at?: string;
  completed_at?: string;

  // Messages
  error_message?: string;
  info_message?: string;
}
