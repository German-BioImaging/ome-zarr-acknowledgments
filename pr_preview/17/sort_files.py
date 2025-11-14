#!/usr/bin/env python3
import yaml
from pathlib import Path


def sort_yaml(path, key, sort_field, prefix=""):
    data = yaml.safe_load(Path(path).read_text())
    data[key] = sorted(data[key], key=lambda item: item.get(sort_field, ""))
    Path(path).write_text(
        prefix + yaml.safe_dump(data, sort_keys=False, allow_unicode=True)
    )


sort_yaml("people.yaml", "people", "name")
sort_yaml(
    "affiliation_shortener.yaml",
    "affiliations",
    "short_name",
    "# affiliation_shortener.yaml\n",
)
