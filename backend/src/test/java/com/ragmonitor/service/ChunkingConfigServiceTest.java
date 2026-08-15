package com.ragmonitor.service;

import com.ragmonitor.dto.ChunkingConfigRequest;
import com.ragmonitor.entity.ChunkingConfigVersion;
import com.ragmonitor.entity.ChunkingRebuildJob;
import com.ragmonitor.repository.ChunkingConfigVersionRepository;
import com.ragmonitor.repository.ChunkingRebuildJobRepository;
import com.ragmonitor.repository.DocumentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChunkingConfigServiceTest {

    @Mock DocumentRepository documentRepository;
    @Mock ChunkingConfigVersionRepository configRepository;
    @Mock ChunkingRebuildJobRepository jobRepository;
    @Mock PrototypeChunkingRebuildWorker worker;
    @InjectMocks ChunkingConfigService service;

    @Test
    void readsTheActiveVersionWhileANewerVersionIsStillBuilding() {
        when(documentRepository.existsById(7L)).thenReturn(true);
        when(configRepository.findFirstByDocumentIdAndStatusOrderByVersionNumberDesc(7L, "ACTIVE"))
                .thenReturn(Optional.of(ChunkingConfigVersion.builder()
                        .id(40L)
                        .documentId(7L)
                        .versionNumber(3)
                        .strategy("STRUCTURE")
                        .chunkSize(512)
                        .overlap(80)
                        .minChunkSize(120)
                        .maxChunkSize(800)
                        .preserveHeadings(true)
                        .preserveTables(true)
                        .parentChildEnabled(true)
                        .parentChunkSize(1200)
                        .tokenizer("cl100k_base")
                        .status("ACTIVE")
                        .build()));

        var result = service.getConfiguration(7L);

        assertEquals(3, result.versionNumber());
        assertEquals("ACTIVE", result.status());
    }

    @Test
    void savesANewBuildingVersionAndQueuedJobBeforeDispatching() {
        when(documentRepository.existsById(7L)).thenReturn(true);
        when(configRepository.findMaxVersionNumber(7L)).thenReturn(3);
        when(configRepository.save(any())).thenAnswer(invocation -> {
            ChunkingConfigVersion config = invocation.getArgument(0);
            config.setId(41L);
            return config;
        });
        when(jobRepository.save(any())).thenAnswer(invocation -> {
            ChunkingRebuildJob job = invocation.getArgument(0);
            job.setId(99L);
            return job;
        });

        var result = service.updateConfiguration(7L, new ChunkingConfigRequest(
                "STRUCTURE", 512, 80, 120, 800,
                true, true, true, 1200, "cl100k_base", "\\n\\n|\\n"));

        ArgumentCaptor<ChunkingConfigVersion> configCaptor = ArgumentCaptor.forClass(ChunkingConfigVersion.class);
        verify(configRepository).save(configCaptor.capture());
        assertEquals(4, configCaptor.getValue().getVersionNumber());
        assertEquals("BUILDING", configCaptor.getValue().getStatus());
        assertEquals("QUEUED", result.status());
        assertEquals(99L, result.id());
        verify(worker).start(99L);
    }
}
