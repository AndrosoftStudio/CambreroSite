// Mercado Pago Configuration
window.MercadoPagoConfig = {
    publicKey: 'APP_USR-abf9c3f7-8f45-4c4f-8dbf-f415022b3c19',
    accessToken: 'APP_USR-1039390810321859-080911-ff8c2134c4565f94e47a5c36e48ab50e-1976790370',
    
    init() {
        this.mp = new MercadoPago(this.publicKey, {
            locale: 'pt-BR'
        });
        console.log('MercadoPago initialized');
    }
};