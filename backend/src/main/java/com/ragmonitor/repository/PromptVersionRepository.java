package com.ragmonitor.repository;

import com.ragmonitor.entity.PromptVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PromptVersionRepository extends JpaRepository<PromptVersion, Long> {
    List<PromptVersion> findByComponentNameOrderByUpdatedAtDesc(String componentName);
    Optional<PromptVersion> findByVersionName(String versionName);
    List<PromptVersion> findByStatus(String status);
}
