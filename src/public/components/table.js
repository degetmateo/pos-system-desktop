class Table extends HTMLElement {
    constructor (columns = []) {
        super();
        this.columns = columns;
        this.classList.add('table');

        this.table = document.createElement('table');
        this.append(this.table);
        
        this.head = document.createElement('thead');
        this.table.append(this.head);
        
        this.body = document.createElement('tbody');
        this.table.append(this.body);

        this.headRow = document.createElement('tr');
        this.head.append(this.headRow);

        for (const column of columns) {
            const row = document.createElement('td');
            row.textContent = column.name;
            this.headRow.append(row);
        };
    };
};

customElements.define('app-table', Table);
export default Table;