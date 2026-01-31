import Navigation from "../components/navigation/navigation.js";
import GenericView from "./GenericView.js";

export default class ProductsCreateView extends GenericView {
    constructor () {
        super();
        this.view = document.createElement('div');
        this.view.classList.add('view');
        this.view.append(new Navigation());
        
        this.container = document.createElement('div');
        this.container.classList.add('container', 'products-create-container');
        this.view.append(this.container);

        this.r1 = document.createElement('div');
        this.r1.classList.add('products-create-container-r1');
        this.container.append(this.r1);

        this.r2 = document.createElement('div');
        this.r2.classList.add('products-create-container-r2');
        this.container.append(this.r2);

        this.message = document.createElement('span');
        this.message.classList.add('products-create-message');
        this.r2.append(this.message);
        this.message.textContent = 'Nada que reportar.';

        this.draw_c1();
        this.draw_c2();
        this.draw_c3();

        this.minor_prices = [];

        this.data = {
            barcode: null,
            name: null,
            stock: null,
            image: null,
            major_price: null,
            minor_price: null,
            provider_id: null,
            minor_prices: []
        };

        this.timeout = null;
    };

    draw_c1 () {
        this.containerC1 = document.createElement('div');
        this.containerC1.classList.add('products-create-container-c1');
        this.r1.append(this.containerC1);

        this.form = document.createElement('form');
        this.form.classList.add('products-create-form');
        this.containerC1.append(this.form);

        this.formTitle = document.createElement('span');
        this.formTitle.classList.add('products-create-title');
        this.formTitle.textContent = 'Información básica.';
        this.form.append(this.formTitle);

        this.barcode = document.createElement('input');
        this.barcode.classList.add('products-create-input-text');
        this.barcode.type = 'text';
        this.barcode.placeholder = 'Código de Barras';
        this.form.append(this.barcode);

        this.name = document.createElement('input');
        this.name.classList.add('products-create-input-text');
        this.name.type = 'text';
        this.name.placeholder = 'Nombre';
        this.form.append(this.name);

        this.stock = document.createElement('input');
        this.stock.classList.add('products-create-input-text');
        this.stock.type = 'number';
        this.stock.placeholder = 'Stock';
        this.stock.min = 0;
        this.form.append(this.stock);

        this.buttonForm = document.createElement('button');
        this.buttonForm.classList.add('products-create-button');
        this.buttonForm.type = 'button';
        this.buttonForm.textContent = 'Crear Producto';
        this.form.append(this.buttonForm);

        this.buttonForm.addEventListener('click', (event) => {
            event.preventDefault();
            console.log("BOTON PRESIONADO");
            this.submit();
        });

        this.buttonBarcodeContainer = document.createElement('div');
        this.buttonBarcodeContainer.classList.add('products-create-button-barcode-container');
        this.containerC1.append(this.buttonBarcodeContainer);

        this.buttonBarcodeTitle = document.createElement('span');
        this.buttonBarcodeTitle.classList.add('products-create-title');
        this.buttonBarcodeTitle.textContent = 'Generar un nuevo código de barras.';
        this.buttonBarcodeContainer.append(this.buttonBarcodeTitle);

        this.buttonBarcode = document.createElement('button');
        this.buttonBarcode.classList.add('products-create-button');
        this.buttonBarcode.type ='button';
        this.buttonBarcode.textContent = 'Generar Código';
        this.buttonBarcodeContainer.append(this.buttonBarcode);

        this.buttonBarcode.addEventListener('click', async (event) => {
            event.preventDefault();
            this.barcode.value = 'INTERNAL_BARCODE';
        });

        this.imageContainer = document.createElement('div');
        this.imageContainer.classList.add('products-create-image-container');
        this.containerC1.append(this.imageContainer);

        this.imageTitle = document.createElement('span');
        this.imageTitle.classList.add('products-create-title');
        this.imageTitle.textContent = 'Seleccionar imagen del producto.';
        this.imageContainer.append(this.imageTitle);

        this.image = document.createElement('input');
        this.image.type = 'file';
        this.image.accept = 'image/*';

        this.image.addEventListener('change', () => {
            this.imageName.textContent = this.image.files[0].name;
        });

        this.buttonImage = document.createElement('button');
        this.buttonImage.classList.add('products-create-button');
        this.buttonImage.textContent = 'Seleccionar Imagen';
        this.imageContainer.append(this.buttonImage);

        this.buttonImage.addEventListener('click', (event) => {
            event.preventDefault();
            this.image.click();
        });

        this.imageName = document.createElement('span');
        this.imageName.textContent = 'Ninguna imagen seleccionada.';
        this.imageName.classList.add('products-create-text');
        this.imageContainer.append(this.imageName);

        this.messageContainer = document.createElement('div');
        this.messageContainer.classList.add('products-create-message-container');
        this.containerC1.append(this.messageContainer);
    };

