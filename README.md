# pr-label

## Usage
### Config File
`.github/pr-label.json`

```json
{
  "targets": [
    {
      "label": "マイグレーション注意",
      "patterns": [
        "db/schema.rb"
      ]
    },
    {
      "label": "README",
      "patterns": [
        "README.md"
      ]
    },
    {
      "label": "JavaScript",
      "patterns": [
        "app/**/*.js"
      ]
    }
  ]
}
```


### Workflow
`.github/workflows/pr-label.yml`

```yaml
name: "Check File Changes"
on:
  - pull_request

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - name: 'Check File Changes'
        uses: enda1111/pr-label@v1
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"
```
