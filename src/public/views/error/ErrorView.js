import GenericView from "../GenericView.js";

export default class ErrorView extends GenericView {
    constructor () {
        super();
    }

    async init () {
        this.app.innerHTML = '';

        const title = document.createElement('h1');
        title.textContent = 'Error View';

        this.app.append(title);
    };
};