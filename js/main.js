// js/main.js

document.addEventListener("DOMContentLoaded", () => {
  // Pantallas
  const screenAuth = document.getElementById("screen-auth");
  const screenProfile = document.getElementById("screen-profile");
  const screenGame = document.getElementById("screen-game");
  const screenHistory = document.getElementById("screen-history");

  // Vistas auth
  const loginView = document.getElementById("login-view");
  const registerView = document.getElementById("register-view");

  // Nav
  const navMain = document.getElementById("nav-main");
  const btnNavProfile = document.getElementById("btn-nav-profile");
  const btnNavHistory = document.getElementById("btn-nav-history");
  const btnNavLogout = document.getElementById("btn-nav-logout");

  // Formularios
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");

  const loginError = document.getElementById("login-error");
  const registerError = document.getElementById("register-error");

  // Botones auth
  const btnGoRegister = document.getElementById("btn-go-register");
  const btnGoLogin = document.getElementById("btn-go-login");

  // Perfil
  const profileUsername = document.getElementById("profile-username");
  const profileEmail = document.getElementById("profile-email");
  const profileColor = document.getElementById("profile-color");
  const profileGames = document.getElementById("profile-games");
  const profileTotalScore = document.getElementById("profile-total-score");
  const profileBestScore = document.getElementById("profile-best-score");
  const profileFavColorInput = document.getElementById("profile-favcolor-input");
  const btnSaveFavColor = document.getElementById("btn-save-favcolor");

  // Acciones perfil
  const btnStartGame = document.getElementById("btn-start-game");
  const btnGoHistory = document.getElementById("btn-go-history");

  // HUD
  const hudPlayerName = document.getElementById("hud-player-name");
  const hudLives = document.getElementById("hud-lives");
  const hudScore = document.getElementById("hud-score");
  const hudLevel = document.getElementById("hud-level");

  // Juego
  const canvas = document.getElementById("gameCanvas");
  const overlay = document.getElementById("game-overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayScore = document.getElementById("overlay-score");
  const overlayResult = document.getElementById("overlay-result");
  const btnPlayAgain = document.getElementById("btn-play-again");
  const btnBackProfile = document.getElementById("btn-back-profile");

  // Historial
  const historyBody = document.getElementById("history-body");
  const btnHistoryBack = document.getElementById("btn-history-back");

  let currentUser = null;
  let game = null;

  function showScreen(screen) {
    [screenAuth, screenProfile, screenGame, screenHistory].forEach((s) =>
      s.classList.add("hidden")
    );
    screen.classList.remove("hidden");
  }

  function showLogin() {
    loginView.classList.remove("hidden");
    registerView.classList.add("hidden");
    showScreen(screenAuth);
    navMain.classList.add("hidden");
    loginError.textContent = "";
    registerError.textContent = "";
    formLogin.reset();
  }

  function showRegister() {
    registerView.classList.remove("hidden");
    loginView.classList.add("hidden");
    showScreen(screenAuth);
    navMain.classList.add("hidden");
    loginError.textContent = "";
    registerError.textContent = "";
    formRegister.reset();
  }

  function refreshProfile() {
    if (!currentUser) return;
    profileUsername.textContent = currentUser.username;
    profileEmail.textContent = currentUser.email;
    profileColor.innerHTML = `<span style="display:inline-flex;align-items:center;gap:0.4rem;"><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${currentUser.favColor};border:1px solid #0001;"></span>${currentUser.favColor}</span>`;
    profileGames.textContent = currentUser.stats.gamesPlayed;
    profileTotalScore.textContent = currentUser.stats.totalScore;
    profileBestScore.textContent = currentUser.stats.bestScore;
    if (profileFavColorInput) {
      profileFavColorInput.value = currentUser.favColor || "#ffb703";
    }
  }

  function showProfile() {
    if (!currentUser) {
      showLogin();
      return;
    }
    refreshProfile();
    navMain.classList.remove("hidden");
    showScreen(screenProfile);
  }

  function showHistory() {
    if (!currentUser) {
      showLogin();
      return;
    }
    const matches = getMatchesByEmail(currentUser.email);
    historyBody.innerHTML = "";

    if (matches.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 3;
      td.textContent = "Aún no hay partidas registradas.";
      td.style.textAlign = "center";
      historyBody.appendChild(tr);
      tr.appendChild(td);
    } else {
      matches.forEach((m) => {
        const tr = document.createElement("tr");
        const tdDate = document.createElement("td");
        const tdScore = document.createElement("td");
        const tdResult = document.createElement("td");

        tdDate.textContent = m.date;
        tdScore.textContent = m.score;
        tdResult.textContent = m.result === "ganó" ? "Ganó" : "Perdió";
        tdResult.style.color = m.result === "ganó" ? "#2b9348" : "#e63946";

        tr.appendChild(tdDate);
        tr.appendChild(tdScore);
        tr.appendChild(tdResult);
        historyBody.appendChild(tr);
      });
    }

    showScreen(screenHistory);
  }

  function startGameScreen() {
    if (!currentUser) {
      showLogin();
      return;
    }

    showScreen(screenGame);
    overlay.classList.add("hidden");

    hudPlayerName.textContent = currentUser.username;

    game = new DinoGame(canvas, {
      onScoreChange: (score) => (hudScore.textContent = score),
      onLivesChange: (lives) => (hudLives.textContent = lives),
      onLevelChange: (level) => (hudLevel.textContent = level),
      onGameOver: handleGameOver
    });

    game.setPlayerColor(currentUser.favColor);
    game.start();
  }

  function handleGameOver(score, result) {
    currentUser.stats.gamesPlayed += 1;
    currentUser.stats.totalScore += score;
    if (score > currentUser.stats.bestScore) {
      currentUser.stats.bestScore = score;
    }
    updateUser(currentUser);

    addMatch(currentUser.email, score, result);

    refreshProfile();

    overlayTitle.textContent =
      result === "ganó" ? "¡Banana victory! 🍌" : "Fin de la partida";
    overlayScore.textContent = `Puntaje obtenido: ${score}`;
    overlayResult.textContent =
      result === "ganó"
        ? "Esquivaste suficientes bananas para ser leyenda."
        : "Te resbalaste con una banana... pero puedes intentarlo de nuevo.";
    overlay.classList.remove("hidden");
  }

  // Cambiar color favorito desde el perfil
  if (btnSaveFavColor && profileFavColorInput) {
    btnSaveFavColor.addEventListener("click", () => {
      if (!currentUser) return;
      const newColor = profileFavColorInput.value;
      if (!newColor) return;
      currentUser.favColor = newColor;
      updateUser(currentUser);
      refreshProfile();
    });
  }

  // Eventos auth

  btnGoRegister.addEventListener("click", () => {
    showRegister();
  });

  btnGoLogin.addEventListener("click", () => {
    showLogin();
  });

  formRegister.addEventListener("submit", (e) => {
    e.preventDefault();
    registerError.textContent = "";

    const username = document.getElementById("reg-username").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value.trim();
    const favColor = document.getElementById("reg-favcolor").value;

    if (!username || !email || !password) {
      registerError.textContent = "Completa todos los campos obligatorios.";
      return;
    }

    const result = registerUser({ username, email, password, favColor });

    if (!result.ok) {
      registerError.textContent = result.message;
      return;
    }

    setCurrentUserEmail(email);
    currentUser = result.user;
    showProfile();
  });

  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    loginError.textContent = "";

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const result = loginUser({ email, password });
    if (!result.ok) {
      loginError.textContent = result.message;
      return;
    }

    currentUser = result.user;
    showProfile();
  });

  btnNavLogout.addEventListener("click", () => {
    if (game) game.stop();
    logoutUser();
    currentUser = null;
    showLogin();
  });

  // Nav
  btnNavProfile.addEventListener("click", showProfile);
  btnNavHistory.addEventListener("click", showHistory);

  // Perfil
  btnStartGame.addEventListener("click", startGameScreen);
  btnGoHistory.addEventListener("click", showHistory);

  // Juego
  btnPlayAgain.addEventListener("click", () => {
    startGameScreen();
  });

  btnBackProfile.addEventListener("click", () => {
    if (game) game.stop();
    showProfile();
  });

  // Historial
  btnHistoryBack.addEventListener("click", showProfile);

  // Controles de teclado
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      if (game) {
        e.preventDefault();
        game.handleInput();
      }
    }
  });

  // Toque/click en canvas
  canvas.addEventListener("pointerdown", () => {
    if (game) game.handleInput();
  });

  // Revisar sesión al cargar
  const existingEmail = getCurrentUserEmail();
  if (existingEmail) {
    const user = findUserByEmail(existingEmail);
    if (user) {
      currentUser = user;
      showProfile();
      return;
    } else {
      setCurrentUserEmail(null);
    }
  }

  showLogin();
});