    draw_c2 () {
        this.containerC2 = document.createElement('div');
        this.containerC2.classList.add('products-create-container-c2');
        this.r1.append(this.containerC2);

        this.majorPriceContainer = document.createElement('div');
        this.majorPriceContainer.classList.add('products-create-major-price-container');
        this.containerC2.append(this.majorPriceContainer);

        this.majorPriceTitle = document.createElement('span');
        this.majorPriceTitle.classList.add('products-create-title');
        this.majorPriceTitle.textContent = 'Establecer precio mayorista.';
        this.majorPriceContainer.append(this.majorPriceTitle);

        this.majorPrice = document.createElement('input');
        this.majorPrice.classList.add('products-create-input-text');
        this.majorPrice.type = 'number';
        this.majorPrice.placeholder = 'Precio Mayorista';
        this.majorPrice.min = 0;
        this.majorPriceContainer.append(this.majorPrice);

        this.minorPriceContainer = document.createElement('div');
        this.minorPriceContainer.classList.add('products-create-minor-price-container');
        this.containerC2.append(this.minorPriceContainer);

        this.minorPriceTitle = document.createElement('span');
        this.minorPriceTitle.classList.add('products-create-title');
        this.minorPriceTitle.textContent = 'Establecer precios minoristas.';
        this.minorPriceContainer.append(this.minorPriceTitle);

        this.baseMinorPrice = document.createElement('input');
        this.baseMinorPrice.classList.add('products-create-input-text');
        this.baseMinorPrice.type = 'number';
        this.baseMinorPrice.placeholder = 'Precio Minorista Base';
        this.baseMinorPrice.min = 0;
        this.minorPriceContainer.append(this.baseMinorPrice);

        this.buttonAddMinorPrice = document.createElement('button');
        this.buttonAddMinorPrice.textContent = 'Agregar Precio Minorista';
        this.buttonAddMinorPrice.classList.add('products-create-button');
        this.minorPriceContainer.append(this.buttonAddMinorPrice);

        this.minorPricesContainer = document.createElement('div');
        this.minorPricesContainer.classList.add('products-create-minor-prices-container');
        this.minorPriceContainer.append(this.minorPricesContainer);

        this.buttonAddMinorPrice.addEventListener('click', (event) => {
            event.preventDefault();

            const inputContainer = document.createElement('div');
            inputContainer.classList.add('products-create-minor-price-updated-container');
            this.minorPricesContainer.append(inputContainer);

            const inputCondition = document.createElement('input');
            inputCondition.classList.add('products-create-minor-price-updated-input');
            inputCondition.type = 'number';
            inputCondition.min = 0;
            inputCondition.placeholder = 'Condición';
            inputContainer.append(inputCondition);

            const inputMinorPrice = document.createElement('input');
            inputMinorPrice.classList.add('products-create-minor-price-updated-input');
            inputMinorPrice.type = 'number';
            inputMinorPrice.min = 0;
            inputMinorPrice.placeholder = 'Precio Nuevo';
            inputContainer.append(inputMinorPrice);

            const buttonDeleteMinorPrice = document.createElement('button');
            buttonDeleteMinorPrice.textContent = 'Eliminar';
            buttonDeleteMinorPrice.type = 'button';
            inputContainer.append(buttonDeleteMinorPrice);

            const date = Date.now();
            this.minor_prices.push({
                id: date,
                input_cond: inputCondition,
                input_value: inputMinorPrice
            });

            buttonDeleteMinorPrice.addEventListener('click', (event) => {
                event.preventDefault();
                inputContainer.remove();
                this.minor_prices = this.minor_prices.filter((e) => e.id !== date);
            });
        });
    };

