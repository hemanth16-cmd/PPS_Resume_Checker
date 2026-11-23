"""Small chart helpers (Altair / Vega-Lite, rendered natively by Streamlit)."""

from __future__ import annotations

import altair as alt
import pandas as pd
import streamlit as st

_BAND_COLORS = {
    "light": {"green": "#3F7A5A", "orange": "#A86A22", "red": "#B3261E", "blue": "#315369", "track": "#E3E9F0", "text": "#171C21"},
    "dark": {"green": "#7FC39C", "orange": "#E0A85C", "red": "#F08A80", "blue": "#8DB8D6", "track": "#26313C", "text": "#E4E9EF"},
}


def _palette() -> dict[str, str]:
    theme_type = getattr(getattr(st.context, "theme", None), "type", None)
    return _BAND_COLORS["dark" if theme_type == "dark" else "light"]


def score_ring(score: float, max_score: float, color: str, *, size: int = 170, key: str | None = None) -> None:
    """Donut gauge with the score in the centre."""
    pal = _palette()
    value = max(0.0, min(score, max_score))
    data = pd.DataFrame(
        {"part": ["score", "rest"], "value": [value, max_score - value], "order": [0, 1]}
    )
    arc = (
        alt.Chart(data)
        .mark_arc(innerRadius=size * 0.34, outerRadius=size * 0.46, cornerRadius=4)
        .encode(
            theta=alt.Theta("value:Q", stack=True),
            order=alt.Order("order:Q"),
            color=alt.Color(
                "part:N",
                scale=alt.Scale(domain=["score", "rest"], range=[pal[color], pal["track"]]),
                legend=None,
            ),
            tooltip=alt.value(None),
        )
    )
    label = (
        alt.Chart(pd.DataFrame({"t": [f"{value:g}"]}))
        .mark_text(fontSize=size * 0.2, fontWeight=700, color=pal["text"], dy=-6)
        .encode(text="t:N")
    )
    sub = (
        alt.Chart(pd.DataFrame({"t": [f"of {max_score:g}"]}))
        .mark_text(fontSize=12, color=pal["text"], opacity=0.6, dy=size * 0.11)
        .encode(text="t:N")
    )
    chart = (
        (arc + label + sub)
        .properties(width=size, height=size)
        .configure_view(strokeWidth=0)
    )
    st.altair_chart(chart, width="content", key=key)
