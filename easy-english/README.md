# Easy English — Kurdish-English learning app

This is an **Android application source project** for Easy English, with 30 beginner levels, alphabet A–Z, Sorani Kurdish glosses, a colorful icon-based UI, quizzes and review, and a Gemini AI teacher requiring a personal key. The source contains **no API keys**.

The Android app code lives under `easy-english/`. GitHub Actions builds a **debug APK** from this folder. Debug APKs are for testing only and are not production signed. Some device speech features depend on installed Android services; Gemini features need API connectivity and a user-provided key. The offline male voice bundle from earlier versions is available in the separate full project ZIP, not included in this GitHub checkout; Android TTS is the fallback.

© Didar ismail
