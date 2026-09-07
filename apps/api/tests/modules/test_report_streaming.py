"""The scanner that turns a half-received JSON array into finished sections.

This is the one piece of streaming with real edge cases: the model's text
arrives split at arbitrary byte boundaries, and Devanagari remedy titles are
full of quotes and escapes. A naive brace count gets all of these wrong.
"""

from __future__ import annotations

import json

import pytest

from app.modules.report.streaming import SectionScanner

SECTIONS = [
    {"id": "personality", "title": "Personality", "content": ["a"]},
    {"id": "remedies", "title": 'Vishnu "Sahasranama"', "content": ["b"]},
]
DOC = json.dumps(SECTIONS)


def test_objects_arrive_one_at_a_time_not_all_at_the_end() -> None:
    scanner = SectionScanner()
    first_half = DOC[: DOC.index("},") + 2]
    assert scanner.feed(first_half) == [SECTIONS[0]]
    assert scanner.feed(DOC[len(first_half) :]) == [SECTIONS[1]]


@pytest.mark.parametrize("size", [1, 3, 7, 50, 10_000])
def test_any_chunk_size_yields_the_same_sections(size: int) -> None:
    """The network splits wherever it likes, including mid-escape."""
    scanner = SectionScanner()
    out = []
    for i in range(0, len(DOC), size):
        out.extend(scanner.feed(DOC[i : i + size]))
    assert out == SECTIONS


def test_a_brace_inside_a_string_does_not_end_the_object() -> None:
    doc = json.dumps([{"id": "a", "title": "not }{ an object", "content": []}])
    assert SectionScanner().feed(doc) == json.loads(doc)


def test_devanagari_with_escaped_quotes_survives() -> None:
    section = {"id": "remedies", "title": 'हनुमान "चालीसा" पाठ', "content": ["नित्य"]}
    assert SectionScanner().feed(json.dumps([section])) == [section]


def test_nested_objects_are_not_mistaken_for_sections() -> None:
    """`reasoning` is a list of objects; only the top-level section counts."""
    section = {
        "id": "personality",
        "reasoning": [{"placement": "Moon in Cancer", "explanation": "why"}],
    }
    assert SectionScanner().feed(json.dumps([section])) == [section]


def test_an_unclosed_object_yields_nothing_rather_than_guessing() -> None:
    assert SectionScanner().feed('[{"id": "personality", "title": "Per') == []


def test_prose_before_the_array_is_skipped() -> None:
    """Models like to say "Here is your report:" first."""
    scanner = SectionScanner()
    assert scanner.feed("Here is the report:\n```json\n" + DOC) == SECTIONS
