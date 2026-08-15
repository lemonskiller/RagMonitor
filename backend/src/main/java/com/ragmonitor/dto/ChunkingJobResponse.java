package com.ragmonitor.dto;

import com.ragmonitor.entity.ChunkingRebuildJob;

import java.time.LocalDateTime;

public record ChunkingJobResponse(
        Long id,
        Long documentId,
        Long configVersionId,
        String status,
        String stage,
        int progress,
        String message,
        String errorMessage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime completedAt) {

    public static ChunkingJobResponse from(ChunkingRebuildJob job) {
        return new ChunkingJobResponse(
                job.getId(),
                job.getDocumentId(),
                job.getConfigVersionId(),
                job.getStatus(),
                job.getStage(),
                job.getProgress(),
                job.getMessage(),
                job.getErrorMessage(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                job.getCompletedAt());
    }
}
