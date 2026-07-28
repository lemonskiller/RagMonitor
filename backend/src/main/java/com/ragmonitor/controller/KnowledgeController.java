package com.ragmonitor.controller;

import com.ragmonitor.entity.Document;
import com.ragmonitor.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final DocumentRepository documentRepository;

    @GetMapping("/documents")
    public Page<Document> listDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        if (keyword != null && !keyword.isEmpty()) {
            return new PageImpl<>(documentRepository.findByFileNameContainingIgnoreCase(keyword), pageable, 3);
        }
        return documentRepository.findAll(pageable);
    }

    @GetMapping("/documents/{id}")
    public Document getDocument(@PathVariable Long id) {
        return documentRepository.findById(id).orElseThrow();
    }

    @GetMapping("/documents/sample")
    public Document getSample() {
        long count = documentRepository.count();
        int random = (int) (Math.random() * count);
        return documentRepository.findAll(PageRequest.of(random, 1)).getContent().get(0);
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return Map.of(
            "totalDocuments", documentRepository.count(),
            "totalChunks", 162804,
            "currentIndex", "idx-024",
            "lastSync", "12 分钟前"
        );
    }
}
