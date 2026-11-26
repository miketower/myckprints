# Pagos de prueba en Myckprints

Usa Node.js 20 o posterior para servir el sitio y la API desde el mismo origen. El checkout está disponible para la playera de manga corta. El servidor aplica el mínimo de 10 piezas, $180 MXN por pieza y $150 MXN de envío. El descuento por volumen se consulta por separado.

Define estas variables en la terminal o en un gestor de secretos:

| Variable | Uso |
| --- | --- |
| `MERCADOPAGO_TEST_ACCESS_TOKEN` | Access Token de prueba de Checkout Pro México. El servidor acepta el prefijo `TEST-`. |
| `PAYPAL_SANDBOX_CLIENT_ID` | Client ID de una aplicación REST de PayPal Sandbox. |
| `PAYPAL_SANDBOX_CLIENT_SECRET` | Client Secret de esa aplicación. |
| `CHECKOUT_BASE_URL` | Origen de regreso. Mercado Pago requiere una URL HTTPS pública de prueba. PayPal puede iniciarse con el origen local predeterminado. |
| `CHECKOUT_ORDER_DIR` | Directorio privado de pedidos de prueba. Por defecto se usa `.checkout-orders/`, excluido de Git. |
| `HOST`, `PORT` | Dirección y puerto de Node. Por defecto, `127.0.0.1:3000`. |

Guarda las credenciales fuera de Git. Si se usa un archivo local ignorado por Git, inicia con `node --env-file=.env checkout-server.mjs`. Si las variables ya están exportadas, usa `node checkout-server.mjs`. Abre `http://localhost:3000/` para probar. MAMP puede seguir sirviendo la versión estática, y para probar los pagos abre el sitio desde Node o configura un proxy del mismo origen a Node.

Para Mercado Pago, abre el sitio desde el mismo origen HTTPS configurado en `CHECKOUT_BASE_URL`. Usa cuentas de comprador de prueba. Checkout Pro muestra los medios que habilite Mercado Pago para la cuenta y el flujo. La opción OXXO se debe verificar con la cuenta de prueba y su confirmación puede llegar después de generar la referencia.

La pantalla de regreso consulta al proveedor y admite volver a consultar. PayPal captura el pedido autorizado en el servidor. El mockup se mantiene en el navegador y, al confirmarse el pago de prueba, se muestra la referencia para compartir el diseño manualmente. Los pedidos de prueba son locales y no se procesan para producción. No hay confirmación en segundo plano mediante webhooks en esta versión.
