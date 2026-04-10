const USERS_KEY = "editinglabs_users";

function getUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
        return [];
    }

    try {
        const users = JSON.parse(raw);
        return Array.isArray(users) ? users : [];
    } catch (error) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setMessage(element, message, type) {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.classList.remove("is-error", "is-success");

    if (type === "error") {
        element.classList.add("is-error");
    }

    if (type === "success") {
        element.classList.add("is-success");
    }
}

function initAuthPage() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const tabs = document.querySelectorAll(".auth-tab");
    const messageEl = document.getElementById("auth-message");
    const headingEl = document.getElementById("auth-heading");
    const subheadingEl = document.getElementById("auth-subheading");

    if (!loginForm || !registerForm || tabs.length === 0) {
        return;
    }

    function setMode(mode, options = {}) {
        const shouldClearMessage = options.clearMessage !== false;
        const isLogin = mode === "login";

        tabs.forEach((item) => {
            const isActive = item.dataset.mode === mode;
            item.classList.toggle("active", isActive);
            item.setAttribute("aria-selected", isActive ? "true" : "false");
            item.tabIndex = isActive ? 0 : -1;
        });

        loginForm.classList.toggle("hidden", !isLogin);
        registerForm.classList.toggle("hidden", isLogin);

        if (headingEl) {
            headingEl.textContent = isLogin ? "Welcome back" : "Create your account";
        }

        if (subheadingEl) {
            subheadingEl.textContent = isLogin
                ? "Sign in to continue your learning flow."
                : "A clean setup, then you are ready to go.";
        }

        if (shouldClearMessage) {
            setMessage(messageEl, "", "");
        }
    }

    setMode("login", { clearMessage: false });

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            setMode(tab.dataset.mode);
        });

        tab.addEventListener("keydown", (event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                return;
            }

            event.preventDefault();

            const tabsArray = Array.from(tabs);
            const currentIndex = tabsArray.indexOf(tab);
            const direction = event.key === "ArrowRight" ? 1 : -1;
            const nextIndex = (currentIndex + direction + tabsArray.length) % tabsArray.length;
            const nextTab = tabsArray[nextIndex];

            setMode(nextTab.dataset.mode);
            nextTab.focus();
        });
    });

    registerForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("register-name").value.trim();
        const email = document.getElementById("register-email").value.trim().toLowerCase();
        const password = document.getElementById("register-password").value;

        if (!name || !email || !password) {
            setMessage(messageEl, "Please complete all fields.", "error");
            return;
        }

        if (password.length < 6) {
            setMessage(messageEl, "Password must be at least 6 characters.", "error");
            return;
        }

        const users = getUsers();
        const existingUser = users.find((user) => user.email === email);

        if (existingUser) {
            setMessage(messageEl, "This email is already registered.", "error");
            return;
        }

        const newUser = { name, email, password };
        users.push(newUser);
        saveUsers(users);

        setMode("login", { clearMessage: false });
        document.getElementById("login-email").value = email;
        setMessage(messageEl, "Account created. Please sign in.", "success");
        registerForm.reset();
    });

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;

        if (!email || !password) {
            setMessage(messageEl, "Please enter your email and password.", "error");
            return;
        }

        const users = getUsers();
        const matchedUser = users.find((user) => user.email === email && user.password === password);

        if (!matchedUser) {
            setMessage(messageEl, "Invalid email or password.", "error");
            return;
        }

        window.location.href = "index.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initAuthPage();
});
