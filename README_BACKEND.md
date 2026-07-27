# Scenix - Backend Documentation

## 🌟 Purpose of the Application
This is the backend server for **Scenix**, a movie and TV show exploration application. Its purpose is to securely manage user data, handle authentication (logging in and signing up), verify user emails with OTPs (One Time Passwords), upload and store user profile pictures, and provide a reliable API for the frontend to communicate with.

## 🛠️ Technology Stack
- **Node.js & Express.js**: The core runtime and framework. It listens for incoming requests from the frontend and sends back responses.
- **MongoDB & Mongoose**: The database where all user information (emails, hashed passwords, avatars, OTP codes) is securely stored.
- **JSON Web Tokens (JWT)**: Used for stateless, secure authentication. We use two tokens: an Access Token (short-lived) and a Refresh Token (long-lived).
- **Bcrypt**: A security library that scrambles (hashes) user passwords before saving them to the database, ensuring no one can read them.
- **Cloudinary & Multer**: Handles file uploads. When a user uploads an avatar image, Multer grabs it, and we upload it to Cloudinary (cloud storage), saving the image URL in our database.
- **Nodemailer / Resend**: Handles sending automated emails to users, specifically for sending 6-digit OTP codes for email verification and password resets.

## 🔌 How the Backend Connects to the Frontend
The connection relies heavily on CORS and HTTP-Only Cookies, configured primarily in `src/app.js`.

1. **CORS (Cross-Origin Resource Sharing)**: 
   Because the frontend (`localhost:5173`) and the backend (`localhost:8000`) run on different ports, the browser normally blocks them from talking to each other for security reasons. We use the `cors` package in `app.js` to explicitly allow requests from the frontend port.
   
2. **Cookies Integration (`credentials: true`)**:
   In our CORS settings, we set `credentials: true`. This tells the backend, "It is safe to accept cookies from the frontend, and it is safe to send cookies back to them."

3. **Secure Authentication Flow**:
   - When a user logs in, the backend creates an **Access Token** and a **Refresh Token**.
   - Instead of sending these tokens as simple text, the backend packs them into `httpOnly` cookies.
   - `httpOnly` means the cookies are hidden from JavaScript in the browser. This prevents hackers from stealing the tokens using malicious scripts (XSS attacks).
   - Whenever the frontend makes a protected request (like fetching profile data), the browser automatically attaches these secure cookies, and the backend verifies them using middleware (`verifyJWT`).

## 📂 Important Code References for the Future
If you return to this code in the future, here are the most important areas to remember:

- **`src/app.js`**: The heart of the server. This is where CORS is set up. If you deploy your frontend to the internet (e.g., `https://my-scenix-app.com`), you MUST add that URL to the `allowedOrigins` array in this file, or the live frontend won't be able to talk to your live backend.
- **`src/controller/user.controller.js`**: Contains all the core business logic. If you ever need to change how Login, Registration, OTP Generation, or Password Reset works, this is the file to edit.
- **`src/models/user.models.js`**: Defines the "Schema" (structure) of your MongoDB database. If you want to add a new feature (like letting users save a list of "Favorite Movies"), you will need to add a new field to the schema in this file.
- **`src/middlewares/auth.middleware.js`**: Protects your routes. It intercepts requests, checks if the user has a valid cookie token, and if they do, allows them to proceed. If you make a new route that requires a user to be logged in, you just add `verifyJWT` to that route.
