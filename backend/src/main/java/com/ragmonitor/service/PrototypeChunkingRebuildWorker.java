package com.ragmonitor.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PrototypeChunkingRebuildWorker {

    private final ChunkingJobProgressService progressService;

    @Async
    public void start(Long jobId) {
        try {
            advance(jobId, "VALIDATING", 12, "正在校验分块参数", 500);
            advance(jobId, "CHUNKING", 42, "正在生成新 Chunk 版本", 700);
            advance(jobId, "WRITING_DATABASE", 72, "正在写入新版本元数据", 700);
            advance(jobId, "PREPARING_INDEX", 90, "正在准备检索索引版本", 700);
            progressService.complete(jobId);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            progressService.fail(jobId, "Rebuild worker was interrupted");
        } catch (RuntimeException exception) {
            progressService.fail(jobId, exception.getMessage());
        }
    }

    private void advance(Long jobId, String stage, int progress, String message, long delayMs)
            throws InterruptedException {
        progressService.update(jobId, stage, progress, message);
        Thread.sleep(delayMs);
    }
}
