package com.ragmonitor.service;

public final class ChunkingConfigRules {

    private ChunkingConfigRules() {
    }

    public static void validate(
            int chunkSize,
            int overlap,
            int minChunkSize,
            int maxChunkSize,
            int parentChunkSize) {
        if (chunkSize < 64) {
            throw new IllegalArgumentException("chunkSize must be at least 64");
        }
        if (overlap < 0 || overlap >= chunkSize) {
            throw new IllegalArgumentException("overlap must be smaller than chunkSize");
        }
        if (minChunkSize < 1 || minChunkSize > maxChunkSize) {
            throw new IllegalArgumentException("minChunkSize must not exceed maxChunkSize");
        }
        if (maxChunkSize < chunkSize) {
            throw new IllegalArgumentException("maxChunkSize must be at least chunkSize");
        }
        if (parentChunkSize < maxChunkSize) {
            throw new IllegalArgumentException("parentChunkSize must be at least maxChunkSize");
        }
    }
}
