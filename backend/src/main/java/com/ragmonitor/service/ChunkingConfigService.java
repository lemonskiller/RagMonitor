package com.ragmonitor.service;

import com.ragmonitor.dto.ChunkingConfigRequest;
import com.ragmonitor.dto.ChunkingConfigResponse;
import com.ragmonitor.dto.ChunkingJobResponse;
import com.ragmonitor.entity.ChunkingConfigVersion;
import com.ragmonitor.entity.ChunkingRebuildJob;
import com.ragmonitor.repository.ChunkingConfigVersionRepository;
import com.ragmonitor.repository.ChunkingRebuildJobRepository;
import com.ragmonitor.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ChunkingConfigService {

    private final DocumentRepository documentRepository;
    private final ChunkingConfigVersionRepository configRepository;
    private final ChunkingRebuildJobRepository jobRepository;
    private final PrototypeChunkingRebuildWorker worker;

    @Transactional(readOnly = true)
    public ChunkingConfigResponse getConfiguration(Long documentId) {
        requireDocument(documentId);
        ChunkingConfigVersion config = configRepository
                .findFirstByDocumentIdAndStatusOrderByVersionNumberDesc(documentId, "ACTIVE")
                .or(() -> configRepository.findFirstByDocumentIdOrderByVersionNumberDesc(documentId))
                .orElseGet(() -> defaultConfiguration(documentId));
        ChunkingJobResponse latestJob = jobRepository
                .findFirstByDocumentIdOrderByCreatedAtDesc(documentId)
                .map(ChunkingJobResponse::from)
                .orElse(null);
        return ChunkingConfigResponse.from(config, latestJob);
    }

    @Transactional
    public ChunkingJobResponse updateConfiguration(Long documentId, ChunkingConfigRequest request) {
        requireDocument(documentId);
        try {
            ChunkingConfigRules.validate(
                    request.chunkSize(),
                    request.overlap(),
                    request.minChunkSize(),
                    request.maxChunkSize(),
                    request.parentChunkSize());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage(), exception);
        }

        ChunkingConfigVersion config = configRepository.save(ChunkingConfigVersion.builder()
                .documentId(documentId)
                .versionNumber(configRepository.findMaxVersionNumber(documentId) + 1)
                .strategy(request.strategy())
                .chunkSize(request.chunkSize())
                .overlap(request.overlap())
                .minChunkSize(request.minChunkSize())
                .maxChunkSize(request.maxChunkSize())
                .preserveHeadings(request.preserveHeadings())
                .preserveTables(request.preserveTables())
                .parentChildEnabled(request.parentChildEnabled())
                .parentChunkSize(request.parentChunkSize())
                .tokenizer(request.tokenizer())
                .separators(request.separators())
                .status("BUILDING")
                .build());

        ChunkingRebuildJob job = jobRepository.save(ChunkingRebuildJob.builder()
                .documentId(documentId)
                .configVersionId(config.getId())
                .status("QUEUED")
                .stage("QUEUED")
                .progress(0)
                .message("配置已写入数据库，等待重建任务")
                .build());

        dispatchAfterCommit(job.getId());
        return ChunkingJobResponse.from(job);
    }

    @Transactional(readOnly = true)
    public ChunkingJobResponse getJob(Long jobId) {
        return jobRepository.findById(jobId)
                .map(ChunkingJobResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chunking job not found"));
    }

    private void dispatchAfterCommit(Long jobId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    worker.start(jobId);
                }
            });
            return;
        }
        worker.start(jobId);
    }

    private void requireDocument(Long documentId) {
        if (!documentRepository.existsById(documentId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found");
        }
    }

    private ChunkingConfigVersion defaultConfiguration(Long documentId) {
        return ChunkingConfigVersion.builder()
                .documentId(documentId)
                .versionNumber(0)
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
                .separators("\\n## |\\n### |\\n\\n|\\n|。")
                .status("DRAFT")
                .build();
    }
}
