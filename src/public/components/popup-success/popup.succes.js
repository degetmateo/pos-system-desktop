export default class PopupConfirm {
    constructor (data) {
        this.data = data;
        this.message = data.message;
        this.app = document.getElementById('app');

        this.popup = document.createElement('div');
        this.popup.classList.add('popup-success');
        this.app.append(this.popup);

        this.box = document.createElement('div');
        this.box.classList.add('popup-success-box');
        this.popup.append(this.box);

        this.text = document.createElement('p');
        this.text.textContent = data.message;
        this.box.append(this.text);

        this.buttons = document.createElement('div');
        this.buttons.classList.add('popup-buttons');
        this.box.append(this.buttons);

        this.confirmButton = document.createElement('button');
        this.confirmButton.textContent = 'Confirmar';
        this.buttons.append(this.confirmButton);

        this.cancelButton = document.createElement('button');
        this.cancelButton.textContent = 'Cancelar';
        this.buttons.append(this.cancelButton);

        this.confirmButton.addEventListener('click', () => {
            this.data.onConfirm();
            this.close();
        });

        this.cancelButton.addEventListener('click', () => {
            this.data.onCancel();
            this.close();
        });
    };

    close () {
        this.popup.remove();
    };
};