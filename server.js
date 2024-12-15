const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

const FIREBASE_DB_URL = "https://webchat-b5798-default-rtdb.firebaseio.com/";
const FIREBASE_API_KEY = "AIzaSyBvitMgBlY9RCzlEnBRoYYLcxzQ_07yjNM";

let sessions = {}; // Mock session handling

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to check if user is logged in
app.use((req, res, next) => {
    const token = req.headers.authorization;
    if (!token && req.path !== "/login" && req.path !== "/register") {
        return res.redirect('/index.html');
    }
    next();
});

// Endpoint for messages
app.post('/messages', async (req, res) => {
    const { message } = req.body;

    if (message) {
        const data = {
            username: "User",
            message,
            timestamp: Date.now()
        };

        const response = await fetch(`${FIREBASE_DB_URL}messages.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        res.json(await response.json());
    } else {
        res.status(400).json({ error: 'Message is required' });
    }
});

app.get('/messages', async (req, res) => {
    const response = await fetch(`${FIREBASE_DB_URL}messages.json`);
    const messages = await response.json();
    res.json(messages);
});

// Registration
app.post('/register', async (req, res) => {
    const { email, password, username } = req.body;

    const registerUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
    const data = {
        email,
        password,
        returnSecureToken: true
    };

    const response = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.idToken) {
        const userDbUrl = `${FIREBASE_DB_URL}users.json`;
        await fetch(userDbUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username })
        });

        sessions[result.idToken] = username; // Mock session
        res.json({ token: result.idToken });
    } else {
        res.status(400).json(result.error);
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    const data = {
        email,
        password,
        returnSecureToken: true
    };

    const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.idToken) {
        sessions[result.idToken] = email; // Mock session
        res.json({ token: result.idToken });
    } else {
        res.status(400).json(result.error);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
