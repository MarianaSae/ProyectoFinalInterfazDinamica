// js/auth.js

const STORAGE_USERS_KEY = "dino_users";
const STORAGE_CURRENT_USER_KEY = "dino_current_user";
const STORAGE_MATCHES_KEY = "dino_matches";

function loadUsers() {
  const data = localStorage.getItem(STORAGE_USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function loadMatches() {
  const data = localStorage.getItem(STORAGE_MATCHES_KEY);
  return data ? JSON.parse(data) : [];
}

function saveMatches(matches) {
  localStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(matches));
}

function getCurrentUserEmail() {
  return localStorage.getItem(STORAGE_CURRENT_USER_KEY);
}

function setCurrentUserEmail(email) {
  if (email) {
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, email);
  } else {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  }
}

function findUserByEmail(email) {
  const users = loadUsers();
  return users.find((u) => u.email === email) || null;
}

function registerUser({ username, email, password, favColor }) {
  const users = loadUsers();
  const existing = users.find((u) => u.email === email);
  if (existing) {
    return { ok: false, message: "Ese correo ya está registrado." };
  }

  const newUser = {
    username,
    email,
    password,
    favColor,
    stats: {
      totalScore: 0,
      gamesPlayed: 0,
      bestScore: 0
    }
  };

  users.push(newUser);
  saveUsers(users);
  return { ok: true, user: newUser };
}

function loginUser({ email, password }) {
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return { ok: false, message: "Credenciales incorrectas." };
  }
  setCurrentUserEmail(user.email);
  return { ok: true, user };
}

function logoutUser() {
  setCurrentUserEmail(null);
}

function updateUser(user) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.email === user.email);
  if (idx !== -1) {
    users[idx] = user;
    saveUsers(users);
  }
}

function addMatch(email, score, result) {
  const matches = loadMatches();
  const now = new Date();
  const match = {
    email,
    score,
    result,
    date: now.toLocaleString()
  };
  matches.push(match);
  saveMatches(matches);
}

function getMatchesByEmail(email) {
  return loadMatches().filter((m) => m.email === email);
}
