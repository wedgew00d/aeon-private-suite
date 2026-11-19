#!/usr/bin/env python3
"""Restore the original v0.8.7 standalone index.html without modifying it.

Usage: python3 scripts/rebuild_original.py [output path]
The output is SHA-256 validated against the user-approved v0.8.7 release.
"""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parents[1]
SHA256 = "330ba7e2fce0862b15ca759d35ae4b0732b19586131422f04ecb4e04dd53aabf"
EXPECTED_SIZE = 6310131
parts = [ROOT / "parts" / f"part-{n:02d}.txt" for n in range(16)]
content = b"".join(path.read_bytes() for path in parts)
hash_value = hashlib.sha256(content).hexdigest()
if hash_value != SHA256 or len(content) != EXPECTED_SIZE:
    sys.exit(f"Source checksum error: {hash_value} / {len(content)} bytes")
output = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "index.html"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_bytes(content)
print(f"Rebuilt: {output} ({len(content)} bytes) SHA-256: {hash_value}")
