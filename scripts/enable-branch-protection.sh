#!/usr/bin/env bash
# Enable branch protection on main. Requires `gh` CLI authenticated
# as a repo admin. Run once, manually, from a trusted terminal.
#
# After this script, `main` requires:
#   - Pull request before merge
#   - 1 approval
#   - All CI status checks green (test, build, link-check, markdown-lint)
#   - No force pushes
#   - No branch deletion
#
# The CI workflow's job names must match the `checks` array below EXACTLY.

set -euo pipefail

REPO="${REPO:-yanmengli123/ymllblog}"
BRANCH="${BRANCH:-main}"

# Read the GitHub node_id for the branch
BRANCH_ID=$(gh api "repos/${REPO}/branches/${BRANCH}" --jq '.node_id')
echo "Branch ${BRANCH} node_id: ${BRANCH_ID}"

# Apply the ruleset. GitHub's branch-protection API requires a specific JSON shape.
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "repos/${REPO}/rulesets" \
  --input - <<'JSON'
{
  "name": "main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    { "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true
      }
    },
    { "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "test" },
          { "context": "build" },
          { "context": "link-check" },
          { "context": "markdown-lint" }
        ]
      }
    }
  ]
}

echo "Branch protection applied. Verify at:"
echo "  https://github.com/${REPO}/settings/rules"