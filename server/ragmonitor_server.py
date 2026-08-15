from __future__ import annotations

import json
import mimetypes
import os
import re
import sqlite3
import subprocess
import tarfile
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(os.environ.get("RAGMONITOR_STATIC_ROOT", "/home/wuxinze/others/RagMonitor/dist")).resolve()
PHASEAGENT_ROOT = Path(
    os.environ.get("PHASEAGENT_PROJECT_ROOT", "/nfs/wxz/others/codex-work-dir/phaseagent-0.6.0-internal")
).resolve()
RELEASE_ROOT = Path(
    os.environ.get("PHASEAGENT_RELEASE_ROOT", "/home/wuxinze/others/RagMonitor/cache/phaseagent-release/phaseagent-0.6.0")
).resolve()
SDB_SQLITE = Path(
    os.environ.get("PHASEAGENT_SDB_SQLITE", "/home/wuxinze/others/RagMonitor/cache/phaseagent-sdb/source_db_index.sqlite3")
).resolve()
DEFAULT_CHUNKING_CONFIG = {
    "strategy": "STRUCTURE",
    "chunkSize": 512,
    "overlap": 80,
    "minChunkSize": 120,
    "maxChunkSize": 800,
    "preserveHeadings": True,
    "preserveTables": True,
    "parentChildEnabled": True,
    "parentChunkSize": 1200,
    "tokenizer": "cl100k_base",
    "separators": "\\n## |\\n### |\\n\\n|\\n|。",
}
CHUNKING_CONFIGS: dict[int, dict] = {}
CHUNKING_JOBS: dict[int, dict] = {}
FIELD_STATS_CACHE: dict[str, list[dict]] = {}
NEXT_JOB_ID = 1
PUBLIC_BASE_PATH = os.environ.get("RAGMONITOR_BASE_PATH", "/agent-monitor").strip()
if PUBLIC_BASE_PATH and not PUBLIC_BASE_PATH.startswith("/"):
    PUBLIC_BASE_PATH = f"/{PUBLIC_BASE_PATH}"
PUBLIC_BASE_PATH = PUBLIC_BASE_PATH.rstrip("/")


def format_bytes(value: int | None) -> str:
    if value is None:
        return "-"
    units = ["B", "KB", "MB", "GB", "TB"]
    size = float(value)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:.2f} {unit}" if unit != "B" else f"{int(size)} B"
        size /= 1024
    return f"{value} B"


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def ensure_release_cache() -> None:
    skills_root = RELEASE_ROOT / "skills/.agents/skills"
    if skills_root.exists():
        return
    archive = PHASEAGENT_ROOT / "phaseagent-0.6.0.tar.gz"
    if not archive.exists():
        return
    RELEASE_ROOT.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive, "r:gz") as tar:
        tar.extractall(RELEASE_ROOT.parent)


def ensure_sdb_cache() -> None:
    if SDB_SQLITE.exists():
        return
    archive = PHASEAGENT_ROOT / "phaseagent-sdb-v2.0.0.tar.zst"
    if not archive.exists():
        return
    SDB_SQLITE.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "bash",
        "-lc",
        "zstd -dc \"$1\" | tar -xOf - db/source_databases/v2.0.0/source_db_index.sqlite3 > \"$2\"",
        "extract-sdb",
        str(archive),
        str(SDB_SQLITE),
    ]
    subprocess.run(command, check=True)


def read_text(path: Path, limit: int = 20000) -> str:
    if not path.exists():
        return ""
    text = path.read_text(encoding="utf-8", errors="replace")
    return text[:limit]


def parse_front_matter(text: str) -> tuple[dict[str, str], str]:
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    raw = text[3:end].strip()
    body = text[end + 4 :].lstrip()
    meta: dict[str, str] = {}
    for line in raw.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip().strip('"').strip("'")
    return meta, body


def first_heading(body: str) -> str:
    for line in body.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return ""


def extract_section(body: str, heading: str, limit: int = 900) -> str:
    pattern = re.compile(rf"^##\s+{re.escape(heading)}\s*$", re.IGNORECASE | re.MULTILINE)
    match = pattern.search(body)
    if not match:
        return ""
    tail = body[match.end() :].strip()
    next_heading = re.search(r"^##\s+", tail, flags=re.MULTILINE)
    section = tail[: next_heading.start()].strip() if next_heading else tail
    return section[:limit]


