package com.ragmonitor.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ChunkingConfigRulesTest {

    @Test
    void validatesChunkSizeRelationships() {
        assertDoesNotThrow(() -> ChunkingConfigRules.validate(512, 80, 120, 800, 1200));
        assertThrows(IllegalArgumentException.class,
                () -> ChunkingConfigRules.validate(256, 256, 120, 800, 1200));
        assertThrows(IllegalArgumentException.class,
                () -> ChunkingConfigRules.validate(512, 80, 900, 800, 1200));
        assertThrows(IllegalArgumentException.class,
                () -> ChunkingConfigRules.validate(512, 80, 120, 800, 700));
    }
}
