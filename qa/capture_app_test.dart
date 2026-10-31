import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jisr/app/l10n/strings.dart';
import 'package:jisr/core/state/app_controller.dart';
import '../../mobile/test/widget_test.dart' as harness;

// Capture real Flutter widgets, never translate or paint over screenshot text.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async {
    for (final item in {
      'Manrope': ['assets/fonts/Manrope.ttf'],
      'MaterialIcons': ['fonts/MaterialIcons-Regular.otf'],
      'packages/cupertino_icons/CupertinoIcons': ['packages/cupertino_icons/assets/CupertinoIcons.ttf'],
      'IBM Plex Sans Arabic': ['assets/fonts/IBMPlexSansArabic-Regular.ttf', 'assets/fonts/IBMPlexSansArabic-SemiBold.ttf'],
    }.entries) {
      final loader = FontLoader(item.key);
      for (final asset in item.value) { loader.addFont(rootBundle.load(asset)); }
      await loader.load();
    }
  });
  for (final language in ['ar', 'fr', 'en']) {
    testWidgets('Website captures $language', (tester) async {
      final state = AppController(store: harness.MemoryStore())..language = language;
      final strings = JisrStrings(language);
      await harness.mount(tester, state);
      await expectLater(find.byKey(harness.screen), matchesGoldenFile('../assets/screens/home-$language.png'));
      await harness.tapText(tester, strings.get('foods'));
      await expectLater(find.byKey(harness.screen), matchesGoldenFile('../assets/screens/gallery-$language.png'));
      await harness.tapText(tester, strings.get('bread'));
      await expectLater(find.byKey(harness.screen), matchesGoldenFile('../assets/screens/detail-$language.png'));
      await tester.binding.handlePopRoute();
      await tester.pumpAndSettle();
      await tester.binding.handlePopRoute();
      await tester.pumpAndSettle();
      await harness.tab(tester, strings.get('settings'));
      await expectLater(find.byKey(harness.screen), matchesGoldenFile('../assets/screens/settings-$language.png'));
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  }
}