def permission_requirements(meta: dict[str, str], body: str) -> list[str]:
    checks: list[str] = []
    setup = extract_section(body, "Required Setup", 700)
    if setup:
        checks.append(setup)
    text = f"{json.dumps(meta)}\n{body}".lower()
    markers = [
        ("api_key", "Requires API key or authenticated service access"),
        ("credentials", "Requires credentials"),
        ("token", "Requires token"),
        ("sudo", "May require sudo/admin permissions"),
        ("docker", "Requires Docker/runtime access"),
        ("internet", "Requires internet/network access"),
        ("rate limit", "Subject to external API rate limits"),
        ("email", "Requires registered contact/email for API use"),
    ]
    for token, label in markers:
        if token in text and label not in checks:
            checks.append(label)
    if not checks:
        checks.append("No explicit permission requirement found in file")
    return checks[:4]


def child_counts(path: Path) -> dict[str, int]:
    folder = path.parent
    return {
        "nodes": len(list(folder.rglob("NODE.md"))),
        "leaves": len(list(folder.rglob("LEAF.md"))),
        "supportFiles": len([item for item in folder.rglob("*") if item.is_file() and item.name not in {"SKILL.md", "NODE.md", "LEAF.md"}]),
    }


def build_skill_entries() -> list[dict]:
    ensure_release_cache()
    skills_root = RELEASE_ROOT / "skills/.agents/skills"
    if not skills_root.exists():
        return []
    entries: list[dict] = []
    for path in sorted(skills_root.rglob("*.md")):
        if path.name not in {"SKILL.md", "NODE.md", "LEAF.md"}:
            continue
        text = read_text(path, 60000)
        meta, body = parse_front_matter(text)
        relative = path.relative_to(skills_root).as_posix()
        kind = {"SKILL.md": "skill", "NODE.md": "node", "LEAF.md": "leaf"}[path.name]
        name = meta.get("name") or first_heading(body) or path.parent.name
        description = meta.get("description") or next((line.strip() for line in body.splitlines() if line.strip() and not line.startswith("#")), "")
        setup = extract_section(body, "Required Setup", 1200)
        counts = child_counts(path) if kind == "skill" else {"nodes": 0, "leaves": 0, "supportFiles": 0}
        entries.append(
            {
                "id": relative,
                "name": name,
                "kind": kind,
                "path": relative,
                "parent": path.parent.parent.name if kind in {"node", "leaf"} else "",
                "description": description[:900],
                "toolType": meta.get("tool_type", ""),
                "primaryTool": meta.get("primary_tool", ""),
                "permissionRequirements": permission_requirements(meta, body),
                "requiredSetup": setup,
                "nodes": counts["nodes"],
                "leaves": counts["leaves"],
                "supportFiles": counts["supportFiles"],
                "excerpt": body[:2400],
            }
        )
    order = {"skill": 0, "node": 1, "leaf": 2}
    return sorted(entries, key=lambda item: (order[item["kind"]], item["name"]))


