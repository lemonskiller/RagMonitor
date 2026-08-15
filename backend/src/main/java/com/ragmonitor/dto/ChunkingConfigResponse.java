package com.ragmonitor.dto;

import com.ragmonitor.entity.ChunkingConfigVersion;

import java.time.LocalDateTime;

public record ChunkingConfigResponse(
        Long id,
        Long documentId,
        int versionNumber,
        String strategy,
        int chunkSize,
        int overlap,
        int minChunkSize,
        int maxChunkSize,
        boolean preserveHeadings,
        boolean preserveTables,
        boolean parentChildEnabled,
        int parentChunkSize,
        String tokenizer,
        String separators,
        String status,
        LocalDateTime createdAt,
        LocalDateTime activatedAt,
        ChunkingJobResponse latestJob) {

    public static ChunkingConfigResponse from(
            ChunkingConfigVersion config,
            ChunkingJobResponse latestJob) {
        return new ChunkingConfigResponse(
                config.getId(),
                config.getDocumentId(),
                config.getVersionNumber(),
                config.getStrategy(),
                config.getChunkSize(),
                config.getOverlap(),
                config.getMinChunkSize(),
                config.getMaxChunkSize(),
                config.getPreserveHeadings(),
                config.getPreserveTables(),
                config.getParentChildEnabled(),
                config.getParentChunkSize(),
                config.getTokenizer(),
                config.getSeparators(),
                config.getStatus(),
                config.getCreatedAt(),
                config.getActivatedAt(),
                latestJob);
    }
}
