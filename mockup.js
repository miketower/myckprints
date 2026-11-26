import { capColorNames, capModels, checkoutProducts, extraPrintPrice, poloColors, unitPrice } from './pricing.js?v=8';

// Approximate screen colors sampled from the JHK TSRA150 reference.
const tsra150Colors = {
  BT: '#f6dba5', WH: '#ffffff', GM: '#787c76', GF: '#494c4d', BK: '#1c1c1a',
  LY: '#f1ed80', RB: '#006db1', FU: '#bb3894', PK: '#f9d1d8', PU: '#372361',
  SK: '#7bcddd', TU: '#00b7be', BU: '#700438', RD: '#e51840', NY: '#202f40',
  MG: '#8bd0bb', KG: '#008a63', OR: '#f36d26', CH: '#301818', DN: '#39475e',
  LM: '#89c83f', SY: '#ffc320', SA: '#d8ad7a',
};

const sweatshirtColors = {
  PK: tsra150Colors.PK, PV: '#f5ac9c', LV: '#b29cc7', PB: '#009da9', WH: tsra150Colors.WH, BK: tsra150Colors.BK,
  CHC: '#3e4b4c', DGM: '#707477', NY: tsra150Colors.NY, MG: tsra150Colors.MG, BT: tsra150Colors.BT,
};

const products = new Map([
  ['playeras', { name: 'Playera de manga corta', quote: 'Playeras', pricing: checkoutProducts.get('playeras'), front: [31, 25, 38.5, 45], back: [29, 19.3, 42, 50], colors: tsra150Colors }],
  ['sudaderas', { name: 'Sudadera con capucha', quote: 'Sudaderas con capucha', pricing: checkoutProducts.get('sudaderas'), front: [36.7, 31.5, 27.6, 23.6], back: [28.8, 34.6, 40.6, 37.3], baseColor: 'SY', initialColor: 'WH', sizes: 'S–2XL', colors: sweatshirtColors }],
  ['camisas', { name: 'Camisa', quote: 'Camisas', front: [54, 36, 12, 15] }],
  ['termos', { name: 'Termo', quote: 'Termos', front: [42, 35, 16, 33] }],
  ['playeras-polo', { name: checkoutProducts.get('playeras-polo').name, quote: 'Playeras polo', pricing: checkoutProducts.get('playeras-polo'), front: [58, 27.4, 11.1, 13.7], back: [34.7, 19.2, 31, 31.4], baseColor: 'NY', initialColor: checkoutProducts.get('playeras-polo').defaultColor, sizes: 'S–2XL', colors: poloColors }],
  ['gorras', { name: 'Gorras de red DKPS', quote: 'Gorras', pricing: checkoutProducts.get('gorras'), front: [28, 34, 44, 21], baseColor: 'RB', defaultModel: '600' }],
  ['sudaderas-sin-capucha', { name: 'Sudadera sin capucha', quote: 'Sudaderas sin capucha', pricing: checkoutProducts.get('sudaderas-sin-capucha'), front: [33, 23.3, 35, 38.8], back: [32.3, 22.8, 33.8, 39.8], baseColor: 'KG', initialColor: 'WH', sizes: 'S–2XL', colors: sweatshirtColors }],
  ['playeras-manga-larga', { name: 'Playera de manga larga', quote: 'Playeras de manga larga', pricing: checkoutProducts.get('playeras-manga-larga'), front: [31, 23, 38, 48], back: [29, 18, 41, 49], baseColor: 'WH', sizes: 'S–2XL', colors: { WH: tsra150Colors.WH, BK: tsra150Colors.BK, GM: tsra150Colors.GM, RD: tsra150Colors.RD, NY: tsra150Colors.NY } }],
]);

const slug = new URLSearchParams(window.location.search).get('producto');
const selectedProduct = products.get(slug);

if (selectedProduct) {
  initializeEditor(selectedProduct);
} else {
  document.querySelector('#editor-error').hidden = false;
}