    draw_c3 () {
        this.containerC3 = document.createElement('div');
        this.containerC3.classList.add('products-create-container-c3');
        this.r1.append(this.containerC3);

        this.containerC3.innerHTML = `
            <div class="products-create-provider-container">
                <span class="products-create-title">Establecer proveedor.</span>
                <select id="products-create-provider-select">
                    <option value="none">SIN ASIGNAR</option>
                </select>
            </div>

            <div class="products-create-provider-create-container">
                <input 
                    type="text" 
                    placeholder="Nombre" 
                    class="products-create-input-text products-create-provider-input"
                    id="products-create-provider-input" 
                />

                <button
                    type="button"
                    id="products-create-button-create-provider"
                    class="products-create-button"
                >Crear</button>
            </div>
        `;

        this.containerC3.addEventListener('click', async (event) => {
            if (event.target.matches('#products-create-button-create-provider')) {
                try {
                    const request = await fetch('/api/providers', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name: document.querySelector('#products-create-provider-input').value
                        })
                    });
                    const response = await request.json();
                    if (!request.ok) throw new Error(response.error.message);
                    document.querySelector('#products-create-provider-input').value = '';

                    const providers = await this.fetch_providers();
                    providers.sort((a, b) => a.name.localeCompare(b.name));
                    this.draw_providers(providers);

                    this.show_message("Proveedor creado correctamente.", false);
                } catch (error) {
                    console.error(error);
                    this.show_message(error.message, true);
                };
            };
        });
    };

    async init () {
        this.app.innerHTML = '';
        this.app.append(this.view);

        this.barcode.focus();

        const providers = await this.fetch_providers();
        providers.sort((a, b) => a.name.localeCompare(b.name));
        this.draw_providers(providers);
    };

    show_message (message, error = false) {
        this.message.textContent = message;

        if (error) {
            this.message.classList.remove('products-create-message-success');
            this.message.classList.add('products-create-message-error');
        } else {
            this.message.classList.remove('products-create-message-error');
            this.message.classList.add('products-create-message-success');
        };

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        };

        this.timeout = setTimeout(() => {
            this.message.textContent = 'Nada que reportar.';
            this.message.classList.remove('products-create-message-success');
            this.message.classList.remove('products-create-message-error');
            this.timeout = null;
        }, 8000);
    };

    async fetch_providers () {
        try {
            const request = await fetch('/api/providers', { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data;
        } catch (error) {
            console.error(error);
            this.show_message(error.message, true);
        };
    };

    draw_providers (providers) {
        const selector = document.querySelector('#products-create-provider-select');

        selector.innerHTML = `
            <option value="none">SIN ASIGNAR</option>
        `;

        for (const provider of providers) {
            selector.innerHTML += `
                <option value="${provider.id}">${provider.name}</option>
            `;
        };
    };

    async fetch_new_barcode () {
        try {
            const request = await fetch('/api/barcodes/new', { method: "GET" });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);
            return response.data;
        } catch (error) {
            console.error(error);
            this.show_message(error.message, true);
            return '';
        };
    };

    async submit () {
        try {
            const providerSelector = document.querySelector('#products-create-provider-select');

            const barcode = this.barcode.value;
            const name = this.name.value;
            const stock = this.stock.value;
            const provider_id = providerSelector.value;
            const price_major = this.majorPrice.value;
            const price_minor = this.baseMinorPrice.value;
            const image = this.image.files[0];

            const minor_prices = this.minor_prices.map((element) => ({
                condition: element.input_cond.value,
                price: element.input_value.value
            }));
            
            const data = new FormData();
            data.append('data', JSON.stringify({
                barcode,
                name,
                stock,
                provider_id,
                price_major,
                price_minor,
                minor_prices
            }));
            data.append('image', image);

            const request = await fetch('/api/products', {
                method: "POST",
                body: data
            });
            const response = await request.json();
            if (!request.ok) throw new Error(response.error.message);

            this.show_message('Producto creado correctamente.', false);
            this.barcode.focus();
            this.reset();
        } catch (error) {
            console.error(error);
            this.show_message(error.message, true);  
        };
    };

    reset () {
        const providerSelector = document.querySelector('#products-create-provider-select');
        providerSelector.value = 'none';

        this.barcode.value = '';
        this.name.value = '';
        this.stock.value = null;

        this.majorPrice.value = null;
        this.baseMinorPrice.value = null;
        this.image.value = null;
        this.imageName.textContent = 'Ninguna imagen seleccionada.';
        this.minor_prices = [];
        this.minorPricesContainer.innerHTML = '';
    };
};