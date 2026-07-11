# Farmin 🌾 (Framin)

A secure, enterprise-grade, offline-first mobile application for managing farm finances, tracking expenses, calculating ROI, scheduling agricultural tasks, and accessing weather-optimized AI agronomy reports. 

Built with **React Native (Expo)** on the frontend and **TypeScript (Express + MySQL)** on the backend.

---

## 🏗️ Repository Architecture

The project has a decoupled, enterprise architecture:

```
farmin/
├── src/                    # EXPRESS BACKEND (TypeScript)
│   ├── config/             # DB Connection Configs
│   ├── middleware/         # Security & Input Validation (JWT, Zod)
│   ├── routes/             # Versioned REST Controllers (/api/v1)
│   ├── tests/              # Jest API Test Suites
│   └── index.ts            # App Entry Point (Helmet, Rate Limiter)
├── FarmFinance/            # EXPO MOBILE FRONTEND (TypeScript)
│   ├── src/
│   │   ├── core/           # Env Config & Constants
│   │   ├── data/           # Repository & Network Layer (Clean Architecture)
│   │   ├── components/     # Reusable M3 Design Components
│   │   ├── screens/        # Material 3 Mobile Screens
│   │   └── services/       # Supabase Client & External API handlers
│   └── package.json
├── docker-compose.yml      # Multi-container Compose config
├── Dockerfile              # Backend Multi-stage build script
├── package.json            # Backend dev scripts & deps
└── setup-db.js             # MySQL Schema Builder (indexed)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker & Docker Compose](https://www.docker.com/) (Optional, for containerized run)
- [MySQL Server](https://www.mysql.com/) (If running database locally)
- [Expo CLI](https://docs.expo.dev/)

---

## 🛠️ Backend Setup & Commands

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=farmin
   JWT_SECRET=your_jwt_signature_secret
   ```

3. **Initialize Database Tables**:
   ```bash
   node setup-db.js
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

5. **Compile TypeScript Build**:
   ```bash
   npm run build
   ```

6. **Run Unit Test Suites**:
   ```bash
   npm run test
   ```

---

## 🐳 Docker Deployment

To spin up the secure Express API along with a pre-configured MySQL database container instantly, simply run:
```bash
docker-compose up --build
```
This automatically initializes the MySQL database tables, mounts persistent volumes for data storage, runs database health checks, and boots the backend API server.

---

## 📱 Mobile App Setup & Commands

1. **Navigate to App Directory**:
   ```bash
   cd FarmFinance
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside the `FarmFinance` directory:
   ```env
   EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
   EXPO_PUBLIC_YOUTUBE_API_KEY=your_google_youtube_key
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Launch Expo Metrobundler**:
   ```bash
   npx expo start
   ```
   - Press `a` to run on Android.
   - Press `i` to run on iOS.
   - Scan the QR code with **Expo Go** to preview on physical devices.

---

## 🔒 Security Specifications

- **Payload Integrity**: All request payloads are validated on the server using Zod schemas.
- **Request Protection**: Rate limits are set to 100 requests per 15 minutes per IP to guard against Denial of Service.
- **Security Headers**: Helmet integration blocks cross-site scripting (XSS), clickjacking, and mime-type sniffing.
- **Access Control**: All routes require valid Authorization headers checking Bearer JWT signatures.
- **Credentials Masking**: Secrets are completely decoupled from code repositories using environment configs.
