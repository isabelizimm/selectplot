import numpy as np
import pytest

import selectplot


@pytest.fixture
def copied(monkeypatch):
    texts = []
    monkeypatch.setattr(selectplot, "_copy_to_clipboard", lambda text: texts.append(text) or True)
    return texts


def test_selection_copies_array(copied):
    plot = selectplot.scatter([1, 2, 3], [4.5, 5, 6])
    plot.selected_indices = [0, 2]

    np.testing.assert_array_equal(plot.selected, [[1, 4.5], [3, 6]])
    assert copied == ["np.array([[1. , 4.5],\n          [3. , 6. ]])"]
    assert eval(copied[0], {"np": np}).tolist() == [[1, 4.5], [3, 6]]
    assert plot.message == "2 points copied to clipboard"


def test_empty_selection_does_not_copy(copied):
    plot = selectplot.scatter([1, 2], [3, 4])
    plot.selected_indices = [1]
    plot.selected_indices = []

    assert len(copied) == 1
    assert plot.selected.shape == (0, 2)


def test_clipboard_failure_message(monkeypatch):
    monkeypatch.setattr(selectplot, "_copy_to_clipboard", lambda text: False)
    plot = selectplot.scatter([1, 2], [3, 4])
    plot.selected_indices = [0]

    assert "clipboard unavailable" in plot.message


def test_mismatched_lengths():
    with pytest.raises(ValueError):
        selectplot.scatter([1, 2], [3])
