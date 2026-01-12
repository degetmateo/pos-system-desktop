import router from "./router.js";

window.addEventListener('popstate', () => {
    router.resolve();
});

document.addEventListener("DOMContentLoaded", () => {
    router.resolve();
});