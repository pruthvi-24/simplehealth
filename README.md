# SimpleHealth

A full-stack app for managing family medical records — profiles for each family
member, with medical records (notes + attached images) under each profile.

## Tech stack

- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT (bcrypt password hashing, `protect` middleware)
- **Validation:** express-validator, centralized error-handling middleware
- **Images:** Cloudinary (via Multer + streamifier)
- **Frontend:** Vanilla HTML/CSS/JS (no framework/build step)

## Project structure

```
simplehealth-fullstack/
├── backend/
│   └── backend/        # Express API
│       ├── config/      # DB + Cloudinary + Multer setup
│       ├── middleware/  # auth, validators, error handling
│       ├── models/      # User, Profile, MedicalRecord
│       ├── routes/      # auth, profile, medical record routes
│       ├── utils/
│       └── server.js
├── frontend/            # Static HTML/CSS/JS app
│   ├── css/
│   ├── js/
│   └── index.html
├── package.json         # root scripts to run both apps together
└── README.md
```

## Setup

1. Copy `backend/backend/.env.example` to `backend/backend/.env` and fill in
   your MongoDB URI, JWT secret, and Cloudinary credentials.
2. Install dependencies for both apps:
   ```
   npm run install-all
   ```

## Running

From the project root:

```
npm run dev
```

This starts the backend (nodemon, `http://localhost:5000`) and the frontend
(static server, `http://localhost:3000`) together via `concurrently`.

To run them separately instead:

```
npm run dev --prefix backend/backend
npm start --prefix frontend
```

## Notes

- The frontend talks to the backend over `http://localhost:5000/api`
  (configured in `frontend/js/config.js`) — update that if you deploy the
  backend elsewhere.
- The backend has CORS enabled so it can be called from the frontend's
  separate origin.
