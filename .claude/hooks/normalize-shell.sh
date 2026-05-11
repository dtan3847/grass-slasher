#!/usr/bin/env bash
input=$(cat)

tool_name=$(echo "$input" | jq -r '.tool_name')
if [ "$tool_name" != "PowerShell" ]; then
  exit 0
fi

command=$(echo "$input" | jq -r '.tool_input.command')
modified=false

# Strip: cd <path> ; <rest>  or  Set-Location <path> ; <rest>
if echo "$command" | grep -qE '^(cd|Set-Location)\s+\S+\s*;\s*'; then
  command=$(echo "$command" | sed -E 's/^(cd|Set-Location)\s+\S+\s*;\s*//')
  modified=true
fi

# Strip: git -C <path> <subcmd...>  →  git <subcmd...>
if echo "$command" | grep -qE '^git\s+-C\s+\S+\s+'; then
  command=$(echo "$command" | sed -E 's/^git\s+-C\s+\S+\s+/git /')
  modified=true
fi

if [ "$modified" = true ]; then
  jq -cn --arg cmd "$command" '{"tool_input": {"command": $cmd}}'
fi
