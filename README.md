# selectplot

A scatter plot widget for Positron's Plots pane (and Jupyter). Drag a box over
points and they are copied to your clipboard as a NumPy array.

```python
import numpy as np
import selectplot

x = np.random.randn(200)
y = x + np.random.randn(200) * 0.5
plot = selectplot.scatter(x, y)
plot
```

Drag to select. The clipboard now holds text like:

```python
np.array([[ 0.12, -0.34],
          [ 1.05,  0.98]])
```

The selection is also available in Python as `plot.selected`, an `(n, 2)` array,
and `plot.selected_indices`. Click without dragging to clear the selection.

The copy happens in the Python process (`pbcopy` on macOS, `clip` on Windows,
`wl-copy`/`xclip`/`xsel` on Linux). In a remote session, it goes to the remote
machine's clipboard.

## Install

```bash
pip install -e .
```
