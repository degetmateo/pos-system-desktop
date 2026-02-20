export default class Alert {
    constructor (message, error, timeout, onRemove) {
        this.onRemove = onRemove;

        this.container = document.createElement('div');
        this.container.classList.add('alert');

        if (error) this.container.classList.add('alert-error');

        this.container.innerHTML = `
            <span class="alert-message">${message}</span>
        `;

        this.container.addEventListener('click', () => {
            this.remove();
        });

        setTimeout(() => {
            this.remove();
        }, timeout || 4000);
    };

    render () {
        return this.container;
    };

    remove () {
        this.container.remove();
        if (this.onRemove) this.onRemove();
    };
};