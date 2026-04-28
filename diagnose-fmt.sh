#!/bin/bash
# diagnose-fmt.sh
# Captures everything needed to debug the fmt consteval build error.
# Run from the repo root after setup-xcode.sh has finished:
#   bash diagnose-fmt.sh
# Output goes to /tmp/fmt-diagnose.txt and stdout — paste the file
# contents back so we can pick the right fix.

set -u
OUT=/tmp/fmt-diagnose.txt

if [ ! -f "app.config.js" ]; then
    echo "ERROR: run from the FlushFrenzy repo root (app.config.js not found)" >&2
    exit 1
fi

{
    echo "=== Xcode ==="
    xcodebuild -version 2>&1 || echo "xcodebuild not found"

    echo
    echo "=== macOS ==="
    sw_vers 2>&1 || echo "sw_vers not found"

    echo
    echo "=== Last commit ==="
    git log -1 --oneline 2>&1 || echo "(not a git repo?)"

    echo
    echo "=== Podfile post_install block ==="
    if [ -f ios/Podfile ]; then
        awk '/post_install do/,0' ios/Podfile
    else
        echo "ios/Podfile not found — did setup-xcode.sh run?"
    fi

    echo
    echo "=== fmt source locations ==="
    find ios/Pods -type f \( -name "format.h" -o -name "core.h" -o -name "format-inl.h" \) 2>/dev/null | grep -i "fmt" | head -10

    echo
    echo "=== fmt version + consteval macros ==="
    while IFS= read -r f; do
        [ -z "$f" ] && continue
        echo "--- $f ---"
        grep -E "FMT_VERSION|FMT_USE_CONSTEVAL|FMT_HAS_CONSTEVAL|^#define FMT_CONSTEVAL" "$f" 2>/dev/null | head -10
    done < <(find ios/Pods -type f \( -name "core.h" -o -name "format.h" \) 2>/dev/null | grep -i "fmt")

    echo
    echo "=== Target Support Files (xcconfig) for fmt and RCT-Folly ==="
    if [ -d "ios/Pods/Target Support Files" ]; then
        ls "ios/Pods/Target Support Files/" 2>/dev/null | grep -iE "fmt|folly"
    fi
    while IFS= read -r f; do
        [ -z "$f" ] && continue
        echo "--- $f ---"
        cat "$f" 2>/dev/null
    done < <(find "ios/Pods/Target Support Files" -name "*.xcconfig" 2>/dev/null | grep -iE "fmt|folly")

    echo
    echo "=== Pods.pbxproj fmt-related build settings ==="
    if [ -f ios/Pods/Pods.xcodeproj/project.pbxproj ]; then
        grep -nE "FMT_USE_CONSTEVAL|FMT_HAS_CONSTEVAL|FMT_USE_NONTYPE_TEMPLATE_ARGS|CLANG_CXX_LANGUAGE_STANDARD" \
            ios/Pods/Pods.xcodeproj/project.pbxproj | head -60
    else
        echo "Pods.xcodeproj/project.pbxproj not found"
    fi

    echo
    echo "=== app.config.js plugin list ==="
    node -e "console.log(require('./app.config.js').expo.plugins.map(p=>Array.isArray(p)?p[0]:p).join('\n'))" 2>&1 | sed 's/^/  /'

    echo
    echo "=== withFmtConstevalFix plugin loads? ==="
    if [ -f plugins/withFmtConstevalFix.js ]; then
        node -e "require('./plugins/withFmtConstevalFix.js'); console.log('plugin loads ok')" 2>&1
    else
        echo "plugins/withFmtConstevalFix.js NOT FOUND"
    fi

    echo
    echo "=== End of diagnostic ==="
} 2>&1 | tee "$OUT"

echo
echo "Diagnostic written to: $OUT"
echo "Paste the contents of that file back to share."
