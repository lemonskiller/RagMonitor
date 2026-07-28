package com.ragmonitor.repository;

import com.ragmonitor.entity.MemoryRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MemoryRuleRepository extends JpaRepository<MemoryRule, Long> {
    List<MemoryRule> findByStatusOrderByPriorityAsc(String status);
    List<MemoryRule> findByIntentMatch(String intentMatch);
}