function initializeEditor(product) {
  const title = document.querySelector('#mockup-title');
  const editor = document.querySelector('#editor');
  const stage = document.querySelector('#mockup-stage');
  const template = document.querySelector('#mockup-template');
  const garmentPreview = document.querySelector('#garment-preview');
  const colorPicker = document.querySelector('#garment-colors');
  const colorChoices = document.querySelector('#garment-swatches');
  const colorValue = document.querySelector('#garment-color-value');
  const printArea = document.querySelector('#print-area');
  const artwork = document.querySelector('#artwork');
  const fileInput = document.querySelector('#design-file');
  const uploadLabel = document.querySelector('#upload-label');
  const status = document.querySelector('#design-status');
  const placement = document.querySelector('#placement');
  const viewSwitch = document.querySelector('#view-switch');
  const viewButtons = viewSwitch.querySelectorAll('[data-side]');
  const download = document.querySelector('#download-mockup');
  const ranges = Object.fromEntries(Array.from(placement.querySelectorAll('input[type=range]'), (input) => [input.id, input]));

  const views = { frente: createView(product.front) };
  if (product.back) {
    views.reverso = createView(product.back);
  }
  let side = 'frente';
  let drag;
  const baseColor = product.baseColor || 'BK';
  let color = product.initialColor || baseColor;
  let model = product.defaultModel;
  let colors = model ? capModels[model].colors : product.colors;
  const printSides = document.querySelector('#print-sides');
  let preferredSides;
  let refreshPrice = () => {};
  const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', currencyDisplay: 'code' });

  function updateColorLabel() {
    colorValue.textContent = model ? capColorNames[color] : color;
  }

  function renderColorOptions() {
    colorPicker.hidden = false;
    colorChoices.replaceChildren();
    updateColorLabel();
    document.querySelector('#garment-model').textContent = model ? `DKPS ${model}` : product.sizes || 'JHK TSRA150';
    for (const [code, paint] of Object.entries(colors)) {
      const option = document.createElement('label');
      const input = document.createElement('input');
      const swatch = document.createElement('span');
      input.type = 'radio';
      input.name = 'garment-color';
      input.value = code;
      input.checked = code === color;
      if (model) input.setAttribute('aria-label', capColorNames[code]);
      swatch.textContent = code;
      if (Array.isArray(paint)) {
        const [body, trim] = paint;
        swatch.classList.add('garment-combination');
        swatch.style.setProperty('--swatch', `linear-gradient(to bottom, ${body} 76%, ${trim} 76%)`);
      } else {
        swatch.style.setProperty('--swatch', model === '601'
          ? `linear-gradient(to bottom, #f5f3ed 55%, ${paint} 55%)`
          : paint);
      }
      option.append(input, swatch);
      colorChoices.append(option);
    }

  }

  if (colors) {
    renderColorOptions();
    colorChoices.addEventListener('change', (event) => {
      color = event.target.value;
      updateColorLabel();
      if (!download.disabled) {
        paintGarment();
      }
    });
  }

  title.textContent = product.name;
  document.title = `${product.name} — Editor de mockups | Myckprints`;
  const quoteUrl = new URL('./', window.location.href);
  quoteUrl.searchParams.set('cotizar', product.quote);
  quoteUrl.hash = 'cotizar';
  const quoteLink = document.querySelector('#mockup-quote');
  quoteLink.href = quoteUrl.href;
  if (model) {
    const modelSelect = document.querySelector('#cap-model');
    document.querySelector('#cap-model-option').hidden = false;
    document.querySelector('#garment-color-label').textContent = 'Color de gorra';
    for (const [code, variant] of Object.entries(capModels)) {
      modelSelect.add(new Option(variant.name, code));
    }
    quoteUrl.searchParams.set('modelo', model);
    quoteLink.href = quoteUrl.href;
    modelSelect.addEventListener('change', () => {
      model = modelSelect.value;
      colors = capModels[model].colors;
      if (!Object.hasOwn(colors, color)) color = baseColor;
      renderColorOptions();
      quoteUrl.searchParams.set('modelo', model);
      quoteLink.href = quoteUrl.href;
      showSide();
    });
  }
  if (product.back) {
    document.querySelector('#print-options').hidden = false;
    document.querySelector('#print-extra').textContent = `Imprimir frente y reverso agrega ${currency.format(extraPrintPrice)} por prenda.`;
    printSides.addEventListener('change', () => {
      preferredSides = printSides.value;
      syncPrintSides();
    });
    syncPrintSides();
  }

  function syncPrintSides() {
    if (!product.back) return;
    const bothDesigns = Boolean(views.frente.image && views.reverso.image);
    const choice = bothDesigns ? 'ambos' : preferredSides ?? (views.reverso.image ? 'reverso' : 'frente');
    if (bothDesigns !== printSides.disabled || choice !== quoteUrl.searchParams.get('impresion')) {
      printSides.disabled = bothDesigns;
      printSides.value = choice;
      quoteUrl.searchParams.set('impresion', choice);
      quoteLink.href = quoteUrl.href;
      refreshPrice();
    }
  }

  if (product.pricing) {
    const { minimum, unit, shipping } = product.pricing;
    const quantity = document.querySelector('#order-quantity');
    const subtotal = document.querySelector('#order-subtotal');
    const total = document.querySelector('#order-total');
    const extraLabel = document.querySelector('#order-extra-label');
    const extra = document.querySelector('#order-extra');
    extra.textContent = currency.format(extraPrintPrice);
    quantity.min = minimum;
    quantity.max = 10000;
    const checkoutStatus = document.querySelector('#checkout-status');
    const paymentButtons = document.querySelectorAll('[data-payment]');
    let providers = {};
    let processing = false;

    function updatePaymentButtons() {
      for (const button of paymentButtons) {
        button.disabled = processing || !quantity.validity.valid || !providers[button.dataset.payment];
      }
    }

    async function loadProviders() {
      try {
        const response = await fetch('api/checkout/config', { cache: 'no-store' });
        if (!response.ok) throw new Error();
        providers = await response.json();
        const missing = Array.from(paymentButtons).filter((button) => !providers[button.dataset.payment]);
        if (missing.length) {
          checkoutStatus.textContent = `Modo de prueba. Configuración pendiente: ${missing.map((button) => button.textContent).join(', ')}.`;
        }
        updatePaymentButtons();
      } catch {
        checkoutStatus.textContent = 'Inicia el servidor de Myckprints para habilitar los pagos de prueba.';
      }
    }

    for (const button of paymentButtons) {
      button.addEventListener('click', async () => {
        if (processing || !quantity.reportValidity()) return;
        processing = true;
        updatePaymentButtons();
        checkoutStatus.textContent = 'Abriendo el pago de prueba…';
        try {
          const response = await fetch('api/checkout/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: button.dataset.payment, product: slug, quantity: quantity.valueAsNumber, color, model, printSides: printSides.value }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          window.location.assign(result.url);
        } catch (error) {
          checkoutStatus.textContent = error.message || 'No se pudo abrir el pago de prueba.';
          processing = false;
          updatePaymentButtons();
        }
      });
    }
    quantity.value = minimum;
    document.querySelector('#order-minimum').textContent = `Pedido mínimo: ${minimum} piezas.`;
    document.querySelector('#order-unit').textContent = currency.format(unit);
    document.querySelector('#order-shipping').textContent = currency.format(shipping);
    document.querySelector('#mockup-order').hidden = false;

    function updatePrice() {
      const count = quantity.valueAsNumber;
      const price = unitPrice(product.pricing, printSides.value);
      const valid = quantity.validity.valid && Number.isSafeInteger(count * price + shipping);
      extraLabel.hidden = extra.hidden = printSides.value !== 'ambos';
      subtotal.textContent = valid ? currency.format(count * price) : '—';
      total.value = valid ? currency.format(count * price + shipping) : '—';
      if (valid) {
        quoteUrl.searchParams.set('cantidad', count);
      } else {
        quoteUrl.searchParams.delete('cantidad');
      }
      quoteLink.href = quoteUrl.href;
      updatePaymentButtons();
    }

    refreshPrice = updatePrice;
    quantity.addEventListener('input', updatePrice);
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        processing = false;
        checkoutStatus.textContent = 'Modo de prueba. No se realizan cobros reales.';
        loadProviders();
      }
    });
    updatePrice();
    loadProviders();
  }
  viewSwitch.hidden = !product.back;
  editor.hidden = false;
  showSide();

  function createView(area) {
    return { area, image: null, scale: 70, horizontal: 50, vertical: 50, upload: 0, message: '' };
  }

  function showSide() {
    const view = views[side];
    const [left, top, width, height] = view.area;
    Object.assign(printArea.style, {
      left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
    });
    download.disabled = true;
    garmentPreview.hidden = true;
    template.alt = `${product.name}${model ? ` ${model}` : ''}, vista de ${side}`;
    template.src = `assets/mockups/${slug}${model ? `-${model}` : ''}-${side}.webp`;
    uploadLabel.textContent = product.back ? `Diseño del ${side}` : 'Sube tu logo o diseño';
    fileInput.value = '';
    for (const button of viewButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.side === side));
    }
    render();
  }

  function artworkBox(view) {
    const [, , areaWidth, areaHeight] = view.area;
    const ratio = view.image.naturalWidth / view.image.naturalHeight;
    const scale = view.scale / 100;
    const width = Math.min(areaWidth, areaHeight * ratio) * scale;
    const height = width / ratio;
    return {
      x: (areaWidth - width) * view.horizontal / 100,
      y: (areaHeight - height) * view.vertical / 100,
      width,
      height,
    };
  }

  function render() {
    const view = views[side];
    syncPrintSides();
    status.textContent = view.message;
    placement.disabled = !view.image;
    stage.dataset.empty = String(!view.image);
    for (const [name, input] of Object.entries(ranges)) {
      input.value = view[name];
    }
    if (!view.image) {
      artwork.replaceChildren();
      return;
    }

    const [, , areaWidth, areaHeight] = view.area;
    const box = artworkBox(view);
    Object.assign(artwork.style, {
      left: `${box.x / areaWidth * 100}%`,
      top: `${box.y / areaHeight * 100}%`,
      width: `${box.width / areaWidth * 100}%`,
      height: `${box.height / areaHeight * 100}%`,
    });
    if (artwork.firstElementChild !== view.image) {
      artwork.replaceChildren(view.image);
    }
  }

  artwork.addEventListener('pointerdown', (event) => {
    const view = views[side];
    if (drag || !view.image || event.button !== 0) {
      return;
    }

    const bounds = artwork.getBoundingClientRect();
    drag = {
      pointerId: event.pointerId,
      view,
      image: view.image,
      gripX: (event.clientX - bounds.left) / bounds.width,
      gripY: (event.clientY - bounds.top) / bounds.height,
    };
    artwork.setPointerCapture(event.pointerId);
  });

  artwork.addEventListener('pointermove', (event) => {
    if (event.pointerId !== drag?.pointerId) {
      return;
    }
    const view = views[side];
    if (view !== drag.view || view.image !== drag.image) {
      artwork.releasePointerCapture(event.pointerId);
      return;
    }

    const area = printArea.getBoundingClientRect();
    const bounds = artwork.getBoundingClientRect();
    const availableX = area.width - bounds.width;
    const availableY = area.height - bounds.height;
    if (availableX > 0.5) {
      const x = event.clientX - area.left - bounds.width * drag.gripX;
      view.horizontal = positionPercent(x, availableX);
    }
    if (availableY > 0.5) {
      const y = event.clientY - area.top - bounds.height * drag.gripY;
      view.vertical = positionPercent(y, availableY);
    }
    render();
  });

  artwork.addEventListener('lostpointercapture', (event) => {
    if (event.pointerId === drag?.pointerId) {
      drag = undefined;
    }
  });

  function positionPercent(offset, available) {
    return Math.round(Math.max(0, Math.min(100, offset / available * 100)));
  }

  for (const button of viewButtons) {
    button.addEventListener('click', () => {
      if (side !== button.dataset.side) {
        side = button.dataset.side;
        showSide();
      }
    });
  }

  for (const [name, input] of Object.entries(ranges)) {
    input.addEventListener('input', () => {
      views[side][name] = Number(input.value);
      render();
    });
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) {
      return;
    }
    fileInput.value = '';
    const view = views[side];
    const upload = ++view.upload;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      view.message = 'Selecciona una imagen PNG, JPG o WebP de hasta 10 MB.';
      render();
      return;
    }

    const image = new Image();
    image.alt = '';
    image.draggable = false;
    image.src = URL.createObjectURL(file);
    view.message = 'Cargando diseño…';
    render();

    try {
      await image.decode();
      if (view.upload === upload) {
        if (view.image) {
          URL.revokeObjectURL(view.image.src);
        }
        view.image = image;
        view.message = `Diseño cargado: ${file.name}`;
      }
    } catch {
      if (view.upload === upload) {
        view.message = 'No se pudo abrir la imagen. Prueba con otro archivo.';
      }
    } finally {
      if (view.image !== image) {
        URL.revokeObjectURL(image.src);
      }
      if (view === views[side]) {
        render();
      }
    }
  });

  document.querySelector('#remove-design').addEventListener('click', () => {
    const view = views[side];
    view.upload++;
    URL.revokeObjectURL(view.image.src);
    view.image = null;
    view.message = 'Diseño eliminado.';
    render();
    fileInput.focus();
  });

  function paintGarment() {
    garmentPreview.hidden = !colors || color === baseColor;
    if (garmentPreview.hidden) {
      return;
    }
    const context = garmentPreview.getContext('2d', { willReadFrequently: true });
    const { width, height } = garmentPreview;
    context.drawImage(template, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    const paint = colors[color];
    const [body, trim] = Array.isArray(paint) ? paint : [paint];
    const rgb = body.slice(1).match(/../g).map((channel) => parseInt(channel, 16));

    const whiteTemplate = baseColor === 'WH';
    const yellowTemplate = baseColor === 'SY';
    const greenTemplate = baseColor === 'KG';
    const yellowCenter = side === 'frente' ? 184 : 162;
    // Separate the fabric from the studio backdrop using brightness or color.
    for (let i = 0; i < pixels.data.length; i += 4) {
      const shade = pixels.data[i] * .299 + pixels.data[i + 1] * .587 + pixels.data[i + 2] * .114;
      let mask = (162 - shade) / 130;
      if (whiteTemplate) mask = (pixels.data[i + 2] - pixels.data[i] + 5) / 5;
      if (greenTemplate) mask = (150 - shade) / 80;
      if (model) mask = (pixels.data[i + 2] - pixels.data[i] - 14) / 56;
      if (yellowTemplate) mask = (pixels.data[i] - pixels.data[i + 2] - 12) / 72;
      const opacity = Math.max(0, Math.min(1, mask));
      for (let channel = 0; channel < 3; channel++) {
        const original = pixels.data[i + channel];
        let tinted = original + rgb[channel] - 24;
        if (whiteTemplate) tinted = rgb[channel] + (original - 230) * .65;
        if (greenTemplate) tinted = rgb[channel] + (shade - 60) * .75;
        if (model) tinted = rgb[channel] + (shade - 67) * .85;
        if (yellowTemplate) tinted = rgb[channel] + (shade - yellowCenter) * .75;
        pixels.data[i + channel] = original + (tinted - original) * opacity;
      }
    }
    context.putImageData(pixels, 0, 0);
    if (trim && side === 'frente') {
      context.strokeStyle = trim;
      context.lineWidth = width * .007;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(width * .432, height * .091);
      context.quadraticCurveTo(width * .5, height * .107, width * .568, height * .091);
      context.stroke();
    }
  }

  template.addEventListener('load', () => {
    paintGarment();
    download.disabled = false;
  });

  template.addEventListener('error', () => {
    const view = views[side];
    view.message = 'No se pudo cargar la imagen del producto.';
    render();
  });

  download.addEventListener('click', () => {
    const view = views[side];
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const context = canvas.getContext('2d');
    const [left, top] = view.area;
    const box = artworkBox(view);
    context.drawImage(garmentPreview.hidden ? template : garmentPreview, 0, 0, 600, 600);
    context.drawImage(view.image, (left + box.x) * 6, (top + box.y) * 6, box.width * 6, box.height * 6);
    const colorSuffix = colors ? `-${color.toLowerCase().replace('/', '-')}` : '';
    const filename = `myckprints-${slug}${model ? `-${model}` : ''}${colorSuffix}-${side}.png`;

    canvas.toBlob((blob) => {
      if (!blob) {
        status.textContent = 'No se pudo descargar la vista.';
        return;
      }
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  });
}