def sqlite_rows(query: str, params: tuple = ()) -> list[dict]:
    ensure_sdb_cache()
    if not SDB_SQLITE.exists():
        return []
    conn = sqlite3.connect(SDB_SQLITE)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def build_database_info(release: dict, handoff: dict) -> dict:
    eb_resources = release.get("resources", {}).get("eb", {})
    sdb_archive = PHASEAGENT_ROOT / handoff.get("resource_packs", {}).get("sdb_v2", {}).get("name", "")
    eb_archive = PHASEAGENT_ROOT / handoff.get("resource_packs", {}).get("eb", {}).get("name", "")
    sdb_tables = sqlite_rows("select name, type from sqlite_master where type in ('table','view') order by name")
    table_counts = []
    for table in ["sources", "source_metadata", "records", "aliases", "records_fts"]:
        try:
            count = sqlite_rows(f"select count(*) as count from {table}")[0]["count"]
            table_counts.append({"table": table, "rows": count})
        except Exception:
            pass
    samples = sqlite_rows(
        """
        select record_id, source_database, entity_type, primary_name, gene_name, organism,
               condensate, evidence_class, substr(description, 1, 260) as description
        from records
        order by abs(random())
        limit 10
        """
    )
    return {
        "vectorStore": {
            "type": "Packaged local Evidence Base vector DB",
            "engine": "Not exposed as live Faiss/Milvus service in handoff; runtime mounts it at /mnt/vector-db",
            "isFaiss": False,
            "isMilvus": False,
            "compressedArchive": file_payload(eb_archive),
            "declaredFiles": [
                {
                    "name": item.get("name"),
                    "sizeBytes": item.get("size_bytes"),
                    "size": format_bytes(item.get("size_bytes")),
                    "sha256": item.get("sha256"),
                }
                for item in eb_resources.get("database", {}).get("files", [])
            ],
            "documentCatalog": {
                "sizeBytes": eb_resources.get("document_catalog", {}).get("size_bytes"),
                "size": format_bytes(eb_resources.get("document_catalog", {}).get("size_bytes")),
                "sha256": eb_resources.get("document_catalog", {}).get("sha256"),
            },
            "markdownDirectoryCount": eb_resources.get("markdown_directory_count"),
            "apiEnriched": {
                "sizeBytes": eb_resources.get("api_enriched", {}).get("size_bytes"),
                "size": format_bytes(eb_resources.get("api_enriched", {}).get("size_bytes")),
                "sha256": eb_resources.get("api_enriched", {}).get("sha256"),
            },
        },
        "sdb": {
            "type": "SQLite",
            "engine": "SQLite 3 with FTS5 virtual table",
            "compressedArchive": file_payload(sdb_archive),
            "sqliteFile": {
                "path": SDB_SQLITE.as_posix(),
                "exists": SDB_SQLITE.exists(),
                "sizeBytes": SDB_SQLITE.stat().st_size if SDB_SQLITE.exists() else None,
                "size": format_bytes(SDB_SQLITE.stat().st_size if SDB_SQLITE.exists() else None),
            },
            "tables": sdb_tables,
            "tableCounts": table_counts,
            "sampleRecords": samples,
        },
    }


def file_payload(path: Path) -> dict:
    exists = path.exists()
    stat = path.stat() if exists else None
    return {
        "name": path.name,
        "relativePath": path.relative_to(PHASEAGENT_ROOT).as_posix() if path.is_relative_to(PHASEAGENT_ROOT) else path.name,
        "exists": exists,
        "sizeBytes": stat.st_size if stat else None,
        "size": format_bytes(stat.st_size if stat else None),
        "modifiedAt": stat.st_mtime if stat else None,
    }


def normalize_public_path(request_path: str) -> str:
    if PUBLIC_BASE_PATH and request_path.startswith(PUBLIC_BASE_PATH):
        trimmed = request_path[len(PUBLIC_BASE_PATH) :]
        return trimmed or "/"
    return request_path


