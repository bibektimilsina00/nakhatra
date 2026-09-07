"""Profile photographs on disk.

Same shape as the TTS cache next door: a directory the API owns, a name that is
a hash rather than anything a caller chose, and a `path_for` that refuses
anything this service could not have written.

The name being a hash of the bytes matters twice. A caller cannot pick a
filename, so `../../etc/passwd` is not expressible; and two people uploading the
same photograph share one file rather than two.

This is local disk, which is right for one machine and wrong for several. When
there is a second server this module gains an S3 backend and nothing above it
changes — `store()` and `path_for()` are the whole surface.
"""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

from app.core.config import get_settings

#: What a browser will actually display, and what we are willing to serve back.
ALLOWED: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

#: A profile photograph. Anything larger is a photograph nobody cropped.
MAX_BYTES = 4 * 1024 * 1024

_NAME = re.compile(r"^[0-9a-f]{40}\.(jpg|png|webp)$")


def _dir() -> Path:
    configured = get_settings().MEDIA_DIR
    base = (
        Path(configured)
        if configured
        else Path(__file__).resolve().parents[3] / "data" / "practitioner-photos"
    )
    base.mkdir(parents=True, exist_ok=True)
    return base


def store(data: bytes, content_type: str) -> str:
    """Write the image and return its name. Raises `ValueError` if unusable."""
    extension = ALLOWED.get(content_type)
    if extension is None:
        raise ValueError("That image format is not supported.")
    if not data:
        raise ValueError("That file is empty.")
    if len(data) > MAX_BYTES:
        raise ValueError("That image is larger than 4MB.")

    name = f"{hashlib.sha1(data).hexdigest()}.{extension}"  # noqa: S324 -- naming, not security
    path = _dir() / name
    if not path.exists():
        path.write_bytes(data)
    return name


def path_for(name: str) -> Path | None:
    """The file, or None. Rejects any name this service could not have written."""
    if not _NAME.match(name):
        return None
    path = _dir() / name
    return path if path.is_file() else None


def url_for(name: str) -> str:
    return f"/v1/practitioners/photos/{name}"
