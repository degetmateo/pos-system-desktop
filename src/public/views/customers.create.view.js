import Navigation from "../components/navigation/navigation.js";
import alertsManager from "../modules/alerts.manager.js";
import GenericView from "./GenericView.js";
import customersCreateTemplate from "./templates/customers.create.template.js";

export default class extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('div');
        this.view.classList.add('view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('container', 'customers-create-container');
        this.view.append(this.container);
        this.container.innerHTML = customersCreateTemplate;

        this.container.addEventListener('change', (event) => {
            const storage = this.loadStorage();
            if (event.target.matches('#customers-create-name')) {
                storage.name = event.target.value;
                this.saveStorage(storage);
            };
            if (event.target.matches('#customers-create-cuil')) {
                storage.cuil = event.target.value;
                this.saveStorage(storage);
            };
            if (event.target.matches('#customers-create-email')) {
                storage.email = event.target.value;
                this.saveStorage(storage);
            };
            if (event.target.matches('#customers-create-phone')) {
                storage.phone = event.target.value;
                this.saveStorage(storage);
            };
            if (event.target.matches('#customers-create-address')) {
                storage.address = event.target.value;
                this.saveStorage(storage);
            };
            if (event.target.matches('#customers-create-select')) {
                storage.type = event.target.value;
                this.saveStorage(storage);
            };
        });

        this.container.addEventListener('click', (event) => {
            if (event.target.matches('#customers-create-button')) {
                this.submit();
            };
        });
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);

        if (!localStorage.getItem('new-customer')) {
            this.reset_storage();
        };

        this.draw();
    };

    loadStorage () {
        return JSON.parse(localStorage.getItem('new-customer'));
    };

    saveStorage (data) {
        localStorage.setItem('new-customer', JSON.stringify(data));
    };

    reset_storage () {
        localStorage.setItem('new-customer', JSON.stringify({
            name: null,
            cuil: null,
            email: null,
            phone: null,
            address: null,
            type: ''
        }));
    };

    draw () {
        const storage = this.loadStorage();
        this.getName().value = storage.name;
        this.getCuil().value = storage.cuil;
        this.getEmail().value = storage.email;
        this.getPhone().value = storage.phone;
        this.getAddress().value = storage.address;
        this.getType().value = storage.type;
    };

    getForm = () => document.querySelector('#customers-create-form');
    getName = () => document.querySelector('#customers-create-name');
    getCuil = () => document.querySelector('#customers-create-cuil');
    getEmail = () => document.querySelector('#customers-create-email');
    getPhone = () => document.querySelector('#customers-create-phone');
    getAddress = () => document.querySelector('#customers-create-address');
    getType = () => document.querySelector('#customers-create-select');

    async submit () {
        try {
            const request = await fetch ('/api/customers', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: localStorage.getItem('new-customer')
            });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            this.getForm().reset();
            this.reset_storage();
            alertsManager.createAlert("Cliente creado correctamente.", false);
        } catch (error) {
            console.error(error);
            alertsManager.createAlert(error.message, true);
        };
    };
};