def build_phaseagent_payload() -> dict:
    handoff = read_json(PHASEAGENT_ROOT / "handoff-manifest.json")
    release = read_json(PHASEAGENT_ROOT / "phaseagent-0.6.0.release-manifest.json")
    files = sorted([path for path in PHASEAGENT_ROOT.iterdir() if path.is_file()], key=lambda item: item.name)

    resource_packs = []
    for key, value in handoff.get("resource_packs", {}).items():
        archive = PHASEAGENT_ROOT / value["name"]
        item = file_payload(archive)
        item.update(
            {
                "id": key,
                "sha256": value.get("sha256"),
                "declaredSizeBytes": value.get("size_bytes"),
                "declaredSize": format_bytes(value.get("size_bytes")),
                "verifiedSize": item["sizeBytes"] == value.get("size_bytes"),
            }
        )
        resource_packs.append(item)

    image_archive = handoff.get("image", {}).get("archive", {})
    release_bundle = handoff.get("release_bundle", {})
    main_files = [
        file_payload(PHASEAGENT_ROOT / "README.md"),
        file_payload(PHASEAGENT_ROOT / "handoff-manifest.json"),
        file_payload(PHASEAGENT_ROOT / "phaseagent-0.6.0.release-manifest.json"),
        file_payload(PHASEAGENT_ROOT / "phaseagent.env.example"),
        file_payload(PHASEAGENT_ROOT / "install-internal.sh"),
        file_payload(PHASEAGENT_ROOT / "SHA256SUMS"),
    ]

    sdb_quality = release.get("resources", {}).get("sdb", {}).get("manifest", {}).get("quality", {})
    source_counts = release.get("resources", {}).get("sdb", {}).get("manifest", {}).get("source_counts", {})
    source_rows = [
        {"name": name, "count": count}
        for name, count in sorted(source_counts.items(), key=lambda item: item[1], reverse=True)
    ]

    eb_resources = release.get("resources", {}).get("eb", {})
    db_files = eb_resources.get("database", {}).get("files", [])
    vector_files = [
        {
            "name": item.get("name"),
            "sizeBytes": item.get("size_bytes"),
            "size": format_bytes(item.get("size_bytes")),
            "sha256": item.get("sha256"),
        }
        for item in db_files
    ]

    database_info = build_database_info(release, handoff)
    return {
        "rootPath": PHASEAGENT_ROOT.as_posix(),
        "rootExists": PHASEAGENT_ROOT.exists(),
        "product": handoff.get("product", release.get("product")),
        "releaseVersion": handoff.get("release_version", release.get("release_version")),
        "distributionScope": handoff.get("distribution_scope"),
        "createdAt": handoff.get("created_at"),
        "releaseCreatedAt": release.get("created_at"),
        "notice": handoff.get("notice"),
        "excluded": handoff.get("excluded", []),
        "files": [file_payload(path) for path in files],
        "mainFiles": main_files,
        "readme": read_text(PHASEAGENT_ROOT / "README.md"),
        "envExample": read_text(PHASEAGENT_ROOT / "phaseagent.env.example"),
        "sha256Sums": read_text(PHASEAGENT_ROOT / "SHA256SUMS"),
        "handoffManifest": handoff,
        "releaseManifest": release,
        "image": {
            "name": handoff.get("image", {}).get("name"),
            "imageId": handoff.get("image", {}).get("image_id"),
            "archive": {
                **file_payload(PHASEAGENT_ROOT / image_archive.get("name", "")),
                "sha256": image_archive.get("sha256"),
                "declaredSizeBytes": image_archive.get("size_bytes"),
                "declaredSize": format_bytes(image_archive.get("size_bytes")),
            },
        },
        "releaseBundle": {
            **file_payload(PHASEAGENT_ROOT / release_bundle.get("name", "")),
            "sha256": release_bundle.get("sha256"),
            "declaredSizeBytes": release_bundle.get("size_bytes"),
            "declaredSize": format_bytes(release_bundle.get("size_bytes")),
        },
        "resourcePacks": resource_packs,
        "skills": release.get("skills", {}),
        "commands": release.get("commands", {}),
        "workspace": release.get("workspace", {}),
        "eb": release.get("eb", {}),
        "sdbQuality": sdb_quality,
        "sourceCounts": source_rows,
        "vectorFiles": vector_files,
        "documentCatalog": {
            "sizeBytes": eb_resources.get("document_catalog", {}).get("size_bytes"),
            "size": format_bytes(eb_resources.get("document_catalog", {}).get("size_bytes")),
            "sha256": eb_resources.get("document_catalog", {}).get("sha256"),
        },
        "apiEnriched": {
            "sizeBytes": eb_resources.get("api_enriched", {}).get("size_bytes"),
            "size": format_bytes(eb_resources.get("api_enriched", {}).get("size_bytes")),
            "sha256": eb_resources.get("api_enriched", {}).get("sha256"),
        },
        "markdownDirectoryCount": eb_resources.get("markdown_directory_count"),
        "skillEntries": build_skill_entries(),
        "databases": database_info,
    }


