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

const PATCH = `
  ${PATCH_MARKER}
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'gnu++20'
      defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
      defs = [defs] unless defs.is_a?(Array)
      defs << 'FMT_USE_CONSTEVAL=0' unless defs.any? { |d| d.to_s.include?('FMT_USE_CONSTEVAL') }
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs
    end
  end`;

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

      // Splice our patch in just before the closing `end` of the
      // existing `post_install do |installer| ... end` block.
      const replaced = podfile.replace(
        /(post_install\s+do\s+\|installer\|[\s\S]*?)\n(end\s*$)/m,
        `$1${PATCH}\n$2`
      );

      if (replaced === podfile) {
        console.warn(
          '[withFmtConstevalFix] post_install block not found in Podfile; skipping patch'
        );
        return config;
      }

      fs.writeFileSync(podfilePath, replaced);
      return config;
    },
  ]);
};
