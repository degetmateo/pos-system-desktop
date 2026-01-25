import Navigation from "../components/navigation/navigation.js";
import GenericView from "./GenericView.js";

export default class extends GenericView {
    constructor () {
        super();

        this.view = document.createElement('div');
        this.view.classList.add('view');

        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('container', 'customers-create-container');
        this.view.append(this.container);

        this.form = document.createElement('form');
        this.form.classList.add('customers-create-form');
        this.container.append(this.form);

        this.name = document.createElement('input');
        this.name.classList.add('customers-create-input');
        this.name.placeholder = 'Nombre (requerido)';
        this.name.type = 'text';
        this.form.append(this.name);

        this.cuil = document.createElement('input');
        this.cuil.classList.add('customers-create-input');
        this.cuil.placeholder = 'CUIL';
        this.cuil.type = 'text';
        this.form.append(this.cuil);

        this.email = document.createElement('input');
        this.email.classList.add('customers-create-input');
        this.email.placeholder = 'Correo Electrónico';
        this.email.type = 'email';
        this.form.append(this.email);

        this.phone = document.createElement('input');
        this.phone.classList.add('customers-create-input');
        this.phone.placeholder = 'Teléfono';
        this.phone.type = 'text';
        this.form.append(this.phone);

        this.address = document.createElement('input');
        this.address.classList.add('customers-create-input');
        this.address.placeholder = 'Dirección';
        this.address.type = 'text';
        this.form.append(this.address);

        this.button = document.createElement('button');
        this.button.textContent = 'Guardar';
        this.button.type = 'submit';
        this.form.append(this.button);

        this.button.addEventListener('click', (event) => {
            event.preventDefault();
            this.submit();
        });

        this.message = document.createElement('span');
        this.message.hidden = true;
        this.form.append(this.message);        
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);
    };

    show_message (text, error = false) {
        this.message.hidden = false
        this.message.textContent = text;

        if (error) {
            this.message.classList.remove('message-success');
            this.message.classList.add('message-error');
        } else {
            this.message.classList.remove('message-error');
            this.message.classList.add('message-success');
        };
    };

    async submit () {
        try {
            const name = this.name.value;
            const cuil = this.cuil.value;
            const email = this.email.value;
            const phone = this.phone.value;
            const address = this.address.value;

            if (!name) return this.name.focus();

            this.form.reset();

            const request = await fetch ('/api/customers', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    cuil,
                    email,
                    phone,
                    address
                })
            });

            const response = await request.json();

            if (!request.ok) throw new Error(response.error.message);

            this.show_message('Cliente guardado correctamente.', false);
        } catch (error) {
            console.error(error);
            this.show_message(error.message, true);
        };
    };
};