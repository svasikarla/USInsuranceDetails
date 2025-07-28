# 📊 Mermaid Diagrams - US Insurance Policy Platform

This directory contains comprehensive Mermaid diagrams that visualize all aspects of the US Insurance Policy Platform architecture, workflows, and development plan.

## 📋 Diagram Index

### 1. [System Architecture Overview](./system-architecture.md)
**Purpose**: Complete system architecture with all layers and components
- **Frontend Layer**: Next.js UI components and user interfaces
- **API Gateway**: FastAPI with middleware and validation
- **Backend Services**: Microservices for auth, documents, processing, analysis
- **Processing Pipeline**: Document processing workflow with queue management
- **External APIs**: Insurance carrier integrations
- **Data Layer**: PostgreSQL, file storage, caching, and audit logs
- **Monitoring**: Prometheus metrics, alerting, and health monitoring

**Use Cases**:
- Technical architecture discussions
- System design reviews
- Developer onboarding
- Infrastructure planning

### 2. [Document Processing Workflow](./document-processing-workflow.md)
**Purpose**: Step-by-step document processing pipeline from upload to completion
- **File Validation**: Type, size, and security checks
- **Text Extraction**: PyPDF2 and OCR processing with confidence scoring
- **Structure Detection**: Policy section identification and parsing
- **Data Extraction**: Structured data extraction with validation
- **Red Flag Analysis**: Automated issue detection and severity classification
- **Quality Assurance**: Confidence scoring and manual review triggers

**Use Cases**:
- Processing pipeline implementation
- Error handling design
- Quality assurance planning
- Performance optimization

### 3. [Database Entity Relationship Diagram](./database-erd.md)
**Purpose**: Complete database schema with relationships and constraints
- **8 Core Tables**: Users, carriers, documents, policies, benefits, red flags, comparisons, audit logs
- **Relationships**: Foreign keys and cardinality specifications
- **Indexes**: Performance optimization indexes
- **Data Types**: Detailed field specifications with constraints

**Use Cases**:
- Database schema implementation
- Data model discussions
- Query optimization
- Migration planning

### 4. [User Journey & Workflow](./user-journey.md)
**Purpose**: End-to-end user experience from registration to decision making
- **Registration & Setup**: Account creation and profile completion
- **Document Upload**: File selection and upload process
- **Processing & Analysis**: Automated document analysis
- **Review & Insights**: Results examination and red flag review
- **Comparison & Decision**: Policy comparison and decision making
- **Ongoing Management**: Monitoring and report generation

**Use Cases**:
- UX/UI design planning
- User testing scenarios
- Feature prioritization
- Customer journey optimization

### 5. [Sprint Timeline & Dependencies](./sprint-timeline.md)
**Purpose**: 8-week MVP development timeline with task dependencies
- **Sprint 1**: Foundation (infrastructure, auth, upload, text extraction)
- **Sprint 2**: Core Processing (OCR, structure detection, API integration)
- **Sprint 3**: Analysis Features (red flags, viewer, search, comparison)
- **Sprint 4**: Polish & Launch (design, optimization, production deployment)

**Use Cases**:
- Sprint planning sessions
- Resource allocation
- Dependency management
- Progress tracking

### 6. [API Integration Flow](./api-integration-flow.md)
**Purpose**: Detailed API interactions and sequence flows
- **Authentication Flow**: JWT validation and user context
- **Document Upload**: Secure upload with immediate feedback
- **Async Processing**: Queue management and progress tracking
- **Carrier API Integration**: External API calls and fallback logic
- **Real-time Notifications**: WebSocket status updates
- **Policy Comparison**: Data retrieval and comparison generation

**Use Cases**:
- API design and implementation
- Frontend/backend integration
- Error handling design
- Performance optimization

## 🎯 How to Use These Diagrams

### For Development Teams

#### Backend Developers
- **Start with**: [System Architecture](./system-architecture.md) for overall structure
- **Reference**: [Database ERD](./database-erd.md) for schema implementation
- **Follow**: [Document Processing Workflow](./document-processing-workflow.md) for pipeline logic
- **Implement**: [API Integration Flow](./api-integration-flow.md) for endpoint design

