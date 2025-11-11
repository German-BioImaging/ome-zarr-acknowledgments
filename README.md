# OME-Zarr Acknowledgments

This repository keeps a curated list of people, affiliations, and resources tied to the OME-Zarr/OME-NGFF ecosystem, and serves the acknowledgments page published from this data.

## How it works

| File                                                       | Purpose                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`people.yaml`](people.yaml)                               | Holds the canonical list of people, their affiliations, and optional ORCIDs.                                 |
| [`resources.yaml`](resources.yaml)                         | Lists the papers, datasets, tools, and events, and the people linked to each (including the `others` group). |
| [`affiliation_shortener.yaml`](affiliation_shortener.yaml) | Maps long-form affiliations to short labels, country codes, and optional ordering preferences.               |
| [`index.html`](index.html)                                 | Loads the YAML files in the browser and renders the public acknowledgments view.                             |

Anyone with at least one affiliation and a `resource` entry in [`resources.yaml`](resources.yaml) other than the image.sc forum appears in the highlighted contributors section near the top of the page.

## Add a missing name

### Let us know

Contact [Tiago](https://tiago.bio.br) or open an [issue](https://github.com/german-BioImaging/ome-zarr-acknowledgements/issues/new?template=add-contributor.yml) if you prefer not to edit the files yourself.

### Open a pull request yourself

1. Fork this repository.
2. Add the person to [`people.yaml`](people.yaml) with their full name, any available ORCID, and at least one affiliation. For example:

    ```
      - name: Jane Doe
        orcid: https://orcid.org/0000-0000-0000-0000
        affiliations:
          - Example Imaging Center, Example City, Country
    ```

3. Link the person to at least one entry in [`resources.yaml`](resources.yaml). Either append them to an existing block or add a new resource:

    ```
      - title: Example workshop
        url: https://example.org/workshop
        people:
          - Jane Doe
    ```

   If nothing specific fits yet, list the person under the `others` resource in the same file.
4. Confirm each affiliation listed in `people.yaml` has a matching entry with a `short_name` in [`affiliation_shortener.yaml`](affiliation_shortener.yaml); add one if necessary.
5. Open a pull request describing the change.

## Modify existing information

1. Edit the relevant entry in [`people.yaml`](people.yaml); every person listed there should keep at least one affiliation and, if possible, an ORCID.
2. Adjust [`resources.yaml`](resources.yaml) whenever the set of contributors for a paper, dataset, tool, or event changes (including the `others` group).
3. Update [`affiliation_shortener.yaml`](affiliation_shortener.yaml) whenever you rename, add, or remove affiliations so the short names and countries stay in sync.
4. If you change data that affects how the site renders, preview [`index.html`](index.html) locally (for example via `python -m http.server`) to confirm everything looks right.

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

## Seed new data

- Use an LLM to extract affiliations and format YAML directly from PDF author lists.
- Call the CrossRef API (for example https://api.crossref.org/works/10.1038/s41592-021-01326-w) to enrich the metadata.
- Copy subscribers from https://imagesc.zulipchat.com/#narrow/channel/328251-NGFF into an LLM prompt for fast formatting.
- Link contributors to the appropriate papers, datasets, or events in [`resources.yaml`](resources.yaml).
- Shorten new affiliations by adding entries to [`affiliation_shortener.yaml`](affiliation_shortener.yaml).

## Updates

Direct pull requests that update [`people.yaml`](people.yaml), [`resources.yaml`](resources.yaml), or [`affiliation_shortener.yaml`](affiliation_shortener.yaml) are always welcome.

## LLM usage note

A good part of the code and text extraction was done with aid of GPT-5 and GPT-5 codex. Names were reviewed manually and the final page was tweaked manually. 