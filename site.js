const form = document.querySelector('#quote-form');
const product = document.querySelector('#product');
const quantity = document.querySelector('#quantity');
const details = document.querySelector('#details');
const panel = document.querySelector('#message-panel');
const message = document.querySelector('#message');
const status = document.querySelector('#copy-status');

function hideMessage() {
  panel.hidden = true;
  status.textContent = '';
}

form.addEventListener('input', hideMessage);

for (const link of document.querySelectorAll('[data-product]')) {
  link.addEventListener('click', () => {
    product.value = link.dataset.product;
    hideMessage();
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const description = details.value.trim();
  message.value = [
    '¡Hola, Myckprints! Me gustaría cotizar un pedido personalizado.',
    `Producto: ${product.value}`,
    `Cantidad: ${quantity.value} piezas`,
    description && `Detalles: ${description}`,
    '¿Me confirman el mínimo para este producto y el precio? Gracias.'
  ].filter(Boolean).join('\n');
  status.textContent = '';
  panel.hidden = false;
  message.focus();
});

document.querySelector('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(message.value);
    status.textContent = 'Mensaje copiado. Pégalo en un mensaje directo de Instagram.';
  } catch {
    message.focus();
    message.select();
    status.textContent = 'Seleccionamos el mensaje para que puedas copiarlo.';
  }
});
