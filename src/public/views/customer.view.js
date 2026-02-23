import Navigation from "../components/navigation/navigation.js";
import alertsManager from "../modules/alerts.manager.js";
import GenericView from "./GenericView.js";
import customerTemplate from "./templates/customer.template.js";

export default class CustomerView extends GenericView {
    constructor () {
        super();
        this.meta = null;
        this.view = document.createElement('div');
        this.view.classList.add('view');
        this.view.append(new Navigation());
        this.container = document.createElement('div');
        this.container.classList.add('container','customer-view-container');
        this.view.append(this.container);
        this.container.innerHTML = customerTemplate;

        this.container.addEventListener('click', (event) => {
            if (event.target.matches('#customer-update-button')) {
                this.submit();
            };
        });
    };

    async init (meta) {
        this.meta = meta;
        this.app.innerHTML = '';
        this.app.append(this.view);

        this.nameInput = document.querySelector('#customer-name');
        this.cuilInput = document.querySelector('#customer-cuil');
        this.emailInput = document.querySelector('#customer-email');
        this.phoneInput = document.querySelector('#customer-phone');
        this.addressInput = document.querySelector('#customer-address');
        this.typeInput = document.querySelector('#customer-select');

        const customer = await this.fetchCustomer(meta.data.id);
        this.drawCustomer(customer);
    };

    async submit () {
        try {
            const request = await fetch(`/api/customers/${this.meta.data.id}`, {
                method: "PUT",
                headers: { "Content-Type": 'application/json' },
                body: JSON.stringify({
                    name: this.nameInput.value,
                    cuil: this.cuilInput.value,
                    email: this.emailInput.value,
                    phone: this.phoneInput.value,
                    address: this.addressInput.value,
                    type: this.typeInput.value
                })
            });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            alertsManager.createAlert("Cliente actualizado correctamente.", false);
        } catch (error) {
            console.error(error);
            alertsManager.createAlert(error.message, true);
        };
    };

    async fetchCustomer (customerId) {
        try {
            const request = await fetch(`/api/customers?id=${customerId}`, { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data[0];
        } catch (error) {
            console.error(error);
            alertsManager.createAlert(error.message, true);
            return null;
        };
    };

    drawCustomer (customer) {
        this.setName(customer.name);
        this.setCUIL(customer.cuil);
        this.setEmail(customer.email);
        this.setPhone(customer.phone);
        this.setAddress(customer.address);
        this.setType(customer.default_order_type);
    };

    setName (name) {
        this.nameInput.value = name;
    };

    setCUIL (cuil) {
        this.cuilInput.value = cuil || '';
    };

    setEmail (email) {
        this.emailInput.value = email || '';
    };

    setPhone (phone) {
        this.phoneInput.value = phone || '';
    };

    setAddress (address) {
        this.addressInput.value = address || '';
    };

    setType (type) {
        this.typeInput.value = type ? type : '';
    };
};