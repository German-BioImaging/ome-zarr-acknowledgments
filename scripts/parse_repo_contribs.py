import requests
from pathlib import Path
import yaml
import logging

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO
)

REPOS = ("ome/ngff", "ome/ngff-spec")

BASE = Path(__file__).parent.parent

contribs_path = BASE / "contribs.yaml"

# Read contribs.yaml, modify data in `repos` key, and write back to file
data = contribs_path.read_text()
data = yaml.safe_load(data)


for repo in REPOS:

    # Get all contributors via GitHub API
    # per_page=100 is the maximum allowed by GitHub, so we get all contributors in one request
    url = f"https://api.github.com/repos/{repo}/contributors?per_page=100"
    response = requests.get(url)
    contributors = response.json()

    logging.debug(f"Got {len(contributors)} contributors for {repo}")

    # If we get more than 90 contributors, we cut it short, but warn
    if len(contributors) > 90:
        logging.warning(
            f"Got {len(contributors)} contributors for {repo}, there may be more that are not included."
        )

    # Extract login and contributions count for each contributor
    contribs = {
        contributor["login"]: contributor["contributions"]
        for contributor in contributors
    }

    # Update the `repos` key in the data, sorted by contributions count
    data["repos"][repo] = dict(
        sorted(contribs.items(), key=lambda item: item[1], reverse=True)
    )

# Write the updated data back to contribs.yaml
contribs_path.write_text(yaml.dump(data, sort_keys=False))
