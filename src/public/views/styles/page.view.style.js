export default () => {
    return `
        <style>
            .page-view-content {
                display:flex;
                align-items:center;
                justify-content:center;
                height: calc(100vh - 50px);
            }
            .page-view-form {
                display:flex;
                gap:10px;
                flex-direction:column;
                align-items:center;
                justify-content:center;
            }
        </style>
    `;
};