# Database Entity Relationship Diagram

This diagram shows the complete database schema with all tables, relationships, and key constraints.

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar company_name
        varchar role
        varchar subscription_tier
        boolean is_active
        boolean email_verified
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
    }
    
    INSURANCE_CARRIERS {
        uuid id PK
        varchar name
        varchar code UK
        varchar website_url
        varchar api_endpoint
        boolean api_key_required
        varchar api_status
        varchar logo_url
        timestamp created_at
        timestamp updated_at
    }
    
    POLICY_DOCUMENTS {
        uuid id PK
        uuid user_id FK
        uuid carrier_id FK
        varchar original_filename
        varchar file_path
        bigint file_size_bytes
        varchar mime_type
        varchar upload_method
        varchar processing_status
        text processing_error
        text extracted_text
        decimal ocr_confidence_score
        timestamp created_at
        timestamp updated_at
        timestamp processed_at
    }
    
    INSURANCE_POLICIES {
        uuid id PK
        uuid document_id FK
        uuid user_id FK
        uuid carrier_id FK
        varchar policy_number
        varchar policy_name
        varchar policy_type
        integer plan_year
        date effective_date
        date expiration_date
        varchar group_number
        varchar network_type
        decimal deductible_individual
        decimal deductible_family
        decimal out_of_pocket_max_individual
        decimal out_of_pocket_max_family
        decimal premium_monthly
        decimal premium_annual
        timestamp created_at
        timestamp updated_at
    }
    
    COVERAGE_BENEFITS {
        uuid id PK
        uuid policy_id FK
        varchar benefit_category
        varchar benefit_name
        decimal coverage_percentage
        decimal copay_amount
        decimal coinsurance_percentage
        boolean requires_preauth
        varchar network_restriction
        decimal annual_limit
        integer visit_limit
        text notes
        timestamp created_at
    }
    
    RED_FLAGS {
        uuid id PK
        uuid policy_id FK
        varchar flag_type
        varchar severity
        varchar title
        text description
        text affected_services
        text recommendation
        decimal confidence_score
        varchar detected_by
        timestamp created_at
    }
    
    POLICY_COMPARISONS {
        uuid id PK
        uuid user_id FK
        varchar name
        uuid policy_ids
        jsonb comparison_criteria
        timestamp created_at
        timestamp updated_at
    }
    
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        varchar action
        varchar resource_type
        uuid resource_id
        inet ip_address
        text user_agent
        jsonb metadata
        timestamp created_at
    }
    
    %% Relationships
    USERS ||--o{ POLICY_DOCUMENTS : "uploads"
    USERS ||--o{ INSURANCE_POLICIES : "owns"
    USERS ||--o{ POLICY_COMPARISONS : "creates"
    USERS ||--o{ AUDIT_LOGS : "performs"
    
    INSURANCE_CARRIERS ||--o{ POLICY_DOCUMENTS : "provides"
    INSURANCE_CARRIERS ||--o{ INSURANCE_POLICIES : "issues"
    
    POLICY_DOCUMENTS ||--|| INSURANCE_POLICIES : "contains"
    
    INSURANCE_POLICIES ||--o{ COVERAGE_BENEFITS : "includes"
    INSURANCE_POLICIES ||--o{ RED_FLAGS : "has"
```

## Table Descriptions

### USERS
**Purpose**: Store user account information and authentication data
- **Primary Key**: `id` (UUID)
- **Unique Constraints**: `email`
- **Key Features**: Role-based access, subscription tiers, email verification
- **Relationships**: One-to-many with documents, policies, comparisons, audit logs

### INSURANCE_CARRIERS
**Purpose**: Manage insurance carrier information and API configurations
- **Primary Key**: `id` (UUID)
- **Unique Constraints**: `code` (carrier identifier)
- **Key Features**: API endpoint configuration, status tracking
- **Relationships**: One-to-many with documents and policies

### POLICY_DOCUMENTS
**Purpose**: Store uploaded document metadata and processing status
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `user_id`, `carrier_id`
- **Key Features**: File metadata, processing status, extraction results
- **Relationships**: Belongs to user and carrier, one-to-one with policy

### INSURANCE_POLICIES
**Purpose**: Store structured policy data extracted from documents
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `document_id`, `user_id`, `carrier_id`
- **Key Features**: Policy details, financial information, dates
- **Relationships**: Belongs to document/user/carrier, one-to-many with benefits/flags

### COVERAGE_BENEFITS
**Purpose**: Store detailed benefit information for each policy
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `policy_id`
- **Key Features**: Coverage details, costs, limitations, restrictions
- **Relationships**: Belongs to policy

### RED_FLAGS
**Purpose**: Store detected issues and warnings for policies
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `policy_id`
- **Key Features**: Issue classification, severity levels, recommendations
- **Relationships**: Belongs to policy

### POLICY_COMPARISONS
**Purpose**: Store user-created policy comparisons
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `user_id`
- **Key Features**: Flexible comparison criteria (JSONB), policy arrays
- **Relationships**: Belongs to user

### AUDIT_LOGS
**Purpose**: Track all user actions for security and compliance
- **Primary Key**: `id` (UUID)
- **Foreign Keys**: `user_id`
- **Key Features**: Action tracking, IP logging, metadata storage
- **Relationships**: Belongs to user

## Key Design Decisions

### UUID Primary Keys
- **Benefit**: Globally unique identifiers, better for distributed systems
- **Security**: Prevents ID enumeration attacks
- **Scalability**: No auto-increment bottlenecks

### JSONB Fields
- **Flexibility**: Store variable comparison criteria and metadata
- **Performance**: Indexed JSON queries in PostgreSQL
- **Evolution**: Schema can evolve without migrations

### Timestamp Tracking
- **Audit Trail**: Created/updated timestamps on all entities
- **Compliance**: Required for HIPAA and security auditing
- **Analytics**: Support for time-based analysis

### Soft Relationships
- **Carrier ID**: Optional foreign key allows manual document uploads
- **Flexible Design**: Supports both API and manual workflows
- **Data Integrity**: Maintains relationships while allowing flexibility

## Indexes for Performance

### Primary Indexes
```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_name);

-- Document processing
CREATE INDEX idx_policy_documents_user_id ON policy_documents(user_id);
CREATE INDEX idx_policy_documents_status ON policy_documents(processing_status);
CREATE INDEX idx_policy_documents_created_at ON policy_documents(created_at);

-- Policy searches
CREATE INDEX idx_insurance_policies_user_id ON insurance_policies(user_id);
CREATE INDEX idx_insurance_policies_carrier_id ON insurance_policies(carrier_id);
CREATE INDEX idx_insurance_policies_policy_type ON insurance_policies(policy_type);
CREATE INDEX idx_insurance_policies_effective_date ON insurance_policies(effective_date);

-- Benefits and red flags
CREATE INDEX idx_coverage_benefits_policy_id ON coverage_benefits(policy_id);
CREATE INDEX idx_coverage_benefits_category ON coverage_benefits(benefit_category);
CREATE INDEX idx_red_flags_policy_id ON red_flags(policy_id);
CREATE INDEX idx_red_flags_severity ON red_flags(severity);

-- Audit and monitoring
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```
