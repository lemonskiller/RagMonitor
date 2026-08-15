import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SAMPLE_SIZE,
  getKnowledgeDocument,
  getKnowledgeDocumentDetails,
  KNOWLEDGE_DOCUMENTS,
  normalizeSampleSize,
} from "../src/pages/Knowledge/Knowledge.data.ts";

test("knowledge documents expose the complete dialog detail contract", () => {
  assert.equal(KNOWLEDGE_DOCUMENTS.length, 2);
  assert.deepEqual(getKnowledgeDocument("LLPS_review_2025.pdf"), {
    id: 1,
    name: "LLPS_review_2025.pdf",
    source: "phase-prod/papers",
    parser: "PDF Layout v3",
    chunks: 684,
    duplicateStatus: "无重复",
    ingestStatus: "已入库",
    updatedAt: "12 分钟前",
    previewStatus: "not-mounted",
  });
  assert.equal(getKnowledgeDocument("PNAS-2016-E4321.pdf")?.chunks, 72);
});

test("knowledge documents declare whether the complete PDF is mounted", () => {
  assert.equal(getKnowledgeDocument("LLPS_review_2025.pdf")?.previewStatus, "not-mounted");
  assert.equal(getKnowledgeDocument("LLPS_review_2025.pdf")?.previewUrl, undefined);
});

test("each PDF exposes inspectable parsing, chunk and multimodal records", () => {
  const details = getKnowledgeDocumentDetails("LLPS_review_2025.pdf");

  assert.equal(details?.parsing.blocks[0]?.id, "BLK-P012-04");
  assert.equal(details?.chunks[0]?.tokens, 318);
  assert.equal(details?.multimodal[0]?.type, "figure");
});

test("random sampling accepts editable positive integers and defaults invalid input to ten", () => {
  assert.equal(DEFAULT_SAMPLE_SIZE, 10);
  assert.equal(normalizeSampleSize("37"), 37);
  assert.equal(normalizeSampleSize("12.8"), 12);
  assert.equal(normalizeSampleSize("0"), 10);
  assert.equal(normalizeSampleSize(""), 10);
});
