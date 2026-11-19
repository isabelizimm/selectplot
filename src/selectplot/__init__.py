"""Scatter plot widget: drag a box over points to copy them to the clipboard."""

import pathlib
import shutil
import subprocess
import sys

import anywidget
import numpy as np
import traitlets

__all__ = ["Scatter", "scatter"]

_CLIPBOARD_COMMANDS = {
    "darwin": [["pbcopy"]],
    "win32": [["clip"]],
    "linux": [
        ["wl-copy"],
        ["xclip", "-selection", "clipboard"],
        ["xsel", "--clipboard", "--input"],
    ],
}


def _copy_to_clipboard(text):
    """Copy text with the platform's clipboard command. Return True on success."""
    for cmd in _CLIPBOARD_COMMANDS.get(sys.platform, []):
        if shutil.which(cmd[0]):
            try:
                subprocess.run(cmd, input=text, text=True, check=True)
                return True
            except (OSError, subprocess.CalledProcessError):
                pass
    return False


def _as_text(points):
    prefix = "np.array("
    body = np.array2string(points, separator=", ", threshold=sys.maxsize, prefix=prefix)
    return f"{prefix}{body})"


class Scatter(anywidget.AnyWidget):
    """Scatter plot. Drag a box to select points; they are copied to the clipboard."""

    _esm = pathlib.Path(__file__).parent / "scatter.js"

    x = traitlets.List().tag(sync=True)
    y = traitlets.List().tag(sync=True)
    selected_indices = traitlets.List().tag(sync=True)
    message = traitlets.Unicode("Drag to select points").tag(sync=True)

    def __init__(self, x, y, **kwargs):
        x = np.asarray(x, dtype=float).ravel()
        y = np.asarray(y, dtype=float).ravel()
        if x.shape != y.shape:
            raise ValueError(f"x and y must have the same length, got {x.size} and {y.size}")
        super().__init__(x=x.tolist(), y=y.tolist(), **kwargs)

    @property
    def selected(self):
        """The selected points as an (n, 2) array of x, y."""
        idx = np.asarray(self.selected_indices, dtype=int)
        return np.column_stack([np.asarray(self.x)[idx], np.asarray(self.y)[idx]])

    @traitlets.observe("selected_indices")
    def _on_select(self, change):
        n = len(self.selected_indices)
        if n == 0:
            self.message = "Drag to select points"
        elif _copy_to_clipboard(_as_text(self.selected)):
            self.message = f"{n} points copied to clipboard"
        else:
            self.message = f"{n} points selected (clipboard unavailable, use .selected)"


def scatter(x, y):
    """Create a selectable scatter plot of x and y."""
    return Scatter(x, y)
