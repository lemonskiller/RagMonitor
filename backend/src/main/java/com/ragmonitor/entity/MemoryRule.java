package com.ragmonitor.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "memory_rules")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MemoryRule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer priority;

    @Column(nullable = false, length = 200)
    private String ruleName;

    @Column(length = 200)
    private String intentMatch; // mechanism_explanation, single_fact_lookup

    @Column(length = 50)
    private String targetPrompt; // prompt-v12

    @Column(length = 20)
    private String memoryType; // SHORT, LONG

    @Column(length = 200)
    private String memoryConfig; // "最近 3 轮", "完整历史"

    private Double hitRate;

    @Column(length = 20)
    private String status; // ACTIVE, GRAY, INACTIVE

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist void prePersist() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void preUpdate() { updatedAt = LocalDateTime.now(); }
}
