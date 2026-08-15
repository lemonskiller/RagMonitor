package com.ragmonitor.repository;

import com.ragmonitor.entity.ChunkingRebuildJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChunkingRebuildJobRepository extends JpaRepository<ChunkingRebuildJob, Long> {
    Optional<ChunkingRebuildJob> findFirstByDocumentIdOrderByCreatedAtDesc(Long documentId);
}
