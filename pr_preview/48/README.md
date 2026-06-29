# OME-Zarr Acknowledgments

This repository keeps a curated list of people and affiliations tied to the OME-Zarr/OME-NGFF ecosystem, and serves the acknowledgments page published from this data.

## How it works

| File                                                       | Purpose                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`people.yaml`](people.yaml)                               | Holds the canonical list of people, their affiliations, and optional details.                                 |
| [`affiliation_shortener.yaml`](affiliation_shortener.yaml) | Maps long-form affiliations to short labels and country codes.                                               |

Everyone listed in `people.yaml` appears on the page. People with affiliations are grouped by affiliation; people without affiliations appear in the additional contributors list.

## Add a missing name

### Let us know

Contact [Tiago](https://tiago.bio.br) or open an [issue](https://github.com/german-BioImaging/ome-zarr-acknowledgements/issues/new?template=add-contributor.yml) if you prefer not to edit the files yourself.

### Open a pull request yourself

1. Fork this repository.
2. Add the person to [`people.yaml`](people.yaml) with their full name, any available ORCID, and any affiliations you know. For example:

    ```
      - name: Jane Doe
        affiliations:
          - Example Imaging Center, Example City, Country
        # OPTIONAL fields:
        github: janedoegithubslug
        orcid: https://orcid.org/0000-0000-0000-0000
        alt_names: # helps when validating against other lists
            - Janeth Doe
        based_in: # helps when displaying remote workers on the map
            - BR
    ```

3. Confirm each affiliation listed in `people.yaml` has a matching entry with a `short_name` in [`affiliation_shortener.yaml`](affiliation_shortener.yaml); add one if necessary.
4. Open a pull request describing the change.

## Modify existing information

1. Edit the relevant entry in [`people.yaml`](people.yaml) and keep details up to date.
2. Update [`affiliation_shortener.yaml`](affiliation_shortener.yaml) whenever you edit affiliations so the short names and countries stay in sync.

## Control the order within an affiliation

Use the optional `order_override` parameter inside [`affiliation_shortener.yaml`](affiliation_shortener.yaml) to pin the display order for members of a specific affiliation. For example:

```
  - full_name: "German BioImaging-Gesellschaft für Mikroskopie und Bildanalyse e.V., Constance, Germany"
    short_name: "GerBI"
    country_code: "DE"
    order_override:
        - Josh Moore
        - Johannes Soltwedel
        - Tiago Lubiana
        - Janina Hanne
        - Stefanie Weidtkamp-Peters
```

## Check against other lists

Acknowledgments in NGFF stem from contributions in a wide variety of place. The [xcheck-contribs.yml](.github/workflows/xcheck-contribs.yml) action runs a set of scripts to compare the list here with multiple sources.

For example, it runs [fetch_ngff_spec_authors.py](scripts/fetch_ngff_spec_authors.py), which updates the [contribs.yaml](contribs.yaml) file. Then, it runs the [validate_contribs_vs_people.py](scripts/validate_contribs_vs_people.py) script, which contracts the manually maintained list at [people.yaml](people.yaml) with the updated files.

You can run also clone the repository and run the scripts directly, e.g.:

```
gh repo clone German-BioImaging/ome-zarr-acknowledgments

cd ome-zarr-acknowledgments

uv venv
source .venv/bin/activate
uv pip install pyyaml requests

python3 scripts/fetch_ngff_spec_authors.py
python3 validate_contribs_vs_people.py
```

## LLM usage note

A good part of the code and text extraction was done with aid of GPT-5 and GPT-5 codex. Names were reviewed and the final page was tweaked manually. If you find a bug, just let us know!
