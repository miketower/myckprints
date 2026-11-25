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

const requestedProduct = new URLSearchParams(window.location.search).get('cotizar');
if (Array.from(product.options).some((option) => option.value === requestedProduct)) {
  product.value = requestedProduct;
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

const whatsappTooltip = document.querySelector('#whatsapp-tooltip');
const whatsappStatus = document.querySelector('#whatsapp-status');
const whatsappButton = document.querySelector('.whatsapp-button');
const whatsappDismiss = document.querySelector('#whatsapp-dismiss');

const invitationTimer = window.setTimeout(() => {
  whatsappTooltip.hidden = false;
  whatsappStatus.textContent = document.querySelector('#whatsapp-invitation').textContent;
}, 2000);

function dismissInvitation() {
  window.clearTimeout(invitationTimer);
  whatsappTooltip.hidden = true;
  whatsappStatus.textContent = '';
  if (document.activeElement === whatsappDismiss) {
    whatsappButton.focus();
  }
}

whatsappDismiss.addEventListener('click', dismissInvitation);
whatsappButton.addEventListener('click', dismissInvitation);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !whatsappTooltip.hidden) {
    dismissInvitation();
  }
});
