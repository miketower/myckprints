const callback = new URLSearchParams(window.location.search);
const id = callback.get('pedido');
const token = callback.get('token');
const canceled = callback.get('cancelado') === '1';
const result = document.querySelector('#checkout-result');
const reference = document.querySelector('#checkout-reference');
const refresh = document.querySelector('#checkout-refresh');
const design = document.querySelector('#checkout-design');

async function checkStatus() {
  refresh.disabled = true;
  result.textContent = 'Consultando el pago de prueba…';
  try {
    const url = new URL('api/checkout/status', window.location.href);
    const options = { cache: 'no-store' };
    if (token && !canceled) {
      options.method = 'POST';
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify({ id, token });
    } else {
      url.searchParams.set('pedido', id);
    }
    const response = await fetch(url, options);
    const order = await response.json();
    if (!response.ok) throw new Error(order.error);
    reference.textContent = `Referencia del pedido: ${order.id}`;
    reference.hidden = false;
    if (order.status === 'pagado') {
      result.textContent = 'El proveedor confirmó el pago de prueba. Ningún pedido de prueba se prepara ni se envía.';
      const link = new URL(design.href);
      link.searchParams.set('text', `Hola, Myckprints. Quiero compartir el diseño para el pedido de prueba ${order.id}.`);
      design.href = link.href;
      design.hidden = false;
    } else if (order.status === 'no_aprobado') {
      result.textContent = 'El proveedor no aprobó el pago de prueba.';
    } else {
      result.textContent = canceled ? 'Saliste de la pantalla de pago. El proveedor aún no confirma un pago.' : 'El pago todavía está pendiente de confirmación.';
    }
  } catch (error) {
    result.textContent = error.message || 'No se pudo consultar el pedido.';
  } finally {
    refresh.disabled = false;
  }
}

if (id) {
  refresh.addEventListener('click', checkStatus);
  checkStatus();
} else {
  result.textContent = 'Falta la referencia del pedido de prueba.';
  refresh.hidden = true;
}
