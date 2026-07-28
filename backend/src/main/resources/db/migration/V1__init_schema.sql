-- RAG Monitor 初始数据库 Schema

CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    source_path VARCHAR(500),
    parser_name VARCHAR(100),
    file_size BIGINT,
    page_count INT,
    chunk_count INT,
    process_status VARCHAR(50) DEFAULT 'PENDING',
    dedup_status VARCHAR(50) DEFAULT 'CLEAN',
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prompt_versions (
    id BIGSERIAL PRIMARY KEY,
    version_name VARCHAR(50) NOT NULL,
    component_name VARCHAR(100),
    content TEXT,
    token_count INT,
    status VARCHAR(20) DEFAULT 'DRAFT',
    description VARCHAR(500),
    updated_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memory_rules (
    id BIGSERIAL PRIMARY KEY,
    priority INT,
    rule_name VARCHAR(200) NOT NULL,
    intent_match VARCHAR(200),
    target_prompt VARCHAR(50),
    memory_type VARCHAR(20),
    memory_config VARCHAR(200),
    hit_rate DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_tasks (
    id BIGSERIAL PRIMARY KEY,
    task_name VARCHAR(300) NOT NULL,
    dataset_name VARCHAR(200),
    baseline_version VARCHAR(50),
    candidate_version VARCHAR(50),
    total_cases INT DEFAULT 0,
    score DOUBLE PRECISION,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trace_records (
    id BIGSERIAL PRIMARY KEY,
    trace_id VARCHAR(50) UNIQUE NOT NULL,
    query_text TEXT,
    answer_text TEXT,
    version_id VARCHAR(50),
    latency_ms BIGINT,
    input_tokens INT,
    output_tokens INT,
    score DOUBLE PRECISION,
    status VARCHAR(20),
    user_id VARCHAR(50),
    feedback VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_documents_status ON documents(process_status);
CREATE INDEX idx_documents_type ON documents(file_type);
CREATE INDEX idx_prompt_versions_component ON prompt_versions(component_name, updated_at DESC);
CREATE INDEX idx_memory_rules_status ON memory_rules(status, priority);
CREATE INDEX idx_trace_records_trace_id ON trace_records(trace_id);
CREATE INDEX idx_trace_records_created ON trace_records(created_at DESC);