def build_knowledge_document_index() -> list[dict]:
    rows = sqlite_rows(
        """
        select
            s.source_database,
            s.title as source_title,
            s.description as source_description,
            s.record_count as source_record_count,
            coalesce(m.category, '') as category,
            coalesce(m.default_entity_type, '') as default_entity_type,
            coalesce(m.evidence_class, '') as evidence_class,
            coalesce(m.homepage, '') as homepage,
            coalesce(m.license, '') as license,
            coalesce(m.snapshot_release, '') as snapshot_release,
            coalesce(m.parser_version, '') as parser_version,
            coalesce(m.source_file_count, 1) as source_file_count
        from sources s
        left join source_metadata m on m.source_database = s.source_database
        order by s.source_database asc
        """
    )
    sqlite_size = SDB_SQLITE.stat().st_size if SDB_SQLITE.exists() else None
    items: list[dict] = []
    for index, row in enumerate(rows, start=1):
        items.append(
            {
                "id": index,
                "fileName": row.get("source_title") or row["source_database"],
                "fileType": "SDB_SOURCE",
                "sourcePath": row["source_database"],
                "parserName": row.get("parser_version") or "finalize_sdb_v2.py@2",
                "fileSize": sqlite_size,
                "pageCount": row.get("source_file_count") or 1,
                "chunkCount": row.get("source_record_count") or 0,
                "processStatus": "INGESTED",
                "dedupStatus": row.get("evidence_class") or "INDEXED",
                "updatedAt": row.get("snapshot_release") or "",
                "createdAt": row.get("snapshot_release") or "",
                "sourceDatabase": row["source_database"],
                "title": row.get("source_title") or row["source_database"],
                "description": row.get("source_description") or "",
                "category": row.get("category") or "",
                "defaultEntityType": row.get("default_entity_type") or "",
                "evidenceClass": row.get("evidence_class") or "",
                "homepage": row.get("homepage") or "",
                "license": row.get("license") or "",
                "snapshotRelease": row.get("snapshot_release") or "",
                "parserVersion": row.get("parser_version") or "",
                "recordCount": row.get("source_record_count") or 0,
                "sourceFileCount": row.get("source_file_count") or 1,
            }
        )
    return items


def sqlite_quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def build_knowledge_field_stats(source_database: str) -> list[dict]:
    cached = FIELD_STATS_CACHE.get(source_database)
    if cached is not None:
        return cached

    columns = sqlite_rows("pragma table_info(records)")
    if not columns:
        FIELD_STATS_CACHE[source_database] = []
        return []

    select_exprs = ["count(*) as total_rows"]
    column_specs: list[tuple[str, str]] = []
    for index, column in enumerate(columns):
        column_name = str(column.get("name") or "")
        if not column_name:
            continue
        alias = f"missing_{index}"
        quoted_column = sqlite_quote_ident(column_name)
        quoted_alias = sqlite_quote_ident(alias)
        select_exprs.append(
            f"sum(case when {quoted_column} is null or trim(cast({quoted_column} as text)) = '' then 1 else 0 end) as {quoted_alias}"
        )
        column_specs.append((column_name, str(column.get("type") or "")))

    row = sqlite_rows(
        f"select {', '.join(select_exprs)} from records where source_database = ?",
        (source_database,),
    )
    if not row:
        FIELD_STATS_CACHE[source_database] = []
        return []

    totals = row[0]
    total_rows = int(totals.get("total_rows") or 0)
    field_stats: list[dict] = []
    for index, (column_name, column_type) in enumerate(column_specs):
        missing_rows = int(totals.get(f"missing_{index}") or 0)
        present_rows = max(total_rows - missing_rows, 0)
        missing_rate = round((missing_rows / total_rows) * 100, 2) if total_rows else 0.0
        field_stats.append(
            {
                "name": column_name,
                "type": column_type or "TEXT",
                "totalRows": total_rows,
                "presentRows": present_rows,
                "missingRows": missing_rows,
                "missingRate": missing_rate,
            }
        )

    FIELD_STATS_CACHE[source_database] = field_stats
    return field_stats


