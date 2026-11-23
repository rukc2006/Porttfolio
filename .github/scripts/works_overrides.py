# -*- coding: utf-8 -*-
"""Apply persistent dashboard edits to the generated Yandex gallery manifest."""
from __future__ import annotations

import re


def apply_overrides(manifest: dict, overrides: dict | None) -> dict:
    if not isinstance(manifest, dict):
        raise ValueError('Генерируемый список витрины повреждён.')
    base_sections = manifest.get('sections', [])
    if not isinstance(base_sections, list):
        raise ValueError('В манифесте витрины нет списка разделов.')
    if not overrides:
        return {'root': manifest.get('root', []), 'sections': base_sections}
    if not isinstance(overrides, dict) or overrides.get('version') != 1:
        raise ValueError('Настройки витрины имеют неподдерживаемый формат.')
    configs = overrides.get('sections')
    if not isinstance(configs, list):
        raise ValueError('В настройках витрины нет разделов.')
    by_id = {}
    source_to_id = {}
    order = []
    for item in configs:
        if not isinstance(item, dict):
            continue
        sid, name = item.get('id'), item.get('name')
        if not isinstance(sid, str) or not isinstance(name, str) or not name.strip():
            continue
        sources = item.get('sources', [])
        if not isinstance(sources, list):
            sources = []
        by_id[sid] = {'id': sid, 'name': name.strip(), 'sources': [s for s in sources if isinstance(s, str)], 'files': []}
        order.append(sid)
        for source in by_id[sid]['sources']:
            source_to_id[source] = sid
    # Any new source folder appears automatically as a new section after the user's configured sections.
    for source in base_sections:
        if not isinstance(source, dict):
            continue
        name = source.get('name')
        if not isinstance(name, str):
            continue
        if name not in source_to_id:
            sid = 'source:' + name
            by_id[sid] = {'id': sid, 'name': name, 'sources': [name], 'files': []}
            source_to_id[name] = sid
            order.append(sid)
    hidden = set(x for x in overrides.get('hidden_files', []) if isinstance(x, str))
    explicit = {}
    for item in configs:
        if not isinstance(item, dict) or item.get('id') not in by_id:
            continue
        files = item.get('files', [])
        if isinstance(files, list):
            for path in files:
                if isinstance(path, str):
                    explicit[path] = item['id']
    for src in base_sections:
        if not isinstance(src, dict) or not isinstance(src.get('files'), list):
            continue
        src_name = src.get('name', '')
        for path in src['files']:
            if not isinstance(path, str) or path in hidden:
                continue
            sid = explicit.get(path, source_to_id.get(src_name))
            if sid in by_id and path not in by_id[sid]['files']:
                by_id[sid]['files'].append(path)
    # Keep the configured order and append new source sections in source order.
    configured_order = overrides.get('section_order', order)
    if not isinstance(configured_order, list):
        configured_order = order
    final_order = [sid for sid in configured_order if sid in by_id]
    final_order.extend(sid for sid in order if sid not in final_order)
    result = []
    for sid in final_order:
        section = by_id[sid]
        cfg = next((x for x in configs if isinstance(x, dict) and x.get('id') == sid), {})
        preferred = cfg.get('files', []) if isinstance(cfg, dict) else []
        if isinstance(preferred, list):
            rank = {path: i for i, path in enumerate(preferred) if isinstance(path, str)}
            section['files'].sort(key=lambda path: (0, rank[path]) if path in rank else (1, path.casefold()))
        result.append({'name': section['name'], 'files': section['files']})
    return {'root': manifest.get('root', []), 'sections': result}


def validate_overrides(value: object, manifest: dict) -> dict:
    if not isinstance(value, dict) or value.get('version') != 1:
        raise ValueError('Не удалось прочитать правки витрины.')
    base = {path for section in manifest.get('sections', []) if isinstance(section, dict)
            for path in section.get('files', []) if isinstance(path, str)}
    configs = value.get('sections')
    if not isinstance(configs, list) or not configs or len(configs) > 80:
        raise ValueError('В витрине должен остаться хотя бы один раздел.')
    clean, ids, names, assigned = [], set(), set(), set()
    source_names = {s.get('name') for s in manifest.get('sections', []) if isinstance(s, dict) and isinstance(s.get('name'), str)}
    for i, row in enumerate(configs, 1):
        if not isinstance(row, dict):
            raise ValueError('Проверь раздел %d.' % i)
        sid, name = row.get('id'), row.get('name')
        sources, files = row.get('sources', []), row.get('files', [])
        if not isinstance(sid, str) or not re.fullmatch(r'(?:source:.{1,120}|custom:[a-z0-9-]{8,60})', sid):
            raise ValueError('У раздела %d неверный идентификатор.' % i)
        if sid in ids:
            raise ValueError('Раздел повторяется: %s.' % sid)
        ids.add(sid)
        if not isinstance(name, str) or not name.strip() or len(name.strip()) > 120 or any(ord(c) < 32 for c in name):
            raise ValueError('У раздела %d проверь название.' % i)
        key = name.strip().casefold()
        if key in names:
            raise ValueError('Названия разделов должны отличаться.')
        names.add(key)
        if not isinstance(sources, list) or any(not isinstance(s, str) or s not in source_names for s in sources):
            raise ValueError('У раздела «%s» изменился источник.' % name)
        if not isinstance(files, list) or len(files) > len(base):
            raise ValueError('Проверь список фотографий раздела «%s».' % name)
        clean_files = []
        for path in files:
            if not isinstance(path, str) or path not in base:
                raise ValueError('Фотография не найдена в текущей витрине.')
            if path in assigned:
                raise ValueError('Одна фотография указана в витрине дважды.')
            assigned.add(path)
            clean_files.append(path)
        clean.append({'id': sid, 'name': name.strip(), 'sources': sources, 'files': clean_files})
    section_order = value.get('section_order', [x['id'] for x in clean])
    if not isinstance(section_order, list) or set(section_order) != ids:
        raise ValueError('Проверь порядок разделов витрины.')
    hidden = sorted(base - assigned)
    return {'version': 1, 'sections': clean, 'section_order': section_order, 'hidden_files': hidden}