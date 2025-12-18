# Microservices Demo Application - Task Management

Proyek ini mendemonstrasikan arsitektur microservices untuk aplikasi Task Management dengan:
- **User Service (REST API)**: Mengelola akun pengguna, tim, dan autentikasi (JWT).
- **Task Service (GraphQL API)**: Mengelola tugas (tasks) dan pembaruan real-time melalui subscriptions.
- **API Gateway**: Titik masuk tunggal yang memverifikasi JWT dan me-routing permintaan.
- **Frontend (Next.js)**: Aplikasi klien untuk berinteraksi dengan sistem.

## Arsitektur & Alur Autentikasi

1.  **Frontend** → `POST /api/auth/login` → **API Gateway** → **User Service**
2.  **User Service** memvalidasi kredensial, membuat JWT (ditandatangani dengan `PRIVATE_KEY`), dan mengirimkannya kembali.
3.  **Frontend** menyimpan JWT di `localStorage`.
4.  **Frontend** → `GET /api/teams` (dengan header `Authorization: Bearer <token>`) → **API Gateway**
5.  **API Gateway** mengambil `PUBLIC_KEY` dari User Service (saat startup).
6.  **API Gateway** memverifikasi JWT. Jika valid, meneruskan permintaan ke **User Service** dengan header `x-user-id`.
7.  **Frontend** → `query { tasks }` (dengan header `Authorization: Bearer <token>`) → **API Gateway**
8.  **API Gateway** memverifikasi JWT. Jika valid, meneruskan permintaan ke **Task Service** (GraphQL) dengan header `x-user-id`.

## Services

### 1. User Service (REST API - Port 3001)
- Express.js server
- Endpoints:
  - `POST /api/auth/register`: Membuat user baru.
  - `POST /api/auth/login`: Mengembalikan JWT.
  - `GET /api/auth/public-key`: Mengekspos public key untuk verifikasi JWT.
  - `GET /api/users`: (Dilindungi) Mendapatkan daftar user.
  - `POST /api/teams`: (Dilindungi) Membuat tim baru.
  - `GET /api/teams`: (Dilindungi) Mendapatkan daftar tim.

### 2. Task Service (GraphQL API - Port 4000)
- Apollo Server dengan Express
- Mengelola Tasks
- Menggunakan `context` untuk mendapatkan `userId` yang diautentikasi dari gateway.
- Endpoint: `/graphql`
- Fitur: `Query` (tasks), `Mutation` (createTask, updateTaskStatus), `Subscription` (taskAdded, taskUpdated).

### 3. API Gateway (Port 3000)
- Titik masuk tunggal, menangani keamanan.
- Memverifikasi semua token JWT menggunakan public key dari User Service.
- Proxy Routes:
  - `/api/auth/*` → User Service (Publik)
  - `/api/users/*` → User Service (Dilindungi JWT)
  - `/api/teams/*` → User Service (Dilindungi JWT)
  - `/graphql` → Task Service (Dilindungi JWT, mendukung HTTP & WebSocket)

### 4. Frontend App (Port 3002)
- Next.js dengan TypeScript
- Apollo Client (dikonfigurasi dengan Auth & WebSocket links)
- Axios (dikonfigurasi dengan interceptor untuk Auth)
- Halaman Login/Register & Dashboard Task.

## Quick Start

### Menggunakan Docker (Direkomendasikan)

**Windows Users:**
Cukup klik dua kali `start.bat` dan pilih opsi dari menu! 

**Atau gunakan baris perintah:**

1.  **Mode Development (dengan hot-reload):** 
    ```bash
    npm run dev
    # atau
    docker-compose -f docker-compose.dev.yml up --build
    ```

2.  **Mode Produksi:** 
    ```bash
    npm start
    # atau
    docker-compose up --build
    ```

3.  **Hentikan semua service:** 
    ```bash
    npm run stop
    ```

### Setup Manual

1.  **Install dependencies untuk semua service:** 
    ```bash
    npm run install:all
    ```

2.  **Jalankan setiap service (di terminal terpisah):**
    ```bash
    # Terminal 1 - User Service (REST)
    cd services/rest-api && npm run dev

    # Terminal 2 - Task Service (GraphQL)
    cd services/graphql-api && npm run dev

    # Terminal 3 - API Gateway
    cd api-gateway && npm run dev

    # Terminal 4 - Frontend
    cd frontend-app && npm run dev
    ```

## URLs

-   **Frontend:** http://localhost:3002
-   **API Gateway (Titik masuk utama):** http://localhost:3000
-   User Service (Internal): http://localhost:3001
-   Task Service (Internal): http://localhost:4000/graphql

## Environment Variables

Lihat `.env.example` untuk detailnya. Frontend dikonfigurasi untuk hanya berbicara dengan API Gateway (`http://localhost:3000`).