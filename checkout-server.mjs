import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { capModels, checkoutProducts, poloColors, printLabels, unitPrice } from './pricing.js';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const base = new URL(process.env.CHECKOUT_BASE_URL || `http://localhost:${port}/`);
if (!['https:', 'http:'].includes(base.protocol) || (base.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(base.hostname)) || base.pathname !== '/' || base.search || base.hash || base.username || base.password) {
  throw new Error('CHECKOUT_BASE_URL debe ser un origen HTTPS o localhost para pruebas.');
}
const orders = resolve(process.env.CHECKOUT_ORDER_DIR || resolve(root, '.checkout-orders'));
const mpToken = process.env.MERCADOPAGO_TEST_ACCESS_TOKEN;
const paypalId = process.env.PAYPAL_SANDBOX_CLIENT_ID;
const paypalSecret = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;
const mpReady = Boolean(mpToken?.startsWith('TEST-') && base.protocol === 'https:');
const paypalReady = Boolean(paypalId && paypalSecret);
const mpApi = 'https://api.mercadopago.com';
const paypalApi = 'https://api-m.sandbox.paypal.com';
const staticFiles = new Set(['index.html', 'mockup.html', 'mockup.css', 'mockup.js', 'site.js', 'styles.css', 'pricing.js', 'checkout.html', 'checkout.js']);
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp' };

class CheckoutError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function providerRequest(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000), redirect: 'error' });
  if (!response.ok) {
    throw new Error(`El proveedor respondió HTTP ${response.status}`);
  }
  return response.json();
}

async function paypalToken() {
  const credentials = Buffer.from(`${paypalId}:${paypalSecret}`).toString('base64');
  const result = await providerRequest(`${paypalApi}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  return result.access_token;
}

function returnUrl(order, canceled = false) {
  const url = new URL('/checkout.html', base);
  url.searchParams.set('pedido', order.id);
  if (canceled) url.searchParams.set('cancelado', '1');
  return url.href;
}

function approvalUrl(value, hosts) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !hosts.includes(url.hostname) || url.username || url.password || url.port) {
    throw new Error('URL de aprobación inesperada.');
  }
  return url.href;
}

async function createPayment(order, pricing) {
  const itemName = order.model ? `${pricing.name} ${order.model}` : pricing.name;
  if (order.provider === 'mercadopago') {
    const data = await providerRequest(`${mpApi}/checkout/preferences`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_reference: order.id,
        items: [
          { id: order.product, title: `${itemName} · ${printLabels.get(order.printSides)}`, quantity: order.quantity, unit_price: unitPrice(pricing, order.printSides), currency_id: 'MXN' },
          { id: 'envio', title: 'Envío', quantity: 1, unit_price: pricing.shipping, currency_id: 'MXN' },
        ],
        back_urls: { success: returnUrl(order), pending: returnUrl(order), failure: returnUrl(order) },
      }),
    });
    return { providerId: data.id, url: approvalUrl(data.sandbox_init_point, ['sandbox.mercadopago.com.mx', 'sandbox.mercadopago.com']) };
  }

  const token = await paypalToken();
  const data = await providerRequest(`${paypalApi}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': order.id },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order.id,
        description: `${order.quantity} × ${itemName} · ${printLabels.get(order.printSides)} · Envío incluido`,
        amount: { currency_code: 'MXN', value: order.total.toFixed(2) },
      }],
      payment_source: { paypal: { experience_context: {
        user_action: 'PAY_NOW', return_url: returnUrl(order), cancel_url: returnUrl(order, true),
      } } },
    }),
  });
  const approve = data.links.find(({ rel }) => rel === 'payer-action' || rel === 'approve');
  return { providerId: data.id, url: approvalUrl(approve?.href, ['www.sandbox.paypal.com', 'sandbox.paypal.com']) };
}

function matchesPayment(order, amount, currency) {
  return currency === 'MXN' && Number(amount) === order.total;
}

