package com.ragmonitor.service;

import com.ragmonitor.entity.ChunkingConfigVersion;
import com.ragmonitor.entity.ChunkingRebuildJob;
import com.ragmonitor.repository.ChunkingConfigVersionRepository;
import com.ragmonitor.repository.ChunkingRebuildJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChunkingJobProgressService {

    private final ChunkingRebuildJobRepository jobRepository;
    private final ChunkingConfigVersionRepository configRepository;

    @Transactional
    public void update(Long jobId, String stage, int progress, String message) {
        ChunkingRebuildJob job = jobRepository.findById(jobId).orElseThrow();
        job.setStatus("RUNNING");
        job.setStage(stage);
        job.setProgress(progress);
        job.setMessage(message);
        jobRepository.save(job);
    }

    @Transactional
    public void complete(Long jobId) {
        ChunkingRebuildJob job = jobRepository.findById(jobId).orElseThrow();
        ChunkingConfigVersion config = configRepository.findById(job.getConfigVersionId()).orElseThrow();

        configRepository.findByDocumentIdAndStatus(job.getDocumentId(), "ACTIVE")
                .forEach(activeConfig -> {
                    activeConfig.setStatus("SUPERSEDED");
                    configRepository.save(activeConfig);
                });

        config.setStatus("ACTIVE");
        config.setActivatedAt(LocalDateTime.now());
        configRepository.save(config);

        job.setStatus("COMPLETED");
        job.setStage("COMPLETED");
        job.setProgress(100);
        job.setMessage("新分块配置版本已生效");
        job.setCompletedAt(LocalDateTime.now());
        jobRepository.save(job);
    }

    @Transactional
    public void fail(Long jobId, String errorMessage) {
        ChunkingRebuildJob job = jobRepository.findById(jobId).orElseThrow();
        job.setStatus("FAILED");
        job.setStage("FAILED");
        job.setMessage("重建任务失败，当前线上版本保持不变");
        job.setErrorMessage(errorMessage);
        job.setCompletedAt(LocalDateTime.now());
        jobRepository.save(job);

        configRepository.findById(job.getConfigVersionId()).ifPresent(config -> {
            config.setStatus("FAILED");
            configRepository.save(config);
        });
    }
}
