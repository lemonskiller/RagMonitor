package com.ragmonitor.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "chunking_config_versions",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_chunking_config_version",
                columnNames = {"document_id", "version_number"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChunkingConfigVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(nullable = false, length = 40)
    private String strategy;

    @Column(name = "chunk_size", nullable = false)
    private Integer chunkSize;

    @Column(nullable = false)
    private Integer overlap;

    @Column(name = "min_chunk_size", nullable = false)
    private Integer minChunkSize;

    @Column(name = "max_chunk_size", nullable = false)
    private Integer maxChunkSize;

    @Column(name = "preserve_headings", nullable = false)
    private Boolean preserveHeadings;

    @Column(name = "preserve_tables", nullable = false)
    private Boolean preserveTables;

    @Column(name = "parent_child_enabled", nullable = false)
    private Boolean parentChildEnabled;

    @Column(name = "parent_chunk_size", nullable = false)
    private Integer parentChunkSize;

    @Column(nullable = false, length = 100)
    private String tokenizer;

    @Column(columnDefinition = "TEXT")
    private String separators;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
