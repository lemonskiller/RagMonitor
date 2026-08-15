import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_CHUNKING_CONFIG,
  validateChunkingConfig,
} from "../src/pages/Knowledge/chunking.ts";

test("chunking configuration enforces relationships before saving", () => {
  assert.deepEqual(validateChunkingConfig(DEFAULT_CHUNKING_CONFIG), []);
  assert.deepEqual(
    validateChunkingConfig({ ...DEFAULT_CHUNKING_CONFIG, overlap: 512 }),
    ["Overlap 必须小于 Chunk 长度"],
  );
  assert.deepEqual(
    validateChunkingConfig({ ...DEFAULT_CHUNKING_CONFIG, minChunkSize: 900 }),
    ["最小长度不能大于最大长度"],
  );
});