async function verifyMercadoPago(order) {
  const url = new URL('/v1/payments/search', mpApi);
  url.searchParams.set('external_reference', order.id);
  url.searchParams.set('sort', 'date_created');
  url.searchParams.set('criteria', 'desc');
  const { results } = await providerRequest(url, { headers: { Authorization: `Bearer ${mpToken}` } });
  const payments = results.filter((payment) => payment.external_reference === order.id &&
    payment.live_mode === false && matchesPayment(order, payment.transaction_amount, payment.currency_id));
  if (payments.some(({ status }) => status === 'approved')) return 'pagado';
  if (payments.some(({ status }) => ['pending', 'in_process', 'in_mediation', 'authorized'].includes(status))) return 'pendiente';
  if (payments.length) return 'no_aprobado';
  return 'pendiente';
}

async function verifyPayPal(order, capture) {
  const authorization = { Authorization: `Bearer ${await paypalToken()}` };
  const url = `${paypalApi}/v2/checkout/orders/${encodeURIComponent(order.providerId)}`;
  let data = await providerRequest(url, { headers: authorization });
  const expectedUnit = data.purchase_units?.find(({ reference_id }) => reference_id === order.id);
  if (data.id !== order.providerId || !expectedUnit ||
      !matchesPayment(order, expectedUnit.amount?.value, expectedUnit.amount?.currency_code)) {
    throw new Error('Pedido de PayPal inesperado.');
  }
  if (capture && data.status === 'APPROVED') {
    data = await providerRequest(`${url}/capture`, {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json', 'PayPal-Request-Id': `capture-${order.id}`, Prefer: 'return=representation' },
      body: '{}',
    });
  }
  const unit = data.purchase_units?.find(({ reference_id }) => reference_id === order.id);
  if (data.id !== order.providerId || !unit) throw new Error('Pedido de PayPal inesperado.');
  const payments = unit.payments?.captures || [];
  if (payments.some((payment) => payment.status === 'COMPLETED' &&
    matchesPayment(order, payment.amount?.value, payment.amount?.currency_code))) return 'pagado';
  if (data.status === 'VOIDED' || payments.some(({ status }) => status === 'DECLINED' || status === 'FAILED')) return 'no_aprobado';
  return 'pendiente';
}

async function readJson(request) {
  if (!request.headers['content-type']?.startsWith('application/json')) throw new CheckoutError(415, 'Envía datos JSON.');
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 8192) throw new CheckoutError(413, 'Solicitud demasiado grande.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    throw new CheckoutError(400, 'La solicitud no es válida.');
  }
}

function json(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
}

