import yaml
from pathlib import Path

BASE = Path(__file__).parent.parent
CONTRIBS_PATH = BASE / "contribs.yaml"
PEOPLE_PATH = BASE / "people.yaml"

GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_section(title):
    print(f"\n{'─' * 50}")
    print(f"  {title}")
    print(f"{'─' * 50}")


def print_ok(msg):
    print(f"  {GREEN}✓{RESET} {msg}")


def print_missing(missing, alt_matched, label):
    if alt_matched:
        print(f"  {BLUE}ℹ{RESET} Found via alt_names ({label}):")
        for item in sorted(alt_matched):
            print(f"      • {item}")
    if missing:
        print(f"  {YELLOW}⚠{RESET} Missing {label}:")
        for item in sorted(missing):
            print(f"      • {item}")
    if not missing and not alt_matched:
        print_ok(f"All {label} present")


def check_names(names_to_check, main_names, alt_names):
    """Returns (missing, alt_matched) sets."""
    missing = set()
    alt_matched = set()
    for name in names_to_check:
        if name in main_names:
            continue
        elif name in alt_names:
            alt_matched.add(name)
        else:
            missing.add(name)
    return missing, alt_matched


def main():
    if not CONTRIBS_PATH.exists():
        print(f"Error: {CONTRIBS_PATH} not found")
        return
    if not PEOPLE_PATH.exists():
        print(f"Error: {PEOPLE_PATH} not found")
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

    # parse people_yaml
    people_in_people_yaml = set()
    alt_names_in_people_yaml = set()
    github_in_people_yaml = set()
    orcid_in_people_yaml = set()
    
    if "people" in people_data and people_data["people"]:
        for person in people_data["people"]:
            if "name" in person:
                people_in_people_yaml.add(person["name"])
            if "alt_names" in person and person["alt_names"]:
                for alt in person["alt_names"]:
                    alt_names_in_people_yaml.add(alt)
            if "github" in person and person["github"]:
                github_in_people_yaml.add(person["github"].lower())
            if "orcid" in person and person["orcid"]:
                orcid = person["orcid"]
                if orcid.startswith("https://orcid.org/"):
                    orcid = orcid.replace("https://orcid.org/", "")
                orcid_in_people_yaml.add(orcid)

    # Validate RFCs
    print_section("RFCs")
    missing, alt_matched = check_names(people_in_contribs, people_in_people_yaml, alt_names_in_people_yaml)
    print_missing(missing, alt_matched, "names")

    # Validate repos
    print_section("Repos")
    github_in_contribs = set()
    if "repos" in contribs_data:
        for repo_name, contributors in contribs_data["repos"].items():
            for contributor in contributors:
                github_in_contribs.add(contributor.lower())
    missing_github = github_in_contribs - github_in_people_yaml
    print_missing(missing_github, set(), "GitHub handles")

    # Validate ngff_spec_author
    if "ngff_spec_author" in contribs_data and contribs_data["ngff_spec_author"]:
        print_section("NGFF Spec Authors")
        ngff_names = set()
        ngff_github = set()
        ngff_orcid = {}  # orcid -> name mapping
        for author in contribs_data["ngff_spec_author"]:
            name = author.get("name", "Unknown")
            if "name" in author:
                ngff_names.add(author["name"])
            if "github" in author and author["github"]:
                ngff_github.add(author["github"].lower())
            if "orcid" in author and author["orcid"]:
                ngff_orcid[author["orcid"]] = name

        missing, alt_matched = check_names(ngff_names, people_in_people_yaml, alt_names_in_people_yaml)
        print_missing(missing, alt_matched, "names")
        print_missing(ngff_github - github_in_people_yaml, set(), "GitHub handles")
        
        # ORCID with names
        missing_orcids = set(ngff_orcid.keys()) - orcid_in_people_yaml
        if missing_orcids:
            print(f"  {YELLOW}⚠{RESET} Missing ORCIDs:")
            for orcid in sorted(missing_orcids):
                print(f"      • {orcid} ({ngff_orcid[orcid]})")
        else:
            print_ok("All ORCIDs present")

    print()


if __name__ == "__main__":
    main()
