# Pagos de prueba en Myckprints

Usa Node.js 20 o posterior para servir el sitio y la API desde el mismo origen. El checkout está disponible para la playera de manga corta ($180 MXN por pieza, mínimo 10), la playera de manga larga ($220 MXN por pieza, mínimo 12), la polo Dry Fit ($260 MXN por pieza, mínimo 12), la sudadera con capucha ($420 MXN por pieza, mínimo 10) y la sudadera sin capucha ($390 MXN por pieza, mínimo 10). La impresión en frente y reverso suma $40 MXN por prenda. La playera deportiva Dry Fit cuesta $200 MXN por pieza, con mínimo de 12. Las gorras de red DKPS 600 y 601 cuestan $90 MXN por pieza, con mínimo de 12 y solo impresión frontal. Los termos Kansas ($180 MXN) y Nevada ($250 MXN) tienen mínimo de 12 piezas y opciones de impresión a todo color y grabado láser. El envío fijo es de $150 MXN. El descuento por volumen se consulta por separado.

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
