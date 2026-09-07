"""Pulling finished sections out of a half-received JSON array.

The model writes one array of seven section objects. Waiting for the closing
bracket means a minute of blank screen; but a partial array is not valid JSON,
so it cannot simply be parsed on every chunk.

What is well-defined is the *boundary*: scan for the top-level object that
starts after the last one ended, and hand it over the moment its brace closes.
Everything else — the array's own brackets, whitespace, commas — is skipped, and
a brace inside a string or escaped by a backslash is not a boundary at all.
That last part is why this is a scanner and not a `count("{") == count("}")`:
Nepali and Hindi text is full of quotes, and a remedy titled "Vishnu \"Sahasranama\""
would otherwise end the object early.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SectionScanner:
    """Feed it text as it arrives; it yields each object once it closes."""

    buffer: str = ""
    #: Where the current top-level object began, or None between objects.
    _start: int | None = field(default=None, repr=False)
    _depth: int = field(default=0, repr=False)
    _in_string: bool = field(default=False, repr=False)
    _escaped: bool = field(default=False, repr=False)
    _cursor: int = field(default=0, repr=False)

    def feed(self, chunk: str) -> list[dict[str, Any]]:
        """Append `chunk` and return whatever objects completed because of it."""
        self.buffer += chunk
        done: list[dict[str, Any]] = []

        while self._cursor < len(self.buffer):
            char = self.buffer[self._cursor]
            self._cursor += 1

            if self._in_string:
                if self._escaped:
                    self._escaped = False
                elif char == "\\":
                    self._escaped = True
                elif char == '"':
                    self._in_string = False
                continue

            if char == '"':
                self._in_string = True
            elif char == "{":
                if self._depth == 0:
                    self._start = self._cursor - 1
                self._depth += 1
            elif char == "}":
                self._depth -= 1
                if self._depth == 0 and self._start is not None:
                    raw = self.buffer[self._start : self._cursor]
                    self._start = None
                    try:
                        parsed = json.loads(raw)
                    except json.JSONDecodeError:
                        continue
                    if isinstance(parsed, dict):
                        done.append(parsed)
                elif self._depth < 0:
                    # The array's own closing bracket cannot get here, but a
                    # malformed stream could. Reset rather than go negative.
                    self._depth = 0

        return done
