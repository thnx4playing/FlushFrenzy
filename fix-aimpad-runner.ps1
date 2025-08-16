
# fix-aimpad-runner.ps1
$ErrorActionPreference = 'Stop'

# 1) Locate the ToiletPaperToss.js file
$path = "src\games\ToiletPaperToss.js"
if (!(Test-Path $path)) {
  $candidate = Get-ChildItem -Recurse -Filter "ToiletPaperToss.js" | Select-Object -First 1
  if ($candidate) { $path = $candidate.FullName } else {
    Write-Error "Could not find ToiletPaperToss.js. Run this at your project root."
  }
}
Write-Host "Target:" $path

# 2) Backup
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item $path "$path.bak.$stamp"

# 3) Read file
$text = Get-Content -Raw -LiteralPath $path

# 4) Insert refs if missing
if ($text -notmatch 'runnerRef\s*=\s*useRef' -or $text -notmatch 'afterUpdateRef\s*=\s*useRef') {
  $needle = 'const [toiletPos'
  $idx = $text.IndexOf($needle)
  if ($idx -lt 0) {
    # Fallback: put after the first occurrence of "useState("
    $idx = $text.IndexOf('useState(')
  }
  $lineEnd = $text.IndexOf("`n", $idx)
  $refDecl = "`n  // Single Runner/Listener refs to prevent stacking`n  const runnerRef = useRef(null);`n  const afterUpdateRef = useRef(null);`n"
  $text = $text.Insert($lineEnd, $refDecl)
  Write-Host "Inserted runnerRef/afterUpdateRef declarations."
}

# 5) Replace the Physics runner effect with a deduped version
$anchor = "Physics runner and position mirroring"
$anchorIdx = $text.IndexOf($anchor)
if ($anchorIdx -lt 0) {
  Write-Error "Could not find the 'Physics runner and position mirroring' section."
}

# Find the useEffect that starts at/after the anchor
$useIdx = $text.IndexOf('useEffect(() => {', $anchorIdx)
if ($useIdx -lt 0) { Write-Error "Could not find useEffect after the anchor." }

# Extract that effect block up to the first matching end '});'
# We'll find the body end by balancing braces.
$bodyStart = $text.IndexOf('{', $useIdx)
$depth = 1
$i = $bodyStart + 1
while ($i -lt $text.Length -and $depth -gt 0) {
  $ch = $text[$i]
  if ($ch -eq '{') { $depth++ }
  elseif ($ch -eq '}') { $depth-- }
  $i++
}
$bodyEnd = $i - 1

# Find the closing of the useEffect call
$j = $bodyEnd
while ($j -lt $text.Length -and $text[$j] -ne ')') { $j++ }
$effectEnd = $text.IndexOf(';', $j)
$effectBlock = $text.Substring($useIdx, $effectEnd - $useIdx + 1)

# Extract the inline afterUpdate handler body: Matter.Events.on(engine, "afterUpdate", () => { ... })
$onIdx = $effectBlock.IndexOf('Matter.Events.on(engine, "afterUpdate"')
if ($onIdx -lt 0) { $onIdx = $effectBlock.IndexOf("Matter.Events.on(engine, 'afterUpdate'") }
if ($onIdx -lt 0) { Write-Error "Could not find afterUpdate registration inside the effect." }

$arrowIdx = $effectBlock.IndexOf('=>', $onIdx)
$braceStart = $effectBlock.IndexOf('{', $arrowIdx)
# Balance braces to find the end of the handler body
$depth2 = 1
$k = $braceStart + 1
while ($k -lt $effectBlock.Length -and $depth2 -gt 0) {
  $ch2 = $effectBlock[$k]
  if ($ch2 -eq '{') { $depth2++ }
  elseif ($ch2 -eq '}') { $depth2-- }
  $k++
}
$braceEnd = $k - 1
$handlerBody = $effectBlock.Substring($braceStart + 1, $braceEnd - $braceStart - 1)

# Build the new effect (keep only enginePkg as dep; we stop old runner/handler each rerun)
$newEffect = @"
useEffect(() => {
     const engine = enginePkg.engine;

     // Stop any previous runner and afterUpdate listener
     if (runnerRef.current) {
       try { Matter.Runner.stop(runnerRef.current); } catch {}
       runnerRef.current = null;
     }
     if (afterUpdateRef.current) {
       try { Matter.Events.off(engine, "afterUpdate", afterUpdateRef.current); } catch {}
       afterUpdateRef.current = null;
     }

     // Create and start one runner
     runnerRef.current = Matter.Runner.create();
     Matter.Runner.run(runnerRef.current, engine);

     // afterUpdate handler (preserving your existing logic)
     const handleAfterUpdate = (evt) => {
$handlerBody
     };
     afterUpdateRef.current = handleAfterUpdate;
     Matter.Events.on(engine, "afterUpdate", handleAfterUpdate);

     return () => {
       if (afterUpdateRef.current) {
         try { Matter.Events.off(engine, "afterUpdate", afterUpdateRef.current); } catch {}
         afterUpdateRef.current = null;
       }
       if (runnerRef.current) {
         try { Matter.Runner.stop(runnerRef.current); } catch {}
         runnerRef.current = null;
       }
       // Do not Engine.clear here; engine is shared across renders
     };
  }, [enginePkg]);
"@

# Replace the old effect with the new one
$text = $text.Replace($effectBlock, $newEffect)

# 6) Save the file
Set-Content -LiteralPath $path -Value $text -NoNewline
Write-Host "Patched $path"

# 7) Format (optional)
try {
  npx --yes prettier "$path" --write | Out-Null
  Write-Host "Formatted with Prettier."
} catch {
  Write-Host "Prettier not available; skipping format."
}
