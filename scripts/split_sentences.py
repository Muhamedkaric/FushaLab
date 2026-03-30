#!/usr/bin/env python3
"""
Split flat arabic/translation/translationEn fields into aligned sentences arrays.
Writes results to public/dataV2/{path} and updates index.json files.
"""

import json
import os
import re
import sys

BASE = "/Users/mkaric/private/FushaLab/public"
SRC = os.path.join(BASE, "data")
DST = os.path.join(BASE, "dataV2")

FILES = [
    "culture/C2/culture-c2-020.json",
    "culture/C2/culture-c2-024.json",
    "culture/C2/culture-c2-027.json",
    "culture/C2/culture-c2-028.json",
    "culture/C2/culture-c2-030.json",
    "culture/C2/culture-c2-047.json",
    "culture/C2/culture-c2-048.json",
    "culture/C2/culture-c2-060.json",
    "culture/C2/culture-c2-077.json",
    "literature/B2/literature-b2-011.json",
    "news/B2/news-b2-005.json",
    "news/B2/news-b2-026.json",
    "news/B2/news-b2-036.json",
    "news/B2/news-b2-091.json",
    "news/C1/news-c1-017.json",
    "news/C1/news-c1-080.json",
    "news/C2/news-c2-018.json",
    "news/C2/news-c2-036.json",
    "news/C2/news-c2-065.json",
    "news/C2/news-c2-067.json",
    "news/C2/news-c2-068.json",
    "news/C2/news-c2-070.json",
    "news/C2/news-c2-077.json",
    "news/C2/news-c2-087.json",
    "news/C2/news-c2-088.json",
    "news/C2/news-c2-095.json",
    "news/C2/news-c2-096.json",
    "news/C2/news-c2-097.json",
    "news/C2/news-c2-100.json",
    "religion/B1/religion-b1-013.json",
    "religion/B1/religion-b1-093.json",
    "religion/B2/religion-b2-007.json",
    "religion/B2/religion-b2-017.json",
    "religion/B2/religion-b2-020.json",
    "religion/B2/religion-b2-021.json",
    "religion/B2/religion-b2-022.json",
    "religion/B2/religion-b2-023.json",
    "religion/B2/religion-b2-033.json",
    "religion/B2/religion-b2-035.json",
    "religion/B2/religion-b2-040.json",
    "religion/B2/religion-b2-053.json",
    "religion/B2/religion-b2-067.json",
    "religion/B2/religion-b2-073.json",
    "religion/B2/religion-b2-077.json",
    "religion/B2/religion-b2-089.json",
    "religion/B2/religion-b2-092.json",
    "religion/C1/religion-c1-002.json",
    "religion/C1/religion-c1-004.json",
    "religion/C1/religion-c1-005.json",
    "religion/C1/religion-c1-006.json",
    "religion/C1/religion-c1-010.json",
    "religion/C1/religion-c1-034.json",
    "religion/C1/religion-c1-037.json",
    "religion/C1/religion-c1-038.json",
    "religion/C1/religion-c1-042.json",
    "religion/C1/religion-c1-043.json",
    "religion/C1/religion-c1-047.json",
    "religion/C1/religion-c1-048.json",
    "religion/C1/religion-c1-052.json",
    "religion/C1/religion-c1-058.json",
    "religion/C1/religion-c1-062.json",
    "religion/C1/religion-c1-064.json",
    "religion/C2/religion-c2-001.json",
    "religion/C2/religion-c2-002.json",
    "religion/C2/religion-c2-006.json",
    "religion/C2/religion-c2-008.json",
    "religion/C2/religion-c2-010.json",
    "religion/C2/religion-c2-013.json",
    "religion/C2/religion-c2-040.json",
    "religion/C2/religion-c2-049.json",
    "religion/C2/religion-c2-051.json",
    "religion/C2/religion-c2-054.json",
    "religion/C2/religion-c2-056.json",
    "religion/C2/religion-c2-057.json",
    "religion/C2/religion-c2-060.json",
    "religion/C2/religion-c2-061.json",
    "religion/C2/religion-c2-062.json",
    "religion/C2/religion-c2-063.json",
    "religion/C2/religion-c2-064.json",
    "religion/C2/religion-c2-065.json",
    "religion/C2/religion-c2-070.json",
    "religion/C2/religion-c2-075.json",
    "religion/C2/religion-c2-083.json",
    "religion/C2/religion-c2-085.json",
    "religion/C2/religion-c2-091.json",
    "religion/C2/religion-c2-093.json",
    "religion/C2/religion-c2-095.json",
    "travel/C1/travel-c1-052.json",
    "travel/C2/travel-c2-018.json",
    "travel/C2/travel-c2-022.json",
    "travel/C2/travel-c2-043.json",
    "travel/C2/travel-c2-044.json",
    "travel/C2/travel-c2-046.json",
    "travel/C2/travel-c2-064.json",
    "travel/C2/travel-c2-069.json",
    "travel/C2/travel-c2-070.json",
    "travel/C2/travel-c2-089.json",
    "travel/C2/travel-c2-091.json",
    "travel/C2/travel-c2-092.json",
]


