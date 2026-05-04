#!/usr/bin/env bash
# Detect token renames that don't carry a version bump.
#
# Usage:
#   ./scripts/diff-tokens.sh                     # diff against last commit
#   ./scripts/diff-tokens.sh main..HEAD          # diff a range
#
# Logic:
#   1. Find tokens declared in glacial.css at HEAD vs the comparison base
#   2. If token names changed (added/removed):
#      - Check that VERSION file changed in the same diff
#      - Check the change is consistent with semver (MAJOR for removals)
#   3. Exit 1 with explanation if a rename slipped without a bump
#
# Run this in CI on every PR that modifies glacial.css.
#
# POSIX-friendly. Requires git.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RANGE="${1:-HEAD~1..HEAD}"

# Parse the range into base and head
case "$RANGE" in
  *..*) BASE="${RANGE%..*}"; HEAD="${RANGE#*..}" ;;
  *)    BASE="$RANGE";       HEAD="HEAD" ;;
esac

# Tokens at base
BASE_TOKENS=$(git show "$BASE:glacial.css" 2>/dev/null \
  | grep -Eho -- '--[a-zA-Z0-9_-]+:' \
  | sed -E 's/:$//' \
  | sort -u || true)
# Tokens at head
HEAD_TOKENS=$(git show "$HEAD:glacial.css" 2>/dev/null \
  | grep -Eho -- '--[a-zA-Z0-9_-]+:' \
  | sed -E 's/:$//' \
  | sort -u || true)

if [ -z "$BASE_TOKENS" ]; then
  echo "WARN: no tokens at base $BASE — assuming initial commit, skipping diff"
  exit 0
fi

ADDED=$(comm -13 <(echo "$BASE_TOKENS") <(echo "$HEAD_TOKENS") || true)
REMOVED=$(comm -23 <(echo "$BASE_TOKENS") <(echo "$HEAD_TOKENS") || true)
N_ADDED=$(echo "$ADDED" | grep -c '.' || true)
N_REMOVED=$(echo "$REMOVED" | grep -c '.' || true)

if [ "$N_ADDED" -eq 0 ] && [ "$N_REMOVED" -eq 0 ]; then
  echo "✓ No token names changed in $RANGE"
  exit 0
fi

# Get version at base and head
BASE_VERSION=$(git show "$BASE:VERSION" 2>/dev/null | head -1 | tr -d '[:space:]' || echo "")
HEAD_VERSION=$(git show "$HEAD:VERSION" 2>/dev/null | head -1 | tr -d '[:space:]' || echo "")

echo "Token diff in $RANGE:"
[ "$N_ADDED" -gt 0 ] && { echo "  Added ($N_ADDED):"; echo "$ADDED" | sed 's/^/    + /'; }
[ "$N_REMOVED" -gt 0 ] && { echo "  Removed ($N_REMOVED):"; echo "$REMOVED" | sed 's/^/    - /'; }
echo "  Version: $BASE_VERSION → $HEAD_VERSION"

# A removal is a MAJOR-level change. An addition is MINOR.
if [ "$BASE_VERSION" = "$HEAD_VERSION" ]; then
  echo "" >&2
  echo "ERROR: Token names changed but VERSION did not bump." >&2
  echo "  - Adding tokens requires a MINOR bump." >&2
  echo "  - Removing tokens requires a MAJOR bump (with one MINOR cycle of deprecation first)." >&2
  exit 1
fi

# Check semver direction
parse_major() { echo "$1" | cut -d. -f1; }
parse_minor() { echo "$1" | cut -d. -f2; }
BASE_MAJOR=$(parse_major "$BASE_VERSION")
HEAD_MAJOR=$(parse_major "$HEAD_VERSION")
BASE_MINOR=$(parse_minor "$BASE_VERSION")
HEAD_MINOR=$(parse_minor "$HEAD_VERSION")

if [ "$N_REMOVED" -gt 0 ] && [ "$HEAD_MAJOR" = "$BASE_MAJOR" ]; then
  echo "" >&2
  echo "ERROR: Tokens removed but VERSION major did not bump ($BASE_VERSION → $HEAD_VERSION)." >&2
  echo "Removing public tokens is a breaking change. Bump MAJOR." >&2
  exit 1
fi

if [ "$N_ADDED" -gt 0 ] && [ "$HEAD_MINOR" = "$BASE_MINOR" ] && [ "$HEAD_MAJOR" = "$BASE_MAJOR" ]; then
  echo "" >&2
  echo "ERROR: Tokens added but VERSION minor did not bump ($BASE_VERSION → $HEAD_VERSION)." >&2
  echo "Adding public tokens is a MINOR-level change. Bump MINOR." >&2
  exit 1
fi

echo "✓ Token changes match version bump"
exit 0
