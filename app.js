(function () {
    const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function isSamePageHashLink(url) {
        return url.pathname === window.location.pathname && url.hash.length > 0;
    }

    function shouldHandleNavigation(event, link) {
        if (!link) {
            return false;
        }

        if (event.defaultPrevented || event.button !== 0) {
            return false;
        }

        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return false;
        }

        if (link.hasAttribute("download")) {
            return false;
        }

        const target = (link.getAttribute("target") || "").trim();
        if (target && target.toLowerCase() !== "_self") {
            return false;
        }

        const href = (link.getAttribute("href") || "").trim();
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
            return false;
        }

        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin) {
            return false;
        }

        if (isSamePageHashLink(url)) {
            return false;
        }

        return true;
    }

    function initPageTransitions() {
        document.body.classList.add("page-ready");

        document.addEventListener("click", (event) => {
            const link = event.target.closest("a[href]");
            if (!shouldHandleNavigation(event, link)) {
                return;
            }

            const url = new URL(link.href, window.location.href);
            if (REDUCED_MOTION) {
                window.location.href = url.href;
                return;
            }

            event.preventDefault();
            document.body.classList.add("page-leaving");
            window.setTimeout(() => {
                window.location.href = url.href;
            }, 180);
        });

        window.addEventListener("pageshow", () => {
            document.body.classList.remove("page-leaving");
            document.body.classList.add("page-ready");
        });
    }

    function initSkipLink() {
        const main = document.querySelector("main");
        if (!main) {
            return;
        }

        if (!main.id) {
            main.id = "main-content";
        }

        if (document.querySelector(".skip-link")) {
            return;
        }

        const skipLink = document.createElement("a");
        skipLink.className = "skip-link";
        skipLink.href = "#" + main.id;
        skipLink.textContent = "Skip to content";
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    function normalizePath(pathname) {
        const part = pathname.split("/").pop();
        return part || "index.html";
    }

    function markActiveNavLinks() {
        const currentPath = normalizePath(window.location.pathname);
        const navLinks = document.querySelectorAll(".nav-links a[href]");

        navLinks.forEach((link) => {
            link.removeAttribute("aria-current");
            const href = link.getAttribute("href") || "";

            if (href.startsWith("#")) {
                if (currentPath === "index.html" && href === "#beranda") {
                    link.setAttribute("aria-current", "page");
                }
                return;
            }

            const url = new URL(href, window.location.href);
            if (normalizePath(url.pathname) === currentPath) {
                link.setAttribute("aria-current", "page");
            }
        });
    }

    function createMobileMenu(navbar, navContent, navLinks) {
        if (navContent.querySelector(".nav-toggle") || navbar.querySelector(".mobile-menu")) {
            return;
        }

        const menuButton = document.createElement("button");
        menuButton.type = "button";
        menuButton.className = "nav-toggle";
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Toggle navigation menu");
        menuButton.textContent = "Menu";

        const mobileMenu = document.createElement("nav");
        mobileMenu.className = "mobile-menu";
        mobileMenu.setAttribute("aria-label", "Mobile navigation");

        const mobileLinks = navLinks.cloneNode(true);
        mobileLinks.classList.add("mobile-nav-links");
        mobileMenu.appendChild(mobileLinks);

        menuButton.addEventListener("click", () => {
            const isOpen = navbar.classList.toggle("mobile-open");
            menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        mobileMenu.addEventListener("click", (event) => {
            if (event.target.closest("a")) {
                navbar.classList.remove("mobile-open");
                menuButton.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("click", (event) => {
            if (!navbar.classList.contains("mobile-open")) {
                return;
            }

            if (!navbar.contains(event.target)) {
                navbar.classList.remove("mobile-open");
                menuButton.setAttribute("aria-expanded", "false");
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 768) {
                navbar.classList.remove("mobile-open");
                menuButton.setAttribute("aria-expanded", "false");
            }
        });

        navContent.appendChild(menuButton);
        navbar.appendChild(mobileMenu);
    }

    function initMobileNav() {
        const navbar = document.querySelector(".navbar");
        if (!navbar) {
            return;
        }

        const navContent = navbar.querySelector(".nav-content");
        const navLinks = navbar.querySelector(".nav-links");

        if (!navContent || !navLinks) {
            return;
        }

        createMobileMenu(navbar, navContent, navLinks);
    }

    function setImageLoadingHints() {
        const images = document.querySelectorAll("img");

        images.forEach((img) => {
            if (!img.getAttribute("decoding")) {
                img.setAttribute("decoding", "async");
            }

            if (img.closest(".hero-image") || img.closest(".course-hero-image")) {
                return;
            }

            if (!img.getAttribute("loading")) {
                img.setAttribute("loading", "lazy");
            }
        });
    }

    function isValidYouTubeId(id) {
        return /^[A-Za-z0-9_-]{11}$/.test(id);
    }

    function createYouTubeIframe(videoId, title) {
        const iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube-nocookie.com/embed/" + videoId + "?autoplay=1&rel=0&modestbranding=1";
        iframe.title = title;
        iframe.loading = "lazy";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allowFullscreen = true;
        return iframe;
    }

    function loadVideoPreview(button) {
        if (button.classList.contains("is-loaded")) {
            return;
        }

        const videoId = (button.dataset.ytId || "").trim();
        if (!isValidYouTubeId(videoId)) {
            return;
        }

        const title = (button.dataset.ytTitle || "YouTube preview video").trim();
        const iframe = createYouTubeIframe(videoId, title);
        button.innerHTML = "";
        button.appendChild(iframe);
        button.classList.add("is-loaded");
        button.setAttribute("aria-label", title + " loaded");
    }

    function initCourseVideoPreviews() {
        const previews = document.querySelectorAll(".video-preview[data-yt-id]");
        previews.forEach((button) => {
            const videoId = (button.dataset.ytId || "").trim();
            if (isValidYouTubeId(videoId)) {
                const thumbUrl = "url(https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg)";
                button.style.setProperty("--yt-thumb", thumbUrl);
            }

            const title = (button.dataset.ytTitle || "Preview kelas").trim();
            button.setAttribute("aria-label", "Putar video: " + title);

            button.addEventListener("click", () => {
                loadVideoPreview(button);
            });

            button.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                    return;
                }

                event.preventDefault();
                loadVideoPreview(button);
            });
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        initSkipLink();
        markActiveNavLinks();
        initMobileNav();
        setImageLoadingHints();
        initCourseVideoPreviews();
        initPageTransitions();
    });
})();
