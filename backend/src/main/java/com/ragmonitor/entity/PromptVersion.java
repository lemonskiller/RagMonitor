package com.ragmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "prompt_versions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PromptVersion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String versionName; // prompt-v12

    @Column(length = 100)
    private String componentName; // system, user, format

    @Column(columnDefinition = "TEXT")
    private String content;

    private Integer tokenCount;

    @Column(length = 20)
    private String status; // DRAFT, ONLINE, ARCHIVED

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String updatedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist void prePersist() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void preUpdate() { updatedAt = LocalDateTime.now(); }
}