def split_arabic(text):
    """Split Arabic text into sentences at . ؟ ! ۔"""
    # Split keeping the delimiter
    parts = re.split(r'(?<=[.؟!۔])\s+', text.strip())
    # Clean up
    result = [p.strip() for p in parts if p.strip()]
    return result


def split_translation(text, n):
    """Split translation text into exactly n sentences.
    First split by . ? ! then merge/combine to reach n."""
    # Split only when followed by uppercase letter (avoids splitting ordinals like "20. vijeka")
    # Also handle Bosnian uppercase chars: ŠĐČĆŽ
    parts = re.split(r'(?<=[.?!\u061f])\s+(?=[A-ZŠĐČĆŽА-Я\"\'\(«])', text.strip())
    parts = [p.strip() for p in parts if p.strip()]

    if len(parts) == n:
        return parts

    if len(parts) < n:
        # Try to split longer sentences (those with semicolons or commas or conjunctions)
        # Expand by splitting on '; ' or ' — ' or newlines
        expanded = []
        for p in parts:
            # Try splitting on newline first
            sub = [s.strip() for s in p.split('\n') if s.strip()]
            if len(sub) > 1:
                expanded.extend(sub)
            else:
                expanded.append(p)
        parts = expanded

    if len(parts) == n:
        return parts

    if len(parts) < n:
        # Still too few - try splitting on '; '
        expanded = []
        for p in parts:
            sub = re.split(r';\s+', p)
            sub = [s.strip() for s in sub if s.strip()]
            if len(sub) > 1:
                # Add period back to each sub if missing
                expanded.extend(sub)
            else:
                expanded.append(p)
        parts = expanded

    if len(parts) == n:
        return parts

    if len(parts) < n:
        # Still too few - try splitting on ' — '
        expanded = []
        for p in parts:
            sub = re.split(r'\s+[—–]\s+', p)
            sub = [s.strip() for s in sub if s.strip()]
            if len(sub) > 1:
                expanded.extend(sub)
            else:
                expanded.append(p)
        parts = expanded

    if len(parts) == n:
        return parts

    # If we have more parts than needed, merge excess into last
    if len(parts) > n:
        # merge last (len-n+1) parts into single
        merged = parts[:n-1] + [' '.join(parts[n-1:])]
        return merged

    # If still fewer, merge all into one list and distribute
    if len(parts) < n:
        # Just return what we have padded (shouldn't happen much)
        return parts

    return parts


def align_translations(arabic_sents, bs_text, en_text):
    """Return list of (arabic, bosnian, english) triples, aligned."""
    n = len(arabic_sents)

    bs_sents = split_translation(bs_text, n)
    en_sents = split_translation(en_text, n)

    # Pad or truncate to n
    while len(bs_sents) < n:
        bs_sents.append(bs_sents[-1] if bs_sents else "")
    while len(en_sents) < n:
        en_sents.append(en_sents[-1] if en_sents else "")

    bs_sents = bs_sents[:n]
    en_sents = en_sents[:n]

    return [
        {"arabic": a, "translation": b, "translationEn": e}
        for a, b, e in zip(arabic_sents, bs_sents, en_sents)
    ]


def process_file(rel_path):
    src_path = os.path.join(SRC, rel_path)
    dst_path = os.path.join(DST, rel_path)

    with open(src_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    arabic_text = data.get('arabic', '')
    bs_text = data.get('translation', '')
    en_text = data.get('translationEn', '')

    arabic_sents = split_arabic(arabic_text)

    if len(arabic_sents) == 0:
        print(f"WARNING: No arabic sentences in {rel_path}")
        arabic_sents = [arabic_text]

    sentences = align_translations(arabic_sents, bs_text, en_text)

    out = {
        "id": data["id"],
        "category": data["category"],
        "level": data["level"],
        "sentences": sentences,
        "metadata": data.get("metadata", {}),
    }

    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    with open(dst_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    return out


def update_index(category, level, new_items):
    """Append new items to existing index.json in dataV2."""
    idx_path = os.path.join(DST, category, level, "index.json")

    existing = {"items": []}
    if os.path.exists(idx_path):
        with open(idx_path, 'r', encoding='utf-8') as f:
            existing = json.load(f)

    existing_ids = {item["id"] for item in existing["items"]}

    for item in new_items:
        if item["id"] not in existing_ids:
            existing["items"].append({
                "id": item["id"],
                "arabic": item["sentences"][0]["arabic"],
                "metadata": item["metadata"],
            })
            existing_ids.add(item["id"])

    os.makedirs(os.path.dirname(idx_path), exist_ok=True)
    with open(idx_path, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)


def main():
    # Group by category/level for index updates
    by_cat_level = {}

    for rel_path in FILES:
        print(f"Processing {rel_path} ...", end=" ")
        try:
            out = process_file(rel_path)
            cat = out["category"]
            lvl = out["level"]
            key = (cat, lvl)
            by_cat_level.setdefault(key, []).append(out)
            n = len(out["sentences"])
            print(f"OK ({n} sentences)")
        except Exception as e:
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()

    # Update indexes
    print("\nUpdating indexes...")
    for (cat, lvl), items in by_cat_level.items():
        update_index(cat, lvl, items)
        print(f"  {cat}/{lvl}: {len(items)} items added/updated")

    print("\nDone.")


if __name__ == "__main__":
    main()