def knowledge_document_samples(source_database: str | None = None, limit: int = 10) -> list[dict]:
    limit = max(1, min(int(limit), 50))
    select_clause = """
        select
            record_id,
            source_database,
            source_file,
            source_row,
            entity_type,
            primary_name,
            aliases,
            uniprot_id,
            gene_name,
            organism,
            condensate,
            llps_role,
            evidence_type,
            pmids,
            substr(coalesce(description, ''), 1, 380) as description,
            raw_json,
            condensate_tags,
            canonical_id,
            evidence_class,
            evidence_detail,
            schema_version
        from records
    """
    if source_database:
        return sqlite_rows(
            f"{select_clause} where source_database = ? order by abs(random()) limit ?",
            (source_database, limit),
        )
    return sqlite_rows(f"{select_clause} order by abs(random()) limit ?", (limit,))


def build_knowledge_document_detail(document_id: int) -> dict | None:
    return build_knowledge_document_detail_with_sample_size(document_id, 10)


def build_knowledge_document_detail_with_sample_size(document_id: int, sample_size: int) -> dict | None:
    doc = next((item for item in build_knowledge_document_index() if item["id"] == document_id), None)
    if not doc:
        return None
    detail = dict(doc)
    detail["sampleRecords"] = knowledge_document_samples(detail["sourceDatabase"], sample_size)
    detail["fieldStats"] = build_knowledge_field_stats(detail["sourceDatabase"])
    return detail


def parse_positive_int(value: str | None, default: int) -> int:
    try:
        parsed = int(value) if value is not None and value != "" else default
    except ValueError:
        return default
    return max(parsed, 1)


def build_knowledge_list_response(params: dict[str, list[str]]) -> dict:
    docs = build_knowledge_document_index()
    keyword = (params.get("keyword", [""]) or [""])[0].strip().lower()
    file_type = (params.get("fileType", [""]) or [""])[0].strip().lower()
    status = (params.get("status", [""]) or [""])[0].strip().lower()
    page = max(int((params.get("page", ["0"]) or ["0"])[0]), 0)
    size = max(int((params.get("size", ["20"]) or ["20"])[0]), 1)

    if keyword:
        docs = [
            doc
            for doc in docs
            if keyword
            in json.dumps(
                {
                    "fileName": doc["fileName"],
                    "sourcePath": doc["sourcePath"],
                    "category": doc["category"],
                    "description": doc["description"],
                    "homepage": doc["homepage"],
                    "license": doc["license"],
                    "parserVersion": doc["parserVersion"],
                    "sourceDatabase": doc["sourceDatabase"],
                    "evidenceClass": doc["evidenceClass"],
                },
                ensure_ascii=False,
            ).lower()
        ]
    if file_type:
        docs = [
            doc
            for doc in docs
            if file_type in {str(doc["fileType"]).lower(), str(doc["sourceDatabase"]).lower()}
        ]
    if status:
        docs = [doc for doc in docs if status == str(doc["processStatus"]).lower()]

    docs = sorted(docs, key=lambda item: (-int(item.get("recordCount") or 0), item["sourceDatabase"]))
    total = len(docs)
    start = page * size
    content = docs[start : start + size]
    return {
        "content": content,
        "totalElements": total,
        "totalPages": (total + size - 1) // size if size else 0,
        "size": size,
        "number": page,
        "numberOfElements": len(content),
        "first": page == 0,
        "last": start + size >= total,
        "empty": total == 0,
    }


def chunking_config_payload(document_id: int) -> dict:
    config = CHUNKING_CONFIGS.get(document_id, DEFAULT_CHUNKING_CONFIG)
    latest_job = next(
        (job for job in sorted(CHUNKING_JOBS.values(), key=lambda item: item["id"], reverse=True) if job["documentId"] == document_id),
        None,
    )
    return {
        "id": document_id,
        "documentId": document_id,
        "versionNumber": 1,
        "status": "ACTIVE",
        "createdAt": "2026-08-15T00:00:00Z",
        "activatedAt": "2026-08-15T00:00:00Z",
        "latestJob": latest_job,
        **config,
    }


