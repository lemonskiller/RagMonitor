package com.ragmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String fileName;

    @Column(nullable = false, length = 100)
    private String fileType; // PDF, JSON, CSV, XLSX

    @Column(length = 500)
    private String sourcePath;

    @Column(length = 100)
    private String parserName; // PDF Layout v3, JSON Lines, etc.

    private Long fileSize;
    private Integer pageCount;
    private Integer chunkCount;

    @Column(length = 50)
    private String processStatus; // INGESTED, FAILED, PENDING

    @Column(length = 50)
    private String dedupStatus; // CLEAN, DUPLICATE_PENDING

    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;

    @PrePersist void prePersist() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void preUpdate() { updatedAt = LocalDateTime.now(); }
}