#### Frontend Developers
- **Start with**: [User Journey](./user-journey.md) for UX understanding
- **Reference**: [System Architecture](./system-architecture.md) for component structure
- **Follow**: [API Integration Flow](./api-integration-flow.md) for API consumption
- **Track**: [Sprint Timeline](./sprint-timeline.md) for feature delivery

#### Full-Stack Developers
- **Overview**: [System Architecture](./system-architecture.md) for complete picture
- **Plan**: [Sprint Timeline](./sprint-timeline.md) for task prioritization
- **Implement**: All diagrams as comprehensive reference

### For Project Management

#### Sprint Planning
1. **Review**: [Sprint Timeline](./sprint-timeline.md) for task breakdown
2. **Assess**: Dependencies and critical path analysis
3. **Allocate**: Resources based on skill requirements
4. **Track**: Progress against timeline milestones

#### Stakeholder Communication
1. **Present**: [System Architecture](./system-architecture.md) for technical overview
2. **Explain**: [User Journey](./user-journey.md) for user value
3. **Show**: [Sprint Timeline](./sprint-timeline.md) for delivery schedule
4. **Demonstrate**: [Document Processing Workflow](./document-processing-workflow.md) for core functionality

### For Quality Assurance

#### Test Planning
1. **Map**: [User Journey](./user-journey.md) to test scenarios
2. **Validate**: [Document Processing Workflow](./document-processing-workflow.md) edge cases
3. **Verify**: [API Integration Flow](./api-integration-flow.md) error handling
4. **Check**: [Database ERD](./database-erd.md) data integrity

#### Performance Testing
1. **Target**: Response times from [API Integration Flow](./api-integration-flow.md)
2. **Load Test**: Processing pipeline from [Document Processing Workflow](./document-processing-workflow.md)
3. **Monitor**: System components from [System Architecture](./system-architecture.md)

## 🔄 Diagram Maintenance

### Update Schedule
- **Weekly**: Sprint timeline progress updates
- **Sprint End**: User journey satisfaction scores
- **Monthly**: Architecture refinements based on learnings
- **Release**: Database schema changes and API updates

### Version Control
- **File Naming**: Include version numbers for major changes
- **Change Log**: Document significant diagram updates
- **Review Process**: Team review for architectural changes
- **Approval**: Stakeholder sign-off for major modifications

### Integration with Development
- **Code Comments**: Reference relevant diagrams in code
- **Documentation**: Link diagrams in technical specifications
- **Reviews**: Use diagrams in code review discussions
- **Onboarding**: Include diagrams in developer orientation

## 📚 Additional Resources

### Mermaid Documentation
- [Mermaid Official Documentation](https://mermaid-js.github.io/mermaid/)
- [Mermaid Live Editor](https://mermaid.live/)
- [GitHub Mermaid Support](https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/)

### Diagram Tools
- **VS Code Extension**: Mermaid Preview
- **Online Editor**: Mermaid Live Editor for quick edits
- **Export Options**: PNG, SVG, PDF formats available
- **Integration**: GitHub, GitLab, Notion support

### Best Practices
- **Simplicity**: Keep diagrams focused and readable
- **Consistency**: Use consistent naming and styling
- **Updates**: Keep diagrams current with implementation
- **Accessibility**: Include alt text and descriptions

## 🎨 Diagram Styling Guide

### Color Coding
- **Frontend Components**: Light blue (#e1f5fe)
- **Backend Services**: Light purple (#f3e5f5)
- **Data Layer**: Light green (#e8f5e8)
- **External APIs**: Light orange (#fff3e0)
- **Monitoring**: Light pink (#fce4ec)

### Naming Conventions
- **Components**: PascalCase (e.g., AuthService)
- **Processes**: Descriptive phrases (e.g., "Extract Text")
- **Data**: Noun phrases (e.g., "Policy Documents")
- **Actions**: Verb phrases (e.g., "Validate Token")

### Diagram Standards
- **Flow Direction**: Top to bottom or left to right
- **Grouping**: Related components in subgraphs
- **Relationships**: Clear arrows with descriptive labels
- **Complexity**: Break complex diagrams into focused views

---

These diagrams serve as the visual foundation for the US Insurance Policy Platform development. They provide clear guidance for implementation, facilitate team communication, and ensure alignment between technical design and business requirements.

For questions or updates to these diagrams, please contact the development team or create an issue in the project repository.
