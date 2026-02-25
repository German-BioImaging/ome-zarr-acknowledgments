import yaml
from pathlib import Path
import logging

logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s", level=logging.INFO
)

BASE = Path(__file__).parent.parent

CONTRIBS_PATH = BASE / "contribs.yaml"
PEOPLE_PATH = BASE / "people.yaml"


def main():
    if not CONTRIBS_PATH.exists():
        logging.error(f"File not found: {CONTRIBS_PATH}")
        return
    if not PEOPLE_PATH.exists():
        logging.error(f"File not found: {PEOPLE_PATH}")
        return

    contribs_data = yaml.safe_load(CONTRIBS_PATH.read_text())
    people_data = yaml.safe_load(PEOPLE_PATH.read_text())

    people_in_contribs = set()

    # parse rfcs, extract names of people
    if "rfcs" in contribs_data:
        for rfc_name, rfc_content in contribs_data["rfcs"].items():
            for role in ["author", "reviewer", "commenter", "endorser", "editor"]:
                if role in rfc_content and rfc_content[role]:
                    for person in rfc_content[role]:
                        people_in_contribs.add(person)

    # parse people_yaml, extract names of people
    people_in_people_yaml = set()
    github_in_people_yaml = set()
    
    if "people" in people_data and people_data["people"]:
        for person in people_data["people"]:
            if "name" in person:
                people_in_people_yaml.add(person["name"])
            if "github" in person and person["github"]:
                github_in_people_yaml.add(person["github"].lower())

    # see if all people in contribs appear in people.yaml. If not, print a warning with the missing names.
    missing_people = people_in_contribs - people_in_people_yaml
    if missing_people:
        logging.warning("The following people listed in contribs.yaml (rfcs) are missing from people.yaml:")
        for name in sorted(missing_people):
            logging.warning(f"  - {name}")
    else:
        logging.info("All people in contribs.yaml (rfcs) are present in people.yaml.")

    # now, do the same for github contributors in repos, and see if they appear in people.yaml.
    # If not, print a warning with the missing names.
    github_in_contribs = set()
    if "repos" in contribs_data:
        for repo_name, contributors in contribs_data["repos"].items():
            for contributor in contributors:
                github_in_contribs.add(contributor.lower())

    missing_github = github_in_contribs - github_in_people_yaml
    if missing_github:
        logging.warning("The following GitHub handles listed in contribs.yaml (repos) are missing from people.yaml:")
        for handle in sorted(missing_github):
            logging.warning(f"  - {handle}")
    else:
        logging.info("All GitHub handles in contribs.yaml (repos) are present in people.yaml.")


if __name__ == "__main__":
    main()
