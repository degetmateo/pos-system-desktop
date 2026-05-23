module.exports = () => {
    return `
        <style>
            @page {
                size: A4 portrait;
                margin: 1.5cm;
            }

            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;

                font-family: sans-serif; 
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .header { 
                display: flex; 
                justify-content: space-between; 
                border-bottom: 1px solid #ddd;
                padding-bottom: 20px;
            }
            
            table {
                width: 100%;
                page-break-inside: auto;
                break-inside: auto;
                border-collapse: collapse;
            }

            tr {
                page-break-inside: avoid;
                break-inside: avoid;
                page-break-after: auto;
            }

            thead {
                display: table-header-group;
            }
            
            thead::before {
                content: "";
                display: block;
            
            }

            th, td { 
                border-bottom: 1px solid #ddd; 
                padding: 8px;
            }
            
            .text-left {
                text-align: left;
            }
            
            .text-right {
                text-align: right;
            }
            
            .text-center {
                text-align: center;
            }
            
            .total-container {
                page-break-inside: avoid;
                display:flex;
                flex-direction:column;
            }
            .total {
                font-size: 20px; 
                font-weight: bold;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .table-head {
                border-bottom: 2px solid #000;
            }
            
            .table-head-cell {
                text-align: right;
            }

            .table-head-cell-name {
                text-align: left;
            }

            .text-bold {
                font-weight: bold;
            }

            .customer {
                display: flex;
                flex-direction:column;
            }

            .text-secondary {
                font-size: 14px;
                color: #b5b5b5;
            }

            .header-title {
                font-size: 30px;
                font-weight: bold;
            }
            
            .detail-container {
                display: flex;
                flex-direction: column;
                gap: 5px;

                align-items: flex-end;
                justify-content: flex-start;

                font-size: 20px;
            }

            tfoot {
                display: table-footer-group;
            }

            .footer {
                border: none !important;
            }

            .payment-data-container {
                display: flex;
                flex-direction: column;
                align-items:flex-end;
                gap: 5px;
                font-size: 12px;
            }

            .disclaimer {
                page-break-inside: avoid;
                font-size: 10px;
            }

            .header-details-container {
                display:flex;
                flex-direction:row;
                align-items:center;
                justify-content:space-between;
            }   
        </style>
    `;
};