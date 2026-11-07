(() => {
  'use strict';
  const apiBase = String(window.TOROTREINTA_STORE_API_URL || '').trim();
  if (!apiBase) return;

  let stockData = null;
  let pendingStock = false;
  window.ToroTienda = window.ToroTienda || {};
  const knownOnceProducts = new Set([
    'once-remera-entrenamiento','once-short-entrenamiento','once-conjunto-prematch',
    'once-remera-salida','once-bermuda-salida','once-combo-salida',
    'once-short-partido-blanco','once-super-combo'
  ]);
  const html = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
  const formatMoney = value => typeof money === 'function' ? money(Number(value) || 0) : '$' + (Number(value) || 0).toLocaleString('es-AR');

  function loadStock() {
    if (pendingStock) return;
    pendingStock = true;
    const callback = 'ToroTienda.receiveStock';
    const script = document.createElement('script');
    const url = new URL(apiBase);
    url.searchParams.set('api','tienda');
    url.searchParams.set('action','stock');
    url.searchParams.set('callback',callback);
    url.searchParams.set('_',String(Date.now()));
    const timeout = setTimeout(() => finish(),12000);
    function finish() {
      clearTimeout(timeout);
      pendingStock = false;
      script.remove();
    }
    script.onerror = finish;
    window.ToroTienda.receiveStock = data => {
      if (data && data.ok) {
        stockData = data;
        updateOnceCards();
        renderLisoInventory();
      }
      finish();
    };
    script.src = url.toString();
    document.head.append(script);
  }

  function stockFor(sku) {
    return stockData && Array.isArray(stockData.products)
      ? stockData.products.find(product => product.productId === sku)
      : null;
  }

  function choiceLabel(variant) {
    const bits = [];
    if (variant.size && variant.size !== 'UNICO') bits.push(variant.size);
    if (variant.color) bits.push(variant.color);
    if (!bits.length) bits.push('Talle único');
    return bits.join(' · ');
  }

  const providerGuideProducts = new Set([
    'once-remera-entrenamiento','once-short-entrenamiento',
    'once-conjunto-prematch','once-short-partido-blanco'
  ]);

  function variantsForSlot(slot, productId) {
    const variants = Array.isArray(slot.variants) ? slot.variants : [];
    if (!providerGuideProducts.has(productId) || typeof providerSizeOptions !== 'function') return variants;
    const sizes = providerSizeOptions();
    if (!sizes.length) return variants;
    const ordered = sizes.flatMap(size => {
      const matches = variants.filter(variant => String(variant.size) === String(size));
      return matches.length ? matches : [{ size:size, color:'', quantity:slot.mapped ? 0 : null }];
    });
    const extra = variants.filter(variant => !sizes.some(size => String(size) === String(variant.size)));
    return ordered.concat(extra);
  }

  function setStockNote(card, product) {
    if (!product) return;
    const teaser = card.querySelector('.once-catalog-teaser small');
    const sheet = card.querySelector('.once-product-sheet b');
    const activeCopy = document.querySelector('.once-product-dialog .once-new-copy');
    const copy = activeCopy && activeCopy.dataset.storeProduct === product.productId
      ? activeCopy
      : card.querySelector('.once-new-copy');
    const slots = Array.isArray(product.slots) ? product.slots : [];
    const mapped = slots.length > 0 && slots.every(slot => slot.mapped && Array.isArray(slot.variants));
    const allVariants = slots.flatMap(slot => slot.variants || []);
    const count = allVariants.reduce((sum,variant) => sum + Math.max(0,Number(variant.quantity)||0),0);
    const summary = !mapped
      ? 'Stock por talle a confirmar · consultá por WhatsApp'
      : count > 0
        ? 'Stock real · ' + count + ' disponible(s)'
        : 'Sin stock · consultá por WhatsApp';
    if (teaser) teaser.textContent = product.group === 'once' ? product.name + ' · ' + summary : summary;
    if (sheet) {
      sheet.textContent = !mapped ? 'Stock por talle a confirmar' : count > 0 ? 'Stock actualizado por talle' : 'Sin stock disponible';
      sheet.classList.toggle('store-stock-available',mapped && count > 0);
    }
    if (copy) {
      const availability = copy.querySelector('[data-once-availability]');
      if (availability) availability.textContent = !mapped
        ? 'La app interna todavía no informa stock por talle para esta prenda.'
        : count > 0
          ? 'Elegí un talle para ver cuántas unidades quedan.'
          : 'No quedan unidades disponibles.';
      const price = copy.querySelector('[data-once-price]');
      if (price && product.priceConfirmed) price.textContent = formatMoney(product.price);
      const paragraph = copy.querySelector(':scope > p');
      if (paragraph && !copy.querySelector('[data-once-price]') && product.priceConfirmed) {
        paragraph.innerHTML = '<strong>' + html(formatMoney(product.price)) + '</strong><br>' + html(!mapped
          ? 'Stock por talle a confirmar.'
          : count > 0
            ? 'Elegí un talle para ver cuántas unidades quedan.'
            : 'Sin stock disponible.');
      }
    }
  }

  function makeSelect(slot, productId) {
    const variants = variantsForSlot(slot,productId);
    const stockKnown = !!slot.mapped;
    const options = variants.map(variant => {
      const key = variant.size + '|' + (variant.color || '');
      return '<option value="' + html(key) + '">' + html(choiceLabel(variant)) + '</option>';
    }).join('');
    const buttons = variants.map(variant => {
      const key = variant.size + '|' + (variant.color || '');
      const known = stockKnown && variant.quantity != null && Number.isFinite(Number(variant.quantity));
      const qty = known ? Math.max(0,Number(variant.quantity)||0) : null;
      const label = choiceLabel(variant);
      const stockLabel = !known ? 'Consultar' : qty === 1 ? '1 disp.' : qty > 1 ? qty + ' disp.' : 'Agotado';
      const accessible = !known ? label + ': stock a confirmar. Toca para consultar por WhatsApp.' : qty > 0 ? label + ': ' + qty + (qty === 1 ? ' unidad disponible' : ' unidades disponibles') : label + ': sin stock. Toca para consultar por WhatsApp.';
      return '<button type="button" class="once-live-size-option' + (!known || qty < 1 ? ' is-sold-out' : '') + '" data-size-key="' + html(key) + '" data-size-known="' + known + '" data-size-qty="' + (known ? qty : '') + '" aria-label="' + html(accessible) + '" aria-pressed="false"><span>' + html(label) + '</span><small>' + html(stockLabel) + '</small></button>';
    }).join('');
    return '<div class="once-size-field"><span>' + html(slot.name || slot.slot) + '</span>' +
      '<select data-store-slot="' + html(slot.slot) + '" aria-label="Elegí ' + html(slot.name || slot.slot) + '"><option value="">Elegí talle</option>' + options + '</select>' +
      '<div class="once-live-size-grid" role="group" aria-label="Stock por talle: ' + html(slot.name || slot.slot) + '">' + buttons + '</div>' +
      '<p class="once-live-size-note" aria-live="polite">Tocá un talle para ver su disponibilidad.</p></div>';
  }

  function updatePurchaseActions(row, product, canUseCart) {
    const selects = [...row.querySelectorAll('[data-store-slot]')];
    const selections = selects.map(select => {
      const button = select.closest('.once-size-field')?.querySelector('.once-live-size-option.selected');
      return { select:select, button:button };
    });
    const allSelected = selections.length > 0 && selections.every(item => item.select.value && item.button);
    const allAvailable = allSelected && selections.every(item => item.button.dataset.sizeKnown === 'true' && Number(item.button.dataset.sizeQty) > 0);
    const maxQuantity = allAvailable ? Math.min(...selections.map(item => Number(item.button.dataset.sizeQty))) : 0;
    const add = row.querySelector('.once-cart-add');
    const inquiry = row.querySelector('.once-stock-whatsapp');
    const quantityField = row.querySelector('.once-quantity-control');
    const quantityInput = row.querySelector('[data-store-quantity]');
    const quantityNote = row.querySelector('.once-quantity-limit');
    if (quantityField) quantityField.hidden = !allAvailable;
    if (quantityInput && maxQuantity > 0) {
      quantityInput.max = String(maxQuantity);
      const currentQuantity = Number(quantityInput.value);
      if (!Number.isInteger(currentQuantity) || currentQuantity < 1) quantityInput.value = '1';
      else if (currentQuantity > maxQuantity) quantityInput.value = String(maxQuantity);
    }
    const requestedQuantity = quantityInput ? Number(quantityInput.value) : 1;
    const quantityValid = Number.isInteger(requestedQuantity) && requestedQuantity >= 1 && requestedQuantity <= maxQuantity;
    if (quantityNote && allAvailable) quantityNote.textContent = 'Hasta ' + maxQuantity + (maxQuantity === 1 ? ' unidad disponible' : ' unidades disponibles') + ' para esta selección.';
    const canAdd = !!canUseCart && allAvailable && quantityValid;
    if (add) { add.hidden = !canAdd; add.disabled = !canAdd; }
    if (inquiry) {
      inquiry.hidden = canAdd;
      const requestedSizes = selections.filter(item => item.select.value).map(item => {
        const slotName = item.select.closest('.once-size-field')?.querySelector(':scope > span')?.textContent || item.select.dataset.storeSlot;
        const sizeName = item.button?.querySelector('span')?.textContent || item.select.value.split('|')[0];
        return slotName + ': ' + sizeName;
      });
      const message = 'Hola, quiero consultar disponibilidad de ' + product.name + ' de Once Corazones' + (requestedSizes.length ? ' (' + requestedSizes.join(' · ') + ')' : '') + '.';
      inquiry.href = 'https://wa.me/' + encodeURIComponent(torotreintaWhatsApp) + '?text=' + encodeURIComponent(message);
      inquiry.textContent = allAvailable && !quantityValid
        ? 'Consultar esta cantidad por WhatsApp ↗'
        : requestedSizes.length ? 'Consultar este talle por WhatsApp ↗' : 'Consultar por WhatsApp ↗';
    }
  }

  function bindSizeOptions(row, product, canUseCart) {
    row.querySelectorAll('[data-store-slot]').forEach(select => {
      const field = select.closest('.once-size-field');
      const grid = field && field.querySelector('.once-live-size-grid');
      const note = field && field.querySelector('.once-live-size-note');
      if (!grid) return;
      const applySelection = () => {
        const current = [...grid.querySelectorAll('.once-live-size-option')].find(button => button.dataset.sizeKey === select.value);
        grid.querySelectorAll('.once-live-size-option').forEach(option => {
          const selected = option === current;
          option.classList.toggle('selected',selected);
          option.setAttribute('aria-pressed',String(selected));
        });
        if (current) {
          const selectedLabel = current.querySelector('span')?.textContent || 'Ese talle';
          note.textContent = current.dataset.sizeKnown !== 'true'
            ? 'Stock del talle ' + selectedLabel + ' a confirmar. Consultá por WhatsApp.'
            : Number(current.dataset.sizeQty) > 0
              ? Number(current.dataset.sizeQty) === 1 ? 'Queda 1 unidad en talle ' + selectedLabel + '.' : 'Quedan ' + current.dataset.sizeQty + ' unidades en talle ' + selectedLabel + '.'
              : 'El talle ' + selectedLabel + ' está sin stock. Consultá por WhatsApp.';
        } else note.textContent = 'Tocá un talle para ver su disponibilidad.';
        updatePurchaseActions(row,product,canUseCart);
      };
      select.addEventListener('change',applySelection);
      grid.querySelectorAll('.once-live-size-option').forEach(button => button.addEventListener('click',() => {
        select.value = button.dataset.sizeKey;
        applySelection();
      }));
    });
    const quantityInput = row.querySelector('[data-store-quantity]');
    quantityInput?.addEventListener('input',() => updatePurchaseActions(row,product,canUseCart));
    quantityInput?.addEventListener('change',() => updatePurchaseActions(row,product,canUseCart));
    updatePurchaseActions(row,product,canUseCart);
  }

  function addStoreProduct(sku, card, product) {
    const copy = document.querySelector('.once-product-dialog .once-new-copy') || card.querySelector('.once-new-copy');
    const selects = [...copy.querySelectorAll('[data-store-slot]')];
    if (!selects.length || selects.some(select => !select.value)) {
      if (typeof toast === 'function') toast('Elegí el talle de cada prenda');
      return;
    }
    const sizes = {};
    let color = '';
    selects.forEach(select => {
      const parts = select.value.split('|');
      sizes[select.dataset.storeSlot] = parts[0];
      if (parts[1]) color = parts[1];
    });
    const chosen = selects.map(select => {
      const variant = (product.slots.find(slot => slot.slot === select.dataset.storeSlot).variants || [])
        .find(item => item.size + '|' + (item.color || '') === select.value);
      return { slot:select.dataset.storeSlot, variant:variant };
    });
    const quantity = Number(copy.querySelector('[data-store-quantity]')?.value) || 1;
    if (chosen.some(item => !item.variant || Number(item.variant.quantity) < 1)) {
      if (typeof toast === 'function') toast('Ese talle se quedó sin stock. Actualizá la disponibilidad.');
      loadStock();
      return;
    }
    if (chosen.some(item => Number(item.variant.quantity) < quantity)) {
      if (typeof toast === 'function') toast('Quedan menos unidades en ese talle. Actualizá la disponibilidad.');
      loadStock();
      return;
    }
    const sizeText = chosen.map(item => item.slot.replace(/_/g,' ') + ' ' + choiceLabel(item.variant)).join(' · ');
    const item = {
      id:sku, productId:sku, name:product.name, size:sizeText, qty:quantity, stockLimit:Math.min(...chosen.map(item => Number(item.variant.quantity))),
      price:Number(product.price), image:card.querySelector(':scope > img')?.getAttribute('src') || '',
      kind:'stock', source:'once', storeSizes:sizes, storeColor:color
    };
    cart.push(item);
    saveCart();
    if (typeof toast === 'function') toast('Agregado al carrito');
    document.querySelector('.once-product-dialog .once-dialog-close')?.click();
    setPage('carrito');
  }

  function attachControls(card, product, targetCopy) {
    const sku = product.productId;
    const copy = targetCopy || card.querySelector('.once-new-copy');
    if (!copy) return;
    copy.querySelector('.once-cart-row')?.remove();
    const existing = copy.querySelector('.once-store-stock');
    if (existing) existing.remove();
    setStockNote(card,product);
    const slots = Array.isArray(product.slots) ? product.slots : [];
    const mapped = slots.length > 0 && slots.every(slot => slot.mapped && Array.isArray(slot.variants));
    const count = slots.flatMap(slot => slot.variants || []).reduce((sum,variant) => sum + Math.max(0,Number(variant.quantity)||0),0);
    const displaySlots = slots.length ? slots : providerGuideProducts.has(sku)
      ? [{slot:'TALLE',name:'Talle',mapped:false,variants:[]}]
      : [];
    if (!displaySlots.length) {
      const status = document.createElement('p');
      status.className = 'once-store-stock';
      status.textContent = 'El stock por talle todavía no está cargado en la app interna. Consultanos por WhatsApp.';
      const guide = copy.querySelector('.size-guide');
      if (guide) guide.before(status); else copy.append(status);
      return;
    }
    const canUseCart = mapped && count > 0 && product.available && product.priceConfirmed;
    const row = document.createElement('div');
    row.className = 'once-cart-row once-live-stock-row';
    row.innerHTML = displaySlots.map(slot => makeSelect(slot,sku)).join('') +
      '<label class="once-quantity-control" hidden><span>Cantidad</span><input data-store-quantity type="number" inputmode="numeric" min="1" value="1" step="1" aria-label="Cantidad a comprar"><small class="once-quantity-limit"></small></label>' +
      '<button type="button" class="once-cart-add" hidden>Agregar al carrito</button>' +
      '<a class="once-inquiry once-stock-whatsapp" href="#" target="_blank" rel="noopener">Consultar por WhatsApp ↗</a>';
    bindSizeOptions(row,product,canUseCart);
    copy.querySelector(':scope > .once-inquiry:not(.once-stock-whatsapp)')?.remove();
    copy.append(row);
    if (canUseCart) {
      row.querySelector('.once-cart-add').addEventListener('click',() => addStoreProduct(sku,card,product));
    } else {
      const status = document.createElement('p');
      status.className = 'once-store-stock';
      status.textContent = !mapped
        ? 'El stock de estos talles no está confirmado en la app interna.'
        : count < 1
          ? 'No quedan unidades cargadas. Consultanos por WhatsApp.'
          : !product.priceConfirmed
            ? 'Precio a confirmar. Consultanos por WhatsApp.'
            : 'Este producto no está habilitado para compra online. Consultanos por WhatsApp.';
      const guide = copy.querySelector('.size-guide');
      if (guide) guide.before(status); else copy.append(status);
    }
  }

  const previousChangeQty = changeQty;
  changeQty = function (index, by) {
    const item = cart[index];
    if (item && item.source === 'once' && item.kind === 'stock' && Number(by) > 0) {
      const product = stockFor(item.productId || item.id);
      let maxQuantity = Number(item.stockLimit) || Infinity;
      if (product && Array.isArray(product.slots) && product.slots.length) {
        const limits = Object.entries(item.storeSizes || {}).map(([slotName,size]) => {
          const slot = product.slots.find(entry => entry.slot === slotName);
          const variant = slot && (slot.variants || []).find(entry => String(entry.size) === String(size) && String(entry.color || '') === String(item.storeColor || ''));
          return variant ? Math.max(0,Number(variant.quantity) || 0) : 0;
        });
        if (limits.length) maxQuantity = Math.min(maxQuantity,...limits);
      }
      if (item.qty + Number(by) > maxQuantity) {
        if (typeof toast === 'function') toast('Solo quedan ' + maxQuantity + (maxQuantity === 1 ? ' unidad disponible' : ' unidades disponibles') + ' para este talle.');
        return;
      }
    }
    return previousChangeQty(index,by);
  };

  function updateOnceCards() {
    (stockData.products || []).forEach(product => {
      if (!knownOnceProducts.has(product.productId)) return;
      const card = document.querySelector('[data-once-product="' + CSS.escape(product.productId) + '"]');
      if (!card) return;
      const dialogCopy = document.querySelector('.once-product-dialog .once-new-copy');
      const targetCopy = dialogCopy && dialogCopy.dataset.storeProduct === product.productId
        ? dialogCopy
        : card.querySelector('.once-new-copy');
      attachControls(card,product,targetCopy);
    });
  }

  function renderLisoInventory() {
    const root = document.getElementById('page-productos');
    if (!root || !Array.isArray(stockData.lisos)) return;
    let section = root.querySelector('.live-liso-inventory');
    if (!section) {
      section = document.createElement('section');
      section.className = 'live-liso-inventory';
      section.setAttribute('aria-labelledby','live-liso-title');
      root.append(section);
    }
    const rows = stockData.lisos.map(item => {
      const total = item.variants.reduce((sum,variant) => sum + Math.max(0,Number(variant.quantity)||0),0);
      const variants = item.variants.map(variant => choiceLabel(variant) + ': ' + (Number(variant.quantity)>0 ? Number(variant.quantity) + ' disp.' : 'sin stock')).join(' · ');
      const text = 'Hola, quiero consultar precio y disponibilidad de ' + item.article + '.';
      const href = 'https://wa.me/' + encodeURIComponent(torotreintaWhatsApp) + '?text=' + encodeURIComponent(text);
      return '<article class="live-liso-item"><div><h3>' + html(item.article) + '</h3><p>' + html(total ? variants : 'Sin unidades disponibles') + '</p></div><span class="live-liso-count">' + (total ? total + ' en stock' : 'Sin stock') + '</span><a href="' + href + '" target="_blank" rel="noopener">Consultar precio ↗</a></article>';
    }).join('');
    section.innerHTML = '<div class="live-liso-head"><span class="kicker">Inventario sincronizado</span><h2 id="live-liso-title">Prendas lisas</h2><p>Stock real de la app interna. El precio se confirma por WhatsApp para no mostrar importes sin validar.</p></div><div class="live-liso-list">' + rows + '</div>';
  }

  const previousRenderCart = renderCart;
  renderCart = function () {
    previousRenderCart();
    const form = document.querySelector('.once-customer-form');
    if (!form || form.dataset.storeBound === 'true') return;
    const fresh = form.cloneNode(true);
    form.replaceWith(fresh);
    fresh.dataset.storeBound = 'true';
    const privacy = fresh.querySelector('.once-customer-privacy');
    if (privacy) privacy.textContent = 'El pedido se registra en la app interna y el stock se actualiza al confirmarlo. El pago se coordina por WhatsApp.';
    const submit = fresh.querySelector('.once-order-submit');
    if (submit) submit.textContent = 'Registrar pedido y continuar';
    fresh.addEventListener('submit',event => {
      event.preventDefault();
      if (!fresh.reportValidity()) return;
      const entries = cart.filter(item => item.source === 'once' && knownOnceProducts.has(item.productId || item.id));
      if (!entries.length) return;
      if (!apiBase) { window.alert('La conexión con la app todavía no está configurada.'); return; }
      sendStoreOrder(fresh,entries,submit);
    });
  };

  function sendStoreOrder(form,items,button) {
    const values = new FormData(form);
    const summary = document.querySelector('#cartView .summary-box');
    const method = summary?.querySelector('input[name="once-payment"]:checked')?.value || 'A confirmar';
    const requestId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'web-' + Date.now() + '-' + Math.random().toString(36).slice(2,12);
    const payload = {
      requestId:requestId,
      customer:String(values.get('customerName') || '').trim(),
      phone:String(values.get('customerPhone') || '').trim(),
      email:String(values.get('customerEmail') || '').trim(),
      paymentMethod:method,
      items:items.map(item => ({
        productId:item.productId || item.id,
        quantity:Number(item.qty) || 1,
        sizes:item.storeSizes || parseLegacySizes(item),
        color:item.storeColor || ''
      }))
    };
    const token = 'tt-' + Date.now() + '-' + Math.random().toString(36).slice(2,12);
    const url = new URL(apiBase);
    url.searchParams.set('api','tienda');
    url.searchParams.set('action','order');
    url.searchParams.set('token',token);
    const iframe = document.createElement('iframe');
    iframe.name = 'tt-order-' + token;
    iframe.hidden = true;
    const hiddenForm = document.createElement('form');
    hiddenForm.method = 'POST';
    hiddenForm.action = url.toString();
    hiddenForm.target = iframe.name;
    hiddenForm.hidden = true;
    const field = document.createElement('input');
    field.type = 'hidden'; field.name = 'payload'; field.value = JSON.stringify(payload);
    hiddenForm.append(field);
    document.body.append(iframe,hiddenForm);
    const originalText = button.textContent;
    button.disabled = true; button.textContent = 'Registrando pedido…';
    const status = document.createElement('p');
    status.className = 'store-order-status';
    status.setAttribute('role','status');
    form.append(status);
    let finished = false;
    const timer = setTimeout(() => finish({ok:false,error:'La respuesta está tardando. Revisá el pedido en unos instantes o escribinos por WhatsApp.'}),25000);
    function cleanup() { clearTimeout(timer); window.removeEventListener('message',onMessage); hiddenForm.remove(); iframe.remove(); }
    function finish(result) {
      if (finished) return;
      finished = true; cleanup(); button.disabled = false; button.textContent = originalText;
      if (!result.ok) { status.textContent = result.error || 'No se pudo registrar el pedido.'; return; }
      status.innerHTML = 'Pedido ' + html(result.orderId) + ' registrado. El stock ya se actualizó en la tienda. <a class="store-order-whatsapp" target="_blank" rel="noopener">Coordinar por WhatsApp ↗</a>';
      const link = status.querySelector('a');
      const lines = items.map(item => '- ' + item.qty + ' x ' + item.name + ' · ' + item.size).join('\n');
      const message = ['Hola, registré el pedido ' + result.orderId + ' en la tienda ToroTreinta.','',
        'Nombre: ' + payload.customer,'Celular: ' + payload.phone,'Email: ' + payload.email,'',lines,'',
        'Total: ' + formatMoney(items.reduce((sum,item) => sum + Number(item.price) * Number(item.qty),0)),
        'Pago elegido: ' + method].join('\n');
      link.href = 'https://wa.me/' + encodeURIComponent(torotreintaWhatsApp) + '?text=' + encodeURIComponent(message);
      items.forEach(item => {
        const index = cart.indexOf(item);
        if (index >= 0) cart.splice(index,1);
      });
      saveCart();
      loadStock();
      button.remove();
    }
    function onMessage(event) {
      if (event.source !== iframe.contentWindow) return;
      if (!/script\.googleusercontent\.com$|script\.google\.com$/.test(String(event.origin).replace(/^https?:\/\//,''))) return;
      if (!event.data || event.data.token !== token) return;
      finish(event.data);
    }
    window.addEventListener('message',onMessage);
    iframe.addEventListener('load',() => { hiddenForm.remove(); });
    hiddenForm.submit();
  }

  function parseLegacySizes(item) {
    const size = String(item.size || '');
    if (item.id === 'once-conjunto-prematch') {
      const match = size.match(/Remera\s+(.+?)\s*·\s*Short\s+(.+)/i);
      return match ? { REMERA_ENTRENAMIENTO:match[1].trim(), SHORT_ENTRENAMIENTO:match[2].trim() } : {};
    }
    const product = stockFor(item.productId || item.id);
    const slot = product && product.slots && product.slots[0];
    return slot ? { [slot.slot]:size } : {};
  }

  const style = document.createElement('style');
  style.textContent = '.once-live-stock-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-top:18px}.once-live-stock-row .once-cart-add,.once-stock-whatsapp{grid-column:1/-1;min-height:48px;border-radius:7px}.once-live-stock-row .once-cart-add[hidden],.once-stock-whatsapp[hidden],.once-quantity-control[hidden]{display:none!important}.once-live-stock-row select{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important}.once-size-field{display:flex;flex-direction:column;gap:7px;color:#34445f;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.once-live-size-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(82px,1fr));gap:7px}.once-live-size-option{display:flex;min-height:48px;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:5px 6px;border:1px solid #c8d0dc;border-radius:7px;background:#fff;color:#16243a;cursor:pointer}.once-live-size-option span{font-size:12px;font-weight:800}.once-live-size-option small{color:#287149;font-size:9px;font-weight:800;letter-spacing:0;text-transform:none}.once-live-size-option:hover{border-color:#1254dd}.once-live-size-option.selected{border-color:#1254dd;background:#1254dd;color:#fff;box-shadow:0 0 0 2px #1254dd22}.once-live-size-option.selected small{color:#fff}.once-live-size-option.is-sold-out{background:#f2f3f5;color:#87909d;border-color:#d9dde3}.once-live-size-option.is-sold-out small{color:#9b5555}.once-live-size-note{min-height:16px;margin:0;color:#526075;font-size:11px;font-weight:600;letter-spacing:0;text-transform:none}.once-quantity-control{grid-column:1/-1;display:grid;grid-template-columns:auto 96px 1fr;gap:8px;align-items:center;color:#34445f;font-size:11px;font-weight:800;text-transform:uppercase}.once-quantity-control input{height:40px;padding:0 10px;border:1px solid #c8d0dc;border-radius:6px;font:600 14px var(--font)}.once-quantity-limit{color:#526075;font-size:10px;font-weight:600;letter-spacing:0;text-transform:none}.store-stock-available{color:#207246!important}.once-store-stock{margin:12px 0;padding:11px;border-radius:7px;background:#f1f3f5;color:#586270;font-size:12px;line-height:1.5}.live-liso-inventory{padding:64px 7.2%;background:#eef0f3}.live-liso-head{margin-bottom:22px}.live-liso-head h2{margin:8px 0;font:800 clamp(34px,4vw,52px)/.95 var(--display);text-transform:uppercase}.live-liso-head p{color:#606a78;font-size:13px;line-height:1.6}.live-liso-list{display:grid;gap:9px}.live-liso-item{display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center;padding:16px 18px;background:#fff;border:1px solid #dfe3e9;border-radius:7px}.live-liso-item h3{margin:0 0 5px;font:700 21px var(--display);text-transform:uppercase}.live-liso-item p{margin:0;color:#647082;font-size:11px;line-height:1.5}.live-liso-count{font-size:11px;font-weight:800;color:#207246;white-space:nowrap}.live-liso-item a,.store-order-whatsapp{font-size:11px;font-weight:800;color:#1254dd}.store-order-status{margin:12px 0 0;padding:12px;border-radius:7px;background:#eef4ff;color:#233d66;font-size:12px;line-height:1.6}.store-order-status a{display:block;margin-top:8px}.live-liso-item a{white-space:nowrap}@media(max-width:700px){.live-liso-inventory{padding:38px 16px}.live-liso-item{grid-template-columns:1fr auto;gap:8px;padding:14px}.live-liso-item a{grid-column:1/-1;white-space:normal}.live-liso-item h3{font-size:19px}.live-liso-item p{font-size:11px}.once-live-stock-row{grid-template-columns:1fr}.once-live-size-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.once-live-stock-row .once-cart-add,.once-stock-whatsapp{grid-column:auto}.once-quantity-control{grid-column:auto;grid-template-columns:auto 96px;gap:8px}.once-quantity-limit{grid-column:1/-1}}';
  document.head.append(style);
  document.querySelectorAll('#page-club-once [data-once-product]').forEach(card => {
    const copy = card.querySelector('.once-new-copy');
    if (copy) copy.dataset.storeProduct = card.dataset.onceProduct;
  });
  loadStock();
  setInterval(loadStock,90000);
})();
