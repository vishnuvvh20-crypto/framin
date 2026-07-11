# FarmFinance 🌾 (Framin)

A comprehensive React Native mobile application for managing farm finances, tracking expenses, calculating ROI, and scheduling agricultural tasks. Built with Expo, TypeScript, and Supabase.

## ✨ Features

- **Financial Dashboard**: Track total balance, income, expenses, and overall ROI.
- **Transaction Management**: Record and categorize farm expenses (e.g., seeds, fertilizer, labor) and revenues (e.g., crop sales).
- **Task Scheduling**: Plan and manage agricultural tasks like planting, watering, and harvesting.
- **Resource & Weather Tools**: Access agriculture-related videos and tools.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

## 🛠️ Setup Instructions

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/vishnuvvh20-crypto/framin.git
   cd framin
   ```

2. **Navigate to the App Directory**:
   ```bash
   cd FarmFinance
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```
   *or if using yarn:*
   ```bash
   yarn install
   ```

4. **Environment Variables**:
   Create a `.env` file in the root of the `FarmFinance` directory and add any necessary API keys. For example:
   ```env
   EXPO_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 📱 Running the App Locally (Development)

To start the development server, run:
```bash
npm start
```
*or*
```bash
npx expo start
```

This will start the Expo Metro Bundler. From there, you can:
- Press `a` to open the app on an Android Emulator.
- Press `i` to open the app on an iOS Simulator (macOS only).
- Scan the QR code shown in the terminal using the **Expo Go** app on your physical iOS or Android device.

## 📦 Deployment & Building

This app is built using **Expo Application Services (EAS)**, making it simple to create production builds for iOS and Android.

1. **Install EAS CLI** (if you haven't already):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure the Project**:
   ```bash
   eas build:configure
   ```

4. **Build for Android (.apk or .aab)**:
   ```bash
   eas build --platform android --profile production
   ```

5. **Build for iOS (.ipa)**:
   ```bash
   eas build --platform ios --profile production
   ```

*Note: For iOS builds, you will need a valid Apple Developer account.*

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.

## 📜 License
This project is proprietary.
