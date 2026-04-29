# BMSCE Lost & Found Application

Welcome to the B.M.S. College of Engineering Lost & Found platform. This project has been heavily optimized and separated into two explicit folders for modern web-app development:

1. **`frontend/`** (React, Vite, Tailwind CSS)
2. **`backend/`** (Node.js, Express, MongoDB)

---

## 📁 Architecture Overview

This project is a Full-Stack Web Application. 
- The **Frontend** acts like the visual app you see. It runs on Vite and React.
- The **Backend** is the server. It receives data from the frontend and securely saves it in a MongoDB database.
- The two communicate using **API endpoints** (specifically the `api.ts` file in the frontend pushes requests to `server.js` in the backend).

---

## 🧩 Frontend (`frontend/src/`)

### 1. `app/App.tsx` & `main.tsx`
These are the engines of the frontend. `main.tsx` renders the application to the browser, while `App.tsx` handles **Routing** (deciding which screen to show based on the URL bar, like `/home` or `/profile`).

### 2. `app/contexts/NotificationContext.tsx`
This code manages state memory for smart campus alerts. It fetches notifications dynamically from the backend for the current user and manages Popups (Toasts).

### 3. `app/screens/`
These are the full-page visual layouts:
* **`HomeScreen.tsx`**: Displays the active lost/found items and houses the main BMSCE logo.
* **`ProfileScreen.tsx`**: Where users enter their college email to check their reported items. Entering an email here attaches that email to your LocalStorage, essentially "logging you in" to receive notifications.
* **`ReportItemScreen.tsx`**: The submission form for an item. The "Found" button triggers a blue theme, and the "Lost" button triggers a red theme. It uploads the image and data to the server.
* **`NotificationScreen.tsx`**: A full list of matching lost-and-found alerts mapped to your email.

### 4. `app/components/`
These are reusable blocks of visual code:
* **`BottomNav.tsx`**: The navigation bar at the bottom of the screen.
* **`NotificationToast.tsx`**: The animated popup that drops down from the top when a new notification comes in.
* **`LocationPermission.tsx`**: A simple banner confirming if the user has inputted their email to receive BMSCE campus alerts.

### 💡 What are `MapPin`, `X`, `Bell`, `User`?
In many files (like `NotificationToast.tsx`), you will see code like `import { Bell, MapPin, X } from 'lucide-react';` and then tags like `<X />`.
These are **Icons**. `lucide-react` is an open-source library that turns raw SVG data into easy-to-use React tags. 
- `<X />` is the "Close" or "Cancel" icon.
- `<MapPin />` is the classic location tear-drop icon.
- `<Bell />` is the notification ringer icon.

---

## 🖥 Backend (`backend/`)

### 1. `server.js`
This is the heart of the backend. It connects to the `MONGODB_URI` database string, sets up Express, and links all the Routes together so the Frontend can talk to the database.

### 2. `models/`
These dictate how data is shaped in the database:
* **`Item.js`**: Stores title, description, category, type ('lost' or 'found'), location, and the reporter's email.
* **`Notification.js`**: Stores `userEmail`, the title, message, and `read` boolean. This model is what makes the smart matching system work.

### 3. `routes/`
These are the endpoints the frontend fetches:
* **`itemRoutes.js`**: Contains the logic that **Cross-Matches items**. If you upload a 'Found' electronics item, it queries the database for 'Lost' electronics items. If it finds one, it automatically uses `Notification.insertMany()` to send a notification to the person who lost it.
* **`notificationRoutes.js`**: Fetches and marks notifications as read for the user based on their email.

---

## 🚀 How to Run the App

Because the code is split into two folders, you need **two terminal tabs**:

**1. Start the Database/Backend server:**
Open a terminal in the root `College-lost-found` directory:
```bash
cd backend
npm run dev
```

**2. Start the Windows/Mobile App UI:**
Open a SECOND terminal in the root `College-lost-found` directory:
```bash
cd frontend
npm run dev
```

*(To open it as a mobile app on your phone, read the instructions in your IDE walkthrough about using `npm run dev -- --host`!)*