async function saveOrder(order) {
  const path = resolve(orders, `${order.id}.json`);
  const temp = `${path}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(order), { mode: 0o600, flag: 'wx' });
  await rename(temp, path);
}

async function loadOrder(id) {
  if (!/^[0-9a-f-]{36}$/.test(id || '')) throw new CheckoutError(404, 'Pedido de prueba no encontrado.');
  try {
    return JSON.parse(await readFile(resolve(orders, `${id}.json`), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw new CheckoutError(404, 'Pedido de prueba no encontrado.');
  }
}

const statusChecks = new Map();

async function checkOrder(order, capture) {
  const existing = statusChecks.get(order.id);
  if (existing) {
    await existing;
    return checkOrder(await loadOrder(order.id), capture);
  }
  if (order.status === 'pagado') return order.status;

  const lookup = (async () => {
    const status = order.provider === 'mercadopago'
      ? await verifyMercadoPago(order)
      : await verifyPayPal(order, capture);
    if (status !== order.status) await saveOrder({ ...order, status });
    return status;
  })();
  statusChecks.set(order.id, lookup);
  try {
    return await lookup;
  } finally {
    statusChecks.delete(order.id);
  }
}

async function handle(request, response) {
  const url = new URL(request.url, base);
  const { pathname } = url;
  if (pathname === '/api/checkout/config' && request.method === 'GET') {
    return json(response, 200, { mercadopago: mpReady, paypal: paypalReady });
  }
  if (pathname === '/api/checkout/orders' && request.method === 'POST') {
    const { provider, product, quantity, color, model, printSides = 'frente' } = (await readJson(request)) || {};
    const pricing = checkoutProducts.get(product);
    if (!pricing) throw new CheckoutError(400, 'Este producto aún no está disponible para pagos de prueba.');
    if (!Number.isInteger(quantity) || quantity < pricing.minimum || quantity > 10000) {
      throw new CheckoutError(400, `Selecciona entre ${pricing.minimum} y 10,000 piezas para esta prueba.`);
    }
    const capModel = product === 'gorras' && typeof model === 'string' && Object.hasOwn(capModels, model) ? capModels[model] : null;
    if (product === 'gorras' && (!capModel || printSides !== 'frente')) {
      throw new CheckoutError(400, 'Selecciona el modelo DKPS 600 o 601 con impresión frontal.');
    }
    if (!printLabels.has(printSides)) throw new CheckoutError(400, 'Selecciona los lados a imprimir.');
    if (!['mercadopago', 'paypal'].includes(provider)) throw new CheckoutError(400, 'Selecciona un método de pago.');
    const validColor = typeof color === 'string' &&
      (capModel ? Object.hasOwn(capModel.colors, color) : product === 'playeras-polo' ? Object.hasOwn(poloColors, color) : /^[A-Z]{2,3}$/.test(color));
    if (capModel && !validColor) throw new CheckoutError(400, 'Selecciona un color disponible para el modelo de gorra.');
    if (product === 'playeras-polo' && color != null && !validColor) {
      throw new CheckoutError(400, 'Selecciona una combinación de color disponible para la polo.');
    }
    if (!(provider === 'paypal' ? paypalReady : mpReady)) throw new CheckoutError(503, 'Este método aún no tiene configuración de prueba.');
    const order = {
      id: randomUUID(), provider, product, quantity, printSides,
      ...(capModel && { model }),
      color: validColor ? color : (pricing.defaultColor ?? (product === 'playeras' ? 'BK' : 'WH')),
      total: quantity * unitPrice(pricing, printSides) + pricing.shipping,
      status: 'pendiente', createdAt: new Date().toISOString(),
    };
    const payment = await createPayment(order, pricing);
    await saveOrder({ ...order, providerId: payment.providerId });
    return json(response, 201, { url: payment.url });
  }
  if (pathname === '/api/checkout/status' && ['GET', 'POST'].includes(request.method)) {
    const input = request.method === 'POST' ? await readJson(request) : { id: url.searchParams.get('pedido') };
    const order = await loadOrder(input?.id);
    if (request.method === 'POST' && (order.provider !== 'paypal' || input.token !== order.providerId)) {
      throw new CheckoutError(400, 'No se pudo verificar la aprobación de PayPal.');
    }
    const status = await checkOrder(order, request.method === 'POST');
    return json(response, 200, { id: order.id, status });
  }
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (request.method !== 'GET' || (!staticFiles.has(file) && !/^assets\/(?:mockups\/)?[a-z0-9-]+\.(?:png|webp)$/.test(file))) {
    throw new CheckoutError(404, 'Página no encontrada.');
  }
  const body = await readFile(resolve(root, file)).catch((error) => {
    if (error.code === 'ENOENT') throw new CheckoutError(404, 'Archivo no encontrado.');
    throw error;
  });
  response.writeHead(200, { 'Content-Type': contentTypes[extname(file)], 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' });
  response.end(body);
}

await mkdir(orders, { recursive: true, mode: 0o700 });
createServer((request, response) => {
  handle(request, response).catch((error) => {
    if (error instanceof CheckoutError) return json(response, error.status, { error: error.message });
    console.error('Checkout:', error.name, error.message);
    return json(response, 502, { error: 'No se pudo consultar el proveedor de prueba. Intenta de nuevo en unos momentos.' });
  });
}).listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Myckprints sandbox · puerto ${port}`));
