import Navigation from "../../components/navigation/navigation.js";
import router from "../../router.js";
import GenericView from "../GenericView.js";

export default class NewProductView extends GenericView {
    constructor () {
        super();

        this.view = document.createElement('div');
        this.view.classList.add('view', 'new-product-view');
    
        this.view.append(new Navigation());

        this.container = document.createElement('div');
        this.container.classList.add('new-product-container');
        this.view.append(this.container);

        this.form = document.createElement('form');
        this.form.classList.add('new-product-form');
        this.container.append(this.form);

        this.inputBarcode = document.createElement('input');
        this.inputBarcode.classList.add('new-product-input');
        this.inputBarcode.type = 'text';
        this.inputBarcode.placeholder = 'Código de Barras (requerido)';
        this.inputBarcode.required = true;
        this.form.append(this.inputBarcode);

        this.inputName = document.createElement('input');
        this.inputName.classList.add('new-product-input');
        this.inputName.type = 'text';
        this.inputName.placeholder = 'Nombre (requerido)';
        this.form.append(this.inputName);

        this.inputStock = document.createElement('input');
        this.inputStock.classList.add('new-product-input');
        this.inputStock.type = 'number';
        this.inputStock.min = '0';
        this.inputStock.placeholder = 'Stock';
        this.form.append(this.inputStock);

        this.inputImage = document.createElement('input');
        this.inputImage.classList.add('new-product-input');
        this.inputImage.type = 'file';
        this.inputImage.accept = 'image/*';
        this.form.append(this.inputImage);

        this.inputPriceMajor = document.createElement('input');
        this.inputPriceMajor.classList.add('new-product-input');
        this.inputPriceMajor.type = 'number';
        this.inputPriceMajor.min = 0;
        this.inputPriceMajor.placeholder = 'Precio Mayorista';
        this.form.append(this.inputPriceMajor);

        this.inputPriceMinor = document.createElement('input');
        this.inputPriceMinor.classList.add('new-product-input');
        this.inputPriceMinor.type = 'number';
        this.inputPriceMinor.min = 0;
        this.inputPriceMinor.placeholder = 'Precio Minorista';
        this.form.append(this.inputPriceMinor);

        this.submitButton = document.createElement('button');
        this.submitButton.type = 'submit';
        this.submitButton.classList.add('new-product-submit-button');
        this.submitButton.textContent = 'Crear Producto';
        this.form.append(this.submitButton);

        this.submitButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.submit();
        });
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);
        this.inputBarcode.focus();
    };

    async submit () {
        if (!this.inputBarcode.value) {
            this.inputBarcode.focus();
            return;
        };

        if (!this.inputName.value) {
            this.inputName.focus();
            return;
        };

        const product = {
            barcode: this.inputBarcode.value,
            name: this.inputName.value,
            stock: this.inputStock.value,
            price_major: this.inputPriceMajor.value,
            price_minor: this.inputPriceMinor.value
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(product));
        formData.append('image', this.inputImage.files[0]);

        this.form.reset();
        this.inputBarcode.focus();

        const request = await fetch('/api/products', {
            method: 'POST',
            body: formData
        });

        const response = await request.json();

        console.log(response);
    };
};