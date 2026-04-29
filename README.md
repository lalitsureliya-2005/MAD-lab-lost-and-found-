# BMSCE Lost & Found Standalone App

A premium, cross-platform mobile application built with React Native and Node.js for B.M.S. College of Engineering.

## 📁 Project Structure

- **`/app`**: React Native (Expo) mobile application. Contains the premium 3D themed UI, theme system, and matchmaking logic.
- **`/backend`**: Node.js & Express server. Handles MongoDB integration, Twilio SMS notifications, and user authentication.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js installed
- Expo Go app on your phone (for development)
- MongoDB Atlas account (for production)

### 2. Setup Backend
```bash
cd backend
npm install
# Create a .env file with your credentials (see walkthrough for details)
npm run dev
```

### 3. Setup Mobile App
```bash
cd app
npm install
# Update config.js with your backend URL
npx expo start
```

## ✨ Key Features
- **Dual Themes**: Instant toggle between Dark and Light mode.
- **3D UI Effects**: Glassmorphism, 3D card shadows, and smooth micro-animations.
- **Smart Matchmaking**: Automatically notifies lost item owners via SMS when a matching item is found.
- **Secure Settlement**: A verified handshake process to ensure items are returned to the correct owners.

---

**Built for BMSCE**