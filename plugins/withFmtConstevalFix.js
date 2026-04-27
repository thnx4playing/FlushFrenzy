const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Inject build settings into the Podfile's existing post_install hook
// to fix libfmt's consteval build error on newer Xcode (16+) with the
// RN 0.79 / Folly stack. CocoaPods only allows ONE post_install block,
// so we splice our settings into the one Expo's prebuild already wrote.
//
// Symptom this fixes:
//   "Call to consteval function fmt::basic_format_string<char,
//    fmt::basic_string_view<char>...>::basic_format_string<FMT_COMPILE_STRING, 0>'
//    is not a constant expression"

const PATCH_MARKER = '# --- withFmtConstevalFix plugin ---';

// Locate the `post_install do |installer| ... end` block by indent.
// Ruby blocks at the same nesting level share the same leading
// whitespace, so we capture the indent of the `post_install` line
// and find the first `end` at exactly that indent — that's the
// matching close, regardless of how the block is nested.
function injectIntoPostInstall(podfile, patchLines) {
  const lines = podfile.split('\n');
  const startRegex = /^(\s*)post_install\s+do\s+\|installer\|/;

  let startLineIdx = -1;
  let indent = '';
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(startRegex);
    if (m) {
      startLineIdx = i;
      indent = m[1];
      break;
    }
  }
  if (startLineIdx === -1) return null;

  // Indent only contains whitespace; safe to splice into a regex literal.
  const endRegex = new RegExp(`^${indent}end\\s*$`);
  for (let i = startLineIdx + 1; i < lines.length; i++) {
    if (endRegex.test(lines[i])) {
      lines.splice(i, 0, ...patchLines);
      return lines.join('\n');
    }
  }
  return null;
}

module.exports = function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      if (podfile.includes(PATCH_MARKER)) {
        return config;
      }

      // Disable every fmt macro that might trigger compile-time evaluation.
      // Different fmt versions (Folly bundles 9.x or 11.x depending on RN
      // release) gate the consteval path on different macros, so we set
      // them all defensively. Also pin C++20 since fmt requires it.
      const FMT_FLAGS = [
        'FMT_USE_CONSTEVAL=0',
        'FMT_HAS_CONSTEVAL=0',
        'FMT_USE_NONTYPE_TEMPLATE_ARGS=0',
      ];
      const patchLines = [
        '',
        `    ${PATCH_MARKER}`,
        '    installer.pods_project.targets.each do |target|',
        '      target.build_configurations.each do |config|',
        `        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'gnu++20'`,
        `        defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']`,
        '        defs = [defs] unless defs.is_a?(Array)',
        `        [${FMT_FLAGS.map(f => `'${f}'`).join(', ')}].each do |flag|`,
        '          key = flag.split(\'=\').first',
        '          defs << flag unless defs.any? { |d| d.to_s.include?(key) }',
        '        end',
        `        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs`,
        '      end',
        '    end',
      ];

      const result = injectIntoPostInstall(podfile, patchLines);
      if (!result) {
        console.warn(
          '[withFmtConstevalFix] Could not locate post_install block in Podfile; skipping patch'
        );
        return config;
      }

      fs.writeFileSync(podfilePath, result);
      return config;
    },
  ]);
};
