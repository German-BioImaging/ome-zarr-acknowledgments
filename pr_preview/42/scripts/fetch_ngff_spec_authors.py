import requests
from pathlib import Path
import yaml
import logging

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO
)

AUTHORS_URL = "https://raw.githubusercontent.com/ome/ngff-spec/refs/heads/main/authors.yml"

BASE = Path(__file__).parent.parent
CONTRIBS_PATH = BASE / "contribs.yaml"


def main():
    logging.info(f"Fetching authors from {AUTHORS_URL}")
    response = requests.get(AUTHORS_URL)
    response.raise_for_status()

    authors_data = yaml.safe_load(response.text)
    authors_list = authors_data.get("project", {}).get("authors", [])

    if not authors_list:
        logging.error("No authors found in the remote authors.yml")
        return

    logging.info(f"Found {len(authors_list)} authors")

    contribs_data = yaml.safe_load(CONTRIBS_PATH.read_text())
    contribs_data["ngff_spec_author"] = authors_list
    CONTRIBS_PATH.write_text(yaml.dump(contribs_data, sort_keys=False, allow_unicode=True))

    logging.info(f"Updated {CONTRIBS_PATH} with ngff_spec_author field")


if __name__ == "__main__":
    main()
