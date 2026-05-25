# Secure Auth System

A production-inspired user authentication system built with Node.js, Express, and a vanilla Tailwind frontend.

## Features

- **Password hashing** with `bcrypt` for secure credential storage.
- **Account lockout** after 5 consecutive failed login attempts.
- **Rate limiting** on `/register`, `/login`, and `/mfa` to prevent brute-force abuse.
- **Simulated MFA** using a temporary 6-digit verification code.
- **JWT authentication** to protect the `/dashboard` route.
- **Frontend UI** with registration, login, MFA verification, and protected dashboard steps.

## Authentication Flow

1. **Registration**: Users register with an email and password. Passwords are hashed before storage.
2. **Login**: Users submit email and password. If credentials are valid, MFA is triggered instead of granting access immediately.
3. **MFA Verification**: A temporary 6-digit code is generated and returned via API response for simulation. The user submits this code to complete authentication.
4. **JWT Token**: After MFA verification, the server issues a signed JWT.
5. **Protected Dashboard**: The frontend stores the JWT in `localStorage` and uses it to access the protected `/dashboard` API.

## Installation

```bash
cd secure-auth-system
npm install
```

## Running the Server

```bash
npm start
```

Then open `public/index.html` in your browser or navigate to `http://localhost:4000` if you want to serve the frontend from the same Express server.

## Security Notes

- `bcrypt` protects stored passwords.
- `express-rate-limit` reduces repeated requests against authentication endpoints.
- Account lockout provides defense-in-depth against repeated failed logins.
- Temporary MFA tokens expire after 5 minutes to limit token reuse.
- JWT tokens are validated for authorized access to secure routes.

## Project Structure

- `server.js` - Express backend with authentication logic.
- `public/index.html` - Multi-step frontend interface.
- `public/app.js` - Client-side state management, form handling, and API requests.
- `package.json` - Node dependencies and startup command.

## Notes

This project uses a simple in-memory user store for demo purposes. For a production deployment, replace the in-memory storage with a persistent database and use secure environment variables for secrets.
