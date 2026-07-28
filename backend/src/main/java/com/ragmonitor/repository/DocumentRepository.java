package com.ragmonitor.repository;

import com.ragmonitor.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByProcessStatus(String status);
    List<Document> findByFileType(String fileType);
    List<Document> findByFileNameContainingIgnoreCase(String keyword);
}
