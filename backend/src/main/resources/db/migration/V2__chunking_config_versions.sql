-- Versioned chunking configuration and asynchronous rebuild progress.

CREATE TABLE IF NOT EXISTS chunking_config_versions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    strategy VARCHAR(40) NOT NULL,
    chunk_size INT NOT NULL,
    overlap INT NOT NULL,
    min_chunk_size INT NOT NULL,
    max_chunk_size INT NOT NULL,
    preserve_headings BOOLEAN NOT NULL DEFAULT TRUE,
    preserve_tables BOOLEAN NOT NULL DEFAULT TRUE,
    parent_child_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    parent_chunk_size INT NOT NULL,
    tokenizer VARCHAR(100) NOT NULL,
    separators TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMP,
    CONSTRAINT uq_chunking_config_version UNIQUE (document_id, version_number)
);

CREATE TABLE IF NOT EXISTS chunking_rebuild_jobs (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    config_version_id BIGINT NOT NULL REFERENCES chunking_config_versions(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    stage VARCHAR(40) NOT NULL DEFAULT 'QUEUED',
    progress INT NOT NULL DEFAULT 0,
    message VARCHAR(500),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    CONSTRAINT ck_chunking_job_progress CHECK (progress >= 0 AND progress <= 100)
);

CREATE INDEX idx_chunking_config_document ON chunking_config_versions(document_id, version_number DESC);
CREATE INDEX idx_chunking_config_status ON chunking_config_versions(document_id, status);
CREATE INDEX idx_chunking_job_document ON chunking_rebuild_jobs(document_id, created_at DESC);
CREATE INDEX idx_chunking_job_status ON chunking_rebuild_jobs(status, updated_at DESC);

INSERT INTO documents (
    file_name, file_type, source_path, parser_name, chunk_count,
    process_status, dedup_status, updated_at, created_at
)
SELECT 'LLPS_review_2025.pdf', 'PDF', 'phase-prod/papers', 'PDF Layout v3', 684,
       'INGESTED', 'CLEAN', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM documents WHERE file_name = 'LLPS_review_2025.pdf');

INSERT INTO documents (
    file_name, file_type, source_path, parser_name, chunk_count,
    process_status, dedup_status, updated_at, created_at
)
SELECT 'PNAS-2016-E4321.pdf', 'PDF', 'phase-prod/papers', 'PDF Layout v3', 72,
       'INGESTED', 'CLEAN', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM documents WHERE file_name = 'PNAS-2016-E4321.pdf');

INSERT INTO chunking_config_versions (
    document_id, version_number, strategy, chunk_size, overlap,
    min_chunk_size, max_chunk_size, preserve_headings, preserve_tables,
    parent_child_enabled, parent_chunk_size, tokenizer, separators, status, activated_at
)
SELECT id, 1, 'STRUCTURE', 512, 80, 120, 800, TRUE, TRUE, TRUE, 1200,
       'cl100k_base', E'\\n## |\\n### |\\n\\n|\\n|。', 'ACTIVE', NOW()
FROM documents d
WHERE d.file_name IN ('LLPS_review_2025.pdf', 'PNAS-2016-E4321.pdf')
  AND NOT EXISTS (
      SELECT 1 FROM chunking_config_versions c WHERE c.document_id = d.id
  );
