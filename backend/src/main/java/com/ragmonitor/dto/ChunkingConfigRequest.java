package com.ragmonitor.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ChunkingConfigRequest(
        @NotBlank
        @Pattern(regexp = "STRUCTURE|FIXED_LENGTH|RECURSIVE|SEMANTIC")
        String strategy,
        @Min(64) int chunkSize,
        @Min(0) int overlap,
        @Min(1) int minChunkSize,
        @Min(64) int maxChunkSize,
        @NotNull Boolean preserveHeadings,
        @NotNull Boolean preserveTables,
        @NotNull Boolean parentChildEnabled,
        @Min(64) int parentChunkSize,
        @NotBlank String tokenizer,
        String separators) {
}
