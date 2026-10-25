# FreshCart — Full-Stack Application

FreshCart is a full-stack web application built with **Django REST Framework** and **Next.js**. It includes authentication pages and a Point of Sale (POS) interface.

## 🛠️ Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Python
- Django
- Django REST Framework
- JWT authentication using HTTP-only cookies

## 📁 Project Structure

```text
freshcart-fullstack/
├── backend/
│   ├── config/
│   ├── store/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── login/
│   │       ├── signup/
│   │       └── pos/
│   ├── package.json
│   └── package-lock.json
├── package-lock.json
└── README.md
```

## ✨ Features

- User registration
- User login and logout
- Cookie-based JWT authentication
- POS interface
- Django REST API
- Next.js frontend

## ⚙️ Prerequisites

Install the following before running the project:

- Python 3.12 or a compatible version
- Node.js and npm
- Git

## 🚀 Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd freshcart-fullstack
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create or configure your environment variables according to your Django settings. Configure the database and other required settings before running migrations.

Run:

```bash
python3 manage.py migrate
python3 manage.py runserver
```

The backend will usually be available at:

`http://127.0.0.1:8000/`

### 3. Set up the frontend

Open a second terminal:

```bash
cd /path/to/freshcart-fullstack/frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Start the development server:

```bash
npm run dev
```

Open:

`http://localhost:3000`

Keep the frontend and backend running in separate terminals.

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Register a user |
| POST | `/api/auth/login/` | Log in |
| POST | `/api/auth/logout/` | Log out |
| GET | `/api/me/` | Retrieve the current user |
| GET | `/api/products/` | Retrieve products |
| POST | `/api/bills/` | Create a bill |
| GET | `/api/bills/history/` | Retrieve bill history |

## 🔐 Authentication

The backend issues JWT tokens using HTTP-only cookies. The frontend must include credentials in API requests so the browser can send authentication cookies.

For local development, configure Django CORS settings to allow the frontend origin:

`http://localhost:3000`

Do not commit secrets, production credentials, or environment files to Git.

## 🧪 Troubleshooting

- **401 Unauthorized:** Check that login succeeds, the access-token cookie is set, and authenticated requests include that cookie.
- **CORS errors:** Verify the allowed frontend origin and credential settings in Django.
- **API connection errors:** Ensure Django is running on port `8000` and Next.js is running on port `3000`.
- **Missing dependencies:** Run `pip install -r requirements.txt` in the backend and `npm install` in the frontend.

## 👩‍💻 Development

Run the frontend and backend in separate terminal sessions. Use Git to track changes and commit updates regularly.

## 📄 License

Add a license to this repository if you intend to distribute or open-source the project.