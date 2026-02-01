import router from "./router.js";

window.addEventListener('popstate', () => {
    router.resolve();
});

document.addEventListener("DOMContentLoaded", () => {
    router.resolve();
});

if (window.api) {
    window.api.on('error', (error) => {
        console.error(error);
    });
};