def create_chunking_job(document_id: int, config: dict) -> dict:
    global NEXT_JOB_ID
    CHUNKING_CONFIGS[document_id] = {**DEFAULT_CHUNKING_CONFIG, **config}
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    job = {
        "id": NEXT_JOB_ID,
        "documentId": document_id,
        "configVersionId": document_id,
        "status": "COMPLETED",
        "stage": "COMPLETED",
        "progress": 100,
        "message": "Prototype deployment applied the chunking configuration.",
        "errorMessage": None,
        "createdAt": now,
        "updatedAt": now,
        "completedAt": now,
    }
    CHUNKING_JOBS[NEXT_JOB_ID] = job
    NEXT_JOB_ID += 1
    return job


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = normalize_public_path(parsed.path)
        if path == "/api/health":
            self.send_json({"status": "ok", "phaseagentRoot": PHASEAGENT_ROOT.as_posix()})
            return
        if path == "/api/knowledge/documents":
            self.send_json(build_knowledge_list_response(parse_qs(parsed.query)))
            return
        if path == "/api/knowledge/documents/sample":
            docs = build_knowledge_document_index()
            if not docs:
                self.send_json({"error": "document not found"}, status=404)
                return
            sample_size = parse_positive_int((parse_qs(parsed.query).get("sampleSize", ["10"]) or ["10"])[0], 10)
            self.send_json(
                build_knowledge_document_detail_with_sample_size(docs[0]["id"], sample_size) or {"error": "document not found"}
            )
            return
        match = re.fullmatch(r"/api/knowledge/documents/(\d+)$", path)
        if match:
            sample_size = parse_positive_int((parse_qs(parsed.query).get("sampleSize", ["10"]) or ["10"])[0], 10)
            detail = build_knowledge_document_detail_with_sample_size(int(match.group(1)), sample_size)
            self.send_json(detail if detail else {"error": "document not found"}, status=200 if detail else 404)
            return
        match = re.fullmatch(r"/api/knowledge/documents/(\d+)/chunking", path)
        if match:
            self.send_json(chunking_config_payload(int(match.group(1))))
            return
        match = re.fullmatch(r"/api/knowledge/chunking-jobs/(\d+)", path)
        if match:
            job = CHUNKING_JOBS.get(int(match.group(1)))
            self.send_json(job if job else {"error": "job not found"}, status=200 if job else 404)
            return
        if path == "/api/knowledge/stats":
            sqlite_size = SDB_SQLITE.stat().st_size if SDB_SQLITE.exists() else None
            self.send_json(
                {
                    "totalDocuments": len(build_knowledge_document_index()),
                    "totalChunks": sqlite_rows("select count(*) as count from records")[0]["count"],
                    "currentIndex": "source_db_index.sqlite3",
                    "lastSync": "sdb-v2-snapshot-2026-07-20",
                    "databaseType": "SQLite / FTS5",
                    "sqliteSize": format_bytes(sqlite_size),
                    "aliasCount": sqlite_rows("select count(*) as count from aliases")[0]["count"],
                }
            )
            return
        if path == "/api/phaseagent/project":
            try:
                self.send_json(build_phaseagent_payload())
            except Exception as exc:
                self.send_json({"error": str(exc)}, status=500)
            return
        self.serve_static(path)

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        path = normalize_public_path(parsed.path)
        match = re.fullmatch(r"/api/knowledge/documents/(\d+)/chunking", path)
        if not match:
            self.send_json({"error": "not found"}, status=404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
            self.send_json(create_chunking_job(int(match.group(1)), payload))
        except Exception as exc:
            self.send_json({"error": str(exc)}, status=400)

    def do_HEAD(self) -> None:
        parsed = urlparse(self.path)
        path = normalize_public_path(parsed.path)
        if path.startswith("/api/"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            return
        self.serve_static(path, head_only=True)

    def send_json(self, payload: dict, status: int = 200) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def serve_static(self, request_path: str, head_only: bool = False) -> None:
        relative = request_path.lstrip("/") or "index.html"
        target = (ROOT / relative).resolve()
        if not target.is_relative_to(ROOT) or not target.exists() or target.is_dir():
            target = ROOT / "index.html"
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Last-Modified", self.date_time_string(target.stat().st_mtime))
        self.end_headers()
        if not head_only:
            self.wfile.write(data)


def main() -> None:
    host = os.environ.get("RAGMONITOR_HOST", "0.0.0.0")
    port = int(os.environ.get("RAGMONITOR_PORT", "8788"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"RagMonitor serving {ROOT} on http://{host}:{port}")
    print(f"PhaseAgent root: {PHASEAGENT_ROOT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
