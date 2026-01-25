import PopupConfirm from "../popup-confirm/popup-confirm.js";

class PriceListItem extends HTMLElement {
    constructor (data) {
        super();
        this.data = data;
        this.classList.add('price-list-item');

        this.name = document.createElement('span');
        this.date = document.createElement('span');
        this.deleteButton = document.createElement('button');
        
        this.name.textContent = data.name;
        this.date.textContent = new Date(data.created_at).toLocaleDateString();
        this.deleteButton.textContent = 'Eliminar';

        this.append(this.name);
        this.append(this.date);
        this.append(this.deleteButton);

        this.deleteButton.addEventListener('click', () => {
            this.delete();
        });
    };

    async delete () {
        new PopupConfirm({
            message: `¿Estás seguro de que deseas eliminar la lista de precios "${this.data.name}"? Los productos no se eliminarán pero ya no pertenecerán a esta lista.`,
            onConfirm: async () => {
                const request = await fetch(`/api/price-lists/${this.data.id}`, {
                    method: "DELETE"
                });

                const deleteResponse = await request.json();
                console.log(deleteResponse);
                this.remove();
            },
            onCancel: () => {

            }
        });
    };
};

customElements.define('price-list-item', PriceListItem);
export default PriceListItem;