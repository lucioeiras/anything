# End-to-end tests

The E2E build starts with a clean local library named `E2E Library`. This behavior is enabled only by the `e2e` EAS build profile through `EXPO_PUBLIC_E2E`.

Build an installable app, then run Maestro against a connected simulator or device:

```sh
bunx eas-cli build --profile e2e --platform ios
bunx eas-cli build --profile e2e --platform android
APP_ID=<the app's native bundle identifier> bun run test:e2e
```

Use the iOS simulator build with an iOS simulator, or the Android APK with an Android device/emulator. The flows reset app state before each scenario. Native image and PDF pickers, plus API backed metadata searches, require platform fixtures or a test service before their successful save paths can be tested reliably; their add form navigation is covered without depending on live services.
