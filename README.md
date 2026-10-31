# CALMandi - Mobile Mandi Management Application

**CALMandi** is an intuitive, mobile-first management application tailored for agricultural mandi owners, commission agents, and traders—particularly those with limited previous smartphone experience.

The user interface prioritizes clarity, readability, and familiarity, utilizing a clean **green-and-white theme** (`#16834A`), large touch-friendly action cards, high-contrast readable text, recognizable icons, and seamless mobile keyboard interactions.

---

## 1. Project Overview

CALMandi streamlines daily mandi directory operations across three key pillars:

1. **Customers Management**: Keep track of mandi buyers, sellers, and traders with instant 10-digit mobile number validation and business directory cards.
2. **Category Management**: Categorize commodities (e.g., *Fruits*, *Vegetables*, *Leafy Vegetables*, *Dry Fruits*) with automatic duplicate prevention.
3. **Products Catalog**: Manage agricultural produce with designated categories and standard wholesale units (*Kg*, *Crate*, *Box*, *Bag*, *Bunch*, *Piece*, *Dozen*).

---

## 2. Technology Stack

- **Framework**: [React Native 0.88.1](https://reactnative.dev/) with [Expo SDK 58](https://docs.expo.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing, zero TypeScript errors)
- **Navigation**: [React Navigation Native Stack v7](https://reactnavigation.org/)
- **Icons**: [@expo/vector-icons (Ionicons)](https://icons.expo.fyi/)
- **Safe Area Management**: [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) (Dynamic Insets for notch, home indicator, Dynamic Island)
- **State Architecture**: Lightweight React Context (`MandiContext`) maintaining session-wide sync across all screens without bulky third-party libraries.

---

## 3. Folder Structure

```text
CALMandi/
├── App.tsx                    # Root entry wrapping SafeAreas, Context, & Navigation
├── index.ts                   # Expo root component registration
├── app.json                   # Expo application metadata & icon configuration
├── package.json               # Dependencies and execution scripts
├── tsconfig.json              # TypeScript compilation configuration
│
├── assets/                    # Application icons & splash screen assets
│   ├── icon.png
│   ├── splash-icon.png
│   └── android-icon-*.png
│
├── docs/                      # Project documentation
│   └── TESTING.md             # Complete test procedures & verification checklist
│
├── screenshots/               # Directory for physical device test screenshots
│   └── README.md              # Screenshot capture guidelines & checklist
│
└── src/
    ├── context/
    │   └── MandiContext.tsx   # Shared lightweight state for customers, categories, products
    │
    ├── data/
    │   └── mockData.ts        # Initial sample data matching project specifications
    │
    ├── navigation/
    │   └── AppNavigator.tsx   # React Navigation Native Stack setup with 9 screen routes
    │
    ├── screens/
    │   ├── LoginScreen.tsx        # 10-digit mobile login with numeric keyboard
    │   ├── RegistrationScreen.tsx # Business registration with Owner/Operator toggle
    │   ├── HomeScreen.tsx         # Dashboard with 3 large action cards
    │   ├── CustomersScreen.tsx    # Customer list & counter
    │   ├── AddCustomerScreen.tsx  # Customer creation form
    │   ├── CategoriesScreen.tsx   # Category list & counter
    │   ├── AddCategoryScreen.tsx  # Category creation form with duplicate check
    │   ├── ProductsScreen.tsx     # Products catalog & counter
    │   └── AddProductScreen.tsx   # Product creation with category & unit selectors
    │
    ├── styles/
    │   └── theme.ts           # Consistent theme colors (#16834A), spacing, and borders
    │
    └── types/
        └── index.ts           # Centralized TypeScript interfaces and navigation params
```

---

## 4. Installation Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or newer recommended, Node.js 20+ supported)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app installed on your physical mobile device (Android or iOS)

### Setup Steps
1. Clone or navigate into the project directory:
   ```bash
   cd CALMandi
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Verify TypeScript compilation:
   ```bash
   npx tsc --noEmit
   ```

---

## 5. How to Start the Expo Application

Launch the Expo development server:

```bash
npx expo start
```

This starts the Metro Bundler and displays an interactive terminal QR code.

Options from the interactive menu:
- Press `a` to open in an active Android emulator or connected device.
- Press `i` to open in an iOS simulator (macOS required).
- Press `r` to reload the bundle.
- Press `c` to clear the bundler cache.

---

## 6. How to Test on Android

### Option A: Physical Android Phone (Recommended)
1. Download **Expo Go** from the Google Play Store on your phone.
2. Ensure your phone and computer are connected to the same Wi-Fi network.
3. Start the dev server:
   ```bash
   npx expo start
   ```
4. Open the camera app or Expo Go app on your phone and scan the QR code displayed in your terminal.

### Option B: Android Studio Emulator
1. Open Android Studio and launch a Virtual Device (AVD).
2. Start Expo targeting Android:
   ```bash
   npx expo start --android
   ```
3. Expo will automatically detect the running emulator, install Expo Go if needed, and open CALMandi.

---

## 7. How to Test on iPhone Using Expo Go

1. Download **Expo Go** from the Apple App Store on your iPhone.
2. Connect your iPhone to the same Wi-Fi network as your development computer.
3. Start the dev server:
   ```bash
   npx expo start
   ```
4. Open the default **Camera** app on your iPhone and point it at the QR code in the terminal.
5. Tap the notification banner that reads **Open in Expo Go**.

---

## 8. Android Build Instructions (EAS Build)

To generate a standalone `.apk` (for direct testing) or `.aab` (Android App Bundle for Google Play Store):

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
2. **Log into your Expo Account**:
   ```bash
   eas login
   ```
3. **Configure EAS Build**:
   ```bash
   eas build:configure
   ```
4. **Generate an Android APK (for testing)**:
   ```bash
   eas build --platform android --profile preview
   ```
   *EAS Build will compile the project in the cloud and provide a direct download link / QR code for the `.apk` file.*
5. **Generate an Android App Bundle (for Google Play production release)**:
   ```bash
   eas build --platform android --profile production
   ```

---

## 9. iOS Build Instructions (EAS Build)

iOS requires code signing via Apple's Developer Portal:

1. **Prerequisites**:
   - An active [Apple Developer Program](https://developer.apple.com/programs/) account ($99/year).
2. **Generate iOS Simulator Build (No paid account needed)**:
   Add a simulator configuration in `eas.json`:
   ```json
   {
     "build": {
       "simulator": {
         "ios": {
           "simulator": true
         }
       }
     }
   }
   ```
   Run:
   ```bash
   eas build --platform ios --profile simulator
   ```
3. **Generate Production IPA for TestFlight / App Store**:
   ```bash
   eas build --platform ios --profile production
   ```
   *EAS will prompt you to log into your Apple Developer account to automatically manage certificates, provisioning profiles, and bundle identifiers.*

---

## 10. Navigation Flow Diagram

```text
LoginScreen
   │ (Validates 10-digit mobile)
   ▼
RegistrationScreen
   │ (Captures name, role, business, location)
   ▼ (Replace stack to prevent returning)
HomeScreen (Dashboard)
   ├─── CustomersScreen
   │       └─── AddCustomerScreen (Returns to Customers with new record)
   ├─── CategoriesScreen
   │       └─── AddCategoryScreen (Returns to Categories with new record)
   └─── ProductsScreen
           └─── AddProductScreen (Dynamic category & unit selection)
```

---

## 11. Current Limitations

1. **Mock Data Persistence**: In compliance with the project specifications, data is stored in memory (`MandiContext`). Newly added customers, categories, and products persist during the application session across screen navigation, but reset upon a cold application restart.
2. **Authentication**: The Login and Registration flows simulate realistic onboarding with full 10-digit input validation, role assignment, and stack replacement, without an external SMS OTP gateway.
3. **Platform Availability**: Builds are compiled via Expo and EAS Cloud. iOS Simulator testing requires a macOS workstation, though physical iPhone testing functions on any OS via Expo Go.
