#!/usr/bin/env bash
# Design-system compliance. Enforces the docs/design.md rules a human reviewer
# reliably misses. Runs over src/, ignoring comment lines.
#
# ponytail: greps, not a CSS parser. Upgrade to stylelint only if these rules
# start producing false positives faster than they catch real ones.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
code() { grep -rn --include='*.tsx' --include='*.ts' --include='*.css' -- "$1" src/ \
  | grep -v ':[0-9]*: *\*' | grep -v ':[0-9]*: *//' ; }

check() {
  local name="$1" pat="$2" hits
  hits=$(code "$pat")
  if [ -n "$hits" ]; then printf '  %-28s FAIL\n%s\n' "$name" "$hits"; fail=1
  else printf '  %-28s PASS\n' "$name"; fi
}

check "bright accent + white text" 'bg-accent\([^-a-z][^"]*\)\?\(text-white\|text-surface\)'
check "opacity on text tokens"     'text-\(fg\|muted\|dim\|on-accent[a-z-]*\)/[0-9]'
check "off-scale radii"            'rounded-\['
check "arbitrary font sizes"       'text-\[[0-9]'
check "off-system font faces"      'font-\(serif\|logo\)[^-a-zA-Z]'
check "brand accent as text"       'text-accent[^-a-zA-Z]'
check "black shadows"              'shadow-\(sm\|md\|lg\|xl\|2xl\)[^-a-zA-Z]'

hex=$(grep -rn --include='*.tsx' -- '#[0-9a-fA-F]\{6\}' src/)
if [ -n "$hex" ]; then printf '  %-28s FAIL\n%s\n' "hardcoded hex in components" "$hex"; fail=1
else printf '  %-28s PASS\n' "hardcoded hex in components"; fi

exit $fail
