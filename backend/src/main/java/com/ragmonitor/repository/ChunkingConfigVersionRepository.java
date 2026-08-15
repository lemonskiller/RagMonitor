package com.ragmonitor.repository;

import com.ragmonitor.entity.ChunkingConfigVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChunkingConfigVersionRepository extends JpaRepository<ChunkingConfigVersion, Long> {
    Optional<ChunkingConfigVersion> findFirstByDocumentIdOrderByVersionNumberDesc(Long documentId);

    Optional<ChunkingConfigVersion> findFirstByDocumentIdAndStatusOrderByVersionNumberDesc(
            Long documentId,
            String status);

    List<ChunkingConfigVersion> findByDocumentIdAndStatus(Long documentId, String status);

    @Query("select coalesce(max(c.versionNumber), 0) from ChunkingConfigVersion c where c.documentId = :documentId")
    int findMaxVersionNumber(@Param("documentId") Long documentId);
}
