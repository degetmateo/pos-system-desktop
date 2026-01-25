import Navigation from "../../components/navigation/navigation.js";
import PriceListItem from "../../components/price-list-item/price-list-item.js";
import GenericView from "../GenericView.js";

export default class PriceListsView extends GenericView {
    constructor () {
        super();

        this.view = document.createElement('div');
        this.view.classList.add('view', 'price-lists-view');

        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('price-lists-container');
        this.view.append(this.container);

        this.form = document.createElement('form');
        this.form.classList.add('price-lists-form');
        this.container.append(this.form);

        this.inputName = document.createElement('input');
        this.inputName.classList.add('price-list-name-input');
        this.inputName.type = 'text';
        this.inputName.placeholder = 'Nombre';
        this.form.append(this.inputName);
    
        this.button = document.createElement('button');
        this.button.classList.add('price-list-create-button');
        this.button.type = 'submit';
        this.button.textContent = 'Crear';
        this.form.append(this.button);

        this.list = document.createElement('div');
        this.list.classList.add('price-lists-list');
        this.container.append(this.list);

        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            this.submit();
        });
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);
        this.list.innerHTML = '';

        const request = await fetch('/api/price-lists', {
            method: "GET",
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const response = await request.json();

        for (const element of response.data) {
            this.list.append(new PriceListItem(element));
        };
    };

    async submit () {
        const name = this.inputName.value.trim();
        
        if (name === '') {
            return;
        };

        const request = await fetch('/api/price-lists', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        const response = await request.json();

        this.list.append(new PriceListItem(response.data));
    };
}; 