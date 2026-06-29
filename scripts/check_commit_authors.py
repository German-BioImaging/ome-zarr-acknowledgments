# https://raw.githubusercontent.com/lubianat/ome-zarr-resources/refs/heads/master/commits/data.json

import json
import requests

source_url = "https://raw.githubusercontent.com/lubianat/ome-zarr-resources/refs/heads/master/commits/data.json"
commit_data = json.loads(requests.get(source_url).text)


# e.g. {
#   "query": "\"OME-Zarr\"",
#   "generated": "2026-06-29T06:05:46+00:00",
#   "recent_days": 10,
#   "total_commits": 1130,
#   "commits": [
#     {
#       "commit_date": "2026-06-28T20:13:10.000+02:00",
#       "author": "jluethi",
#       "repository": "fractal-napari-plugins-collection/napari-ome-zarr-navigator",
#       "commit_url": "https://github.com/fractal-napari-plugins-collection/napari-ome-zarr-navigator/commit/dc9ff7e852f0bbef45fd003b87a0f5d5fa3287af"
#     },
#     {
#       "commit_date": "2026-06-28T16:34:38.000+02:00",
#       "author": "vboussot",
#       "repository": "vboussot/KonfAI",
#       "commit_url": "https://github.com/vboussot/KonfAI/commit/d15ede83079dd45bd204a6844072fd9153e3d78f"
#     },

# list like [(vboussot,1), (jluethi,1), ...] with the count of commits per author

all_authors = {}
for commit in commit_data["commits"]:
    author = commit["author"]
    if author not in all_authors:
        all_authors[author] = 0
    all_authors[author] += 1

# Check which github usernames are missing from the people.yaml file

import yaml
from pathlib import Path

BASE = Path(__file__).parent.parent
people_path = BASE / "people.yaml"

people_data = yaml.safe_load(people_path.read_text())

gh_handles_in_people = set()
for person in people_data["people"]:
    gh_handle = person.get("github")
    if gh_handle:
        gh_handles_in_people.add(gh_handle)

# Print missing authors sorted by number of commits

missing_authors = []
for author, count in all_authors.items():
    if author not in gh_handles_in_people:
        missing_authors.append((author, count))

missing_authors.sort(key=lambda x: x[1], reverse=True)
for author, count in missing_authors:
    print(f"{author}: {count} commits")
