# Easy English — Android learning app

30 progressive English levels; level 1 includes all A–Z. Sorani Kurdish translation, review, voice practice, Gemin AI teacher with Bring Your Own Key and an interactive colorful icon design. App text and progress remain local on device.

The main app is bundled offline as HTML in Android WebView and Java bridge. Male voice needs a supported device voice in this lightweight GitHub build; the original full ZIP has a separate offline voice package. The Gemini key is entered by the user and encrypted locally with Android Keystore when remembered. **Never commit a real Gemini key to the repository.** For public distribution, use a controlled backend or Firebase AI Logic/App Check, not unrestricted client keys.

To build, open the GitHub Actions workflow **Build Easy English APK** and download its debug artifact on success. Or open project in Android Studio and build APK. This project is a test build and is not production-signed.

© Didar ismail
