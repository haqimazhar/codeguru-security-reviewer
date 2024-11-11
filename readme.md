# 🚨 CodeGuru Security Reviewer 🚨

A GitHub Action that parses SARIF results generated by [AWS CodeGuru Security](https://github.com/aws-actions/codeguru-security) and adds comments on specific lines of code in a pull request (PR) where issues were identified. 🎯

## 🚀 Overview

`codeguru-security-reviewer` is designed to streamline security feedback on pull requests by automatically commenting on changed lines where issues were detected by CodeGuru Security. This action ensures that only issues relevant to modified lines in a PR are displayed, helping developers focus on addressing actionable feedback without being overwhelmed.

> ⚠️ **Note:** GitHub comments can only be posted on changed lines in a PR. Therefore, some security issues identified by CodeGuru may not be commented on if they are not related to the modified lines in the PR. Additionally, scans are performed at the path level, so only issues from those paths will be included in comments.

## 🛠️ How It Works

1. **🔍 SARIF Parsing**: This action fetches the SARIF file generated by `aws-actions/codeguru-security@v1` and processes it to extract relevant security findings.
2. **💬 Commenting on Changed Lines**: For each security issue detected on a changed line, it posts a comment on the PR. Only modified lines are commented on, providing a more focused review.
3. **ℹ️ Disclaimer**: Results will only be posted if they match the lines changed in the pull request.

## ⚙️ Inputs

| Input                  | Description                                                                                  | Required | Default                                |
|------------------------|----------------------------------------------------------------------------------------------|----------|----------------------------------------|
| `token`                | 🔑 GitHub token for authentication.                                                          | ✅ Yes   |                                        |
| `repository`           | 📂 GitHub repository in `owner/repo` format.                                                 | ✅ Yes   |                                        |
| `pull_request_number`  | 📝 Pull request number where comments will be added.                                         | ✅ Yes   |                                        |
| `sarif_path`           | 🛡️ Path to the SARIF file generated by CodeGuru Security.                                    | ❌ No    | `codeguru-security-results.sarif.json` |
| `initial_commit_sha`   | 🧩 SHA of the initial commit in the pull request.                                            | ✅ Yes   |                                        |

## 📝 Usage

In your GitHub workflow file, add this step to comment on the PR based on the SARIF scan results:

```yaml
- name: CodeGuru Security Reviewer
  uses: <owner>/<repo>@<version>
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    repository: ${{ github.repository }}
    pull_request_number: ${{ github.event.pull_request.number }}
    sarif_path: codeguru-security-results.sarif.json
    initial_commit_sha: ${{ github.event.pull_request.head.sha }}


# 📚 Example Workflow

Here's an example workflow using `aws-actions/codeguru-security` to run a security scan and then `codeguru-security-reviewer` to comment on the PR with the results:

```yaml
name: CodeGuru Security Scan 🔒

on:
  pull_request:
    branches:
      - 'main'

jobs:
  scan-and-comment:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code 📂
        uses: actions/checkout@v2

      - name: Run CodeGuru Security Scan 🔍
        uses: aws-actions/codeguru-security@v1
        with:
          source_path: .
          aws_region: us-west-2

      - name: CodeGuru Security Reviewer 💬
        uses: <owner>/codeguru-security-reviewer@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          repository: ${{ github.repository }}
          pull_request_number: ${{ github.event.pull_request.number }}
          sarif_path: codeguru-security-results.sarif.json
          initial_commit_sha: ${{ github.event.pull_request.head.sha }}