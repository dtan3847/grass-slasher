$inputJson = [Console]::In.ReadToEnd()
$data = $inputJson | ConvertFrom-Json

if ($data.tool_name -ne 'PowerShell') { exit 0 }

$command = $data.tool_input.command
$modified = $false

# Strip: cd <path> ; <rest>  or  Set-Location <path> ; <rest>
if ($command -match '^(?:cd|Set-Location)\s+\S+\s*;\s*(.+)$') {
    $command = $Matches[1].Trim()
    $modified = $true
}

# Strip: git -C <path> <subcmd...>  →  git <subcmd...>
if ($command -match '^git\s+-C\s+\S+\s+(.+)$') {
    $command = 'git ' + $Matches[1]
    $modified = $true
}

if ($modified) {
    @{ tool_input = @{ command = $command } } | ConvertTo-Json -Compress
}
