# System Architecture Overview

This diagram shows the complete system architecture for the US Insurance Policy Platform, including all layers and their interactions.

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js UI]
        Auth[Authentication]
        Upload[Document Upload]
        Viewer[Policy Viewer]
        Compare[Comparison Tool]
        Dashboard[Analytics Dashboard]
    end
    
    subgraph "API Gateway"
        Gateway[FastAPI Gateway]
        Middleware[Auth Middleware]
        RateLimit[Rate Limiting]
        Validation[Request Validation]
    end
    
    subgraph "Backend Services"
        AuthService[Auth Service]
        DocService[Document Service]
        ProcessService[Processing Service]
        AnalysisService[Analysis Service]
        NotificationService[Notification Service]
    end
    
    subgraph "Processing Pipeline"
        Queue[Processing Queue]
        Extractor[Text Extractor]
        OCR[OCR Engine]
        Parser[Structure Parser]
        Analyzer[Red Flag Analyzer]
    end
    
    subgraph "External APIs"
        BCBS[Blue Cross API]
        Aetna[Aetna API]
        Cigna[Cigna API]
        Other[Other Carriers]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        FileStore[File Storage]
        Cache[Redis Cache]
        Logs[Audit Logs]
    end
    
    subgraph "Monitoring"
        Metrics[Prometheus]
        Alerts[Alert Manager]
        Monitor[Health Monitor]
    end
    
    %% Frontend connections
    UI --> Gateway
    Auth --> AuthService
    Upload --> DocService
    Viewer --> AnalysisService
    Compare --> AnalysisService
    Dashboard --> AnalysisService
    
    %% Gateway connections
    Gateway --> Middleware
    Middleware --> RateLimit
    RateLimit --> Validation
    Validation --> AuthService
    Validation --> DocService
    Validation --> ProcessService
    Validation --> AnalysisService
    
    %% Service connections
    DocService --> Queue
    ProcessService --> Queue
    Queue --> Extractor
    Extractor --> OCR
    OCR --> Parser
    Parser --> Analyzer
    Analyzer --> NotificationService
    
    %% External API connections
    ProcessService --> BCBS
    ProcessService --> Aetna
    ProcessService --> Cigna
    ProcessService --> Other
    
    %% Data connections
    AuthService --> DB
    DocService --> DB
    DocService --> FileStore
    ProcessService --> DB
    AnalysisService --> DB
    AnalysisService --> Cache
    
    %% Monitoring connections
    Gateway --> Metrics
    ProcessService --> Metrics
    AnalysisService --> Metrics
    Metrics --> Alerts
    Monitor --> Alerts
    
    %% Styling
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef external fill:#fff3e0
    classDef monitoring fill:#fce4ec
    
    class UI,Auth,Upload,Viewer,Compare,Dashboard frontend
    class Gateway,Middleware,RateLimit,Validation,AuthService,DocService,ProcessService,AnalysisService,NotificationService backend
    class DB,FileStore,Cache,Logs data
    class BCBS,Aetna,Cigna,Other external
    class Metrics,Alerts,Monitor monitoring
```

## Architecture Components

### Frontend Layer
- **Next.js UI**: Main user interface built with React and TypeScript
- **Authentication**: User login/logout and session management
- **Document Upload**: File upload interface with drag-and-drop
- **Policy Viewer**: Document and policy data visualization
- **Comparison Tool**: Side-by-side policy comparison interface
- **Analytics Dashboard**: Metrics and reporting interface

### API Gateway
- **FastAPI Gateway**: Main API entry point with automatic documentation
- **Auth Middleware**: JWT token validation and user context
- **Rate Limiting**: API usage throttling and abuse prevention
- **Request Validation**: Input validation and sanitization

### Backend Services
- **Auth Service**: User authentication and authorization
- **Document Service**: File upload, storage, and metadata management
- **Processing Service**: Document processing orchestration
- **Analysis Service**: Policy analysis and comparison logic
- **Notification Service**: Real-time user notifications

### Processing Pipeline
- **Processing Queue**: Async job queue for document processing
- **Text Extractor**: PDF text extraction using PyPDF2
- **OCR Engine**: Tesseract OCR for scanned documents
- **Structure Parser**: Policy structure detection and parsing
- **Red Flag Analyzer**: Automated red flag detection

### External APIs
- **Insurance Carrier APIs**: Direct integration with carrier systems
- **Blue Cross API**: Blue Cross Blue Shield integration
- **Aetna API**: Aetna carrier integration
- **Cigna API**: Cigna carrier integration
- **Other Carriers**: Additional carrier integrations

### Data Layer
- **PostgreSQL**: Primary database for structured data
- **File Storage**: Document and file storage (Supabase/S3)
- **Redis Cache**: Performance caching layer
- **Audit Logs**: Security and compliance logging

### Monitoring
- **Prometheus**: Metrics collection and storage
- **Alert Manager**: Alert routing and notification
- **Health Monitor**: System health and uptime monitoring
