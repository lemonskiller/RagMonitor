package com.ragmonitor.controller;

import com.ragmonitor.entity.PromptVersion;
import com.ragmonitor.repository.PromptVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prompts")
@RequiredArgsConstructor
public class PromptController {

    private final PromptVersionRepository repository;

    @GetMapping("/versions")
    public List<PromptVersion> listVersions(@RequestParam(required = false) String component) {
        if (component != null) {
            return repository.findByComponentNameOrderByUpdatedAtDesc(component);
        }
        return repository.findAll();
    }

    @GetMapping("/components/{component}")
    public List<PromptVersion> getComponentVersions(@PathVariable String component) {
        return repository.findByComponentNameOrderByUpdatedAtDesc(component);
    }

    @PutMapping("/components/{id}")
    public PromptVersion updateComponent(@PathVariable Long id, @RequestBody PromptVersion updated) {
        PromptVersion pv = repository.findById(id).orElseThrow();
        pv.setContent(updated.getContent());
        pv.setTokenCount(updated.getTokenCount());
        return repository.save(pv);
    }
}
