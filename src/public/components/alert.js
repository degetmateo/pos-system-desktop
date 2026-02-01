export default class Alert {
    constructor (data = {
        message: '',
        error: false,
        timeout: 4000
    }) {
        this.container = document.createElement('div');
        this.container.classList.add('alert');

        if (data.error) this.container.classList.add('alert-error');

        this.container.innerHTML = `
            <span class="alert-message">${data.message}</span>
        `;

        this.container.addEventListener('click', (event) => {
            this.remove();
        });

        setTimeout(() => {
            this.remove();
        }, data.timeout || 4000);
    };

    render () {
        document.querySelector('#app').append(this.container);
    };

    remove () {
        this.container.remove();
    };
};