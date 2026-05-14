/**
 * bucarica-theme.js
 * JS principal del tema Shopify de Bucarica Librería.
 * Vanilla JS puro — sin dependencias externas.
 * Usa la Cart API AJAX de Shopify (/cart/add.js, /cart.js, /cart/change.js)
 */

/* ── UTILIDADES ─────────────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const formatMoney = (cents) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);

/* ── HEADER SCROLL ──────────────────────────────────────────── */
function initHeader() {
  const header = $('.buca-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── MENÚ MÓVIL ─────────────────────────────────────────────── */
function initMobileMenu() {
  const toggle = $('[data-menu-toggle]');
  const nav    = $('#mobile-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.hidden = open;
  });
}

/* ── FILTROS DE CATÁLOGO ────────────────────────────────────── */
function initFilters() {
  const btns  = $$('.buca-filter-btn');
  const cards = $$('[data-product-tags]');
  if (!btns.length) return;

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Actualizar botones activos
      btns.forEach((b) => {
        b.classList.toggle('buca-filter-btn--active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });

      // Mostrar / ocultar tarjetas
      cards.forEach((card) => {
        const tags = card.dataset.productTags || '';
        const show = filter === 'all' || tags.split(',').some((t) => t.trim() === filter);
        card.style.display = show ? '' : 'none';
        card.setAttribute('aria-hidden', String(!show));
      });
    });
  });
}

/* ── CART DRAWER ────────────────────────────────────────────── */
class CartDrawer {
  constructor() {
    this.drawer   = $('#cart-drawer');
    this.itemsEl  = $('[data-cart-items]');
    this.footerEl = $('[data-cart-footer]');
    this.totalEl  = $('[data-cart-total]');
    this.countEls = $$('[data-cart-count]');
    if (!this.drawer) return;
    this.bind();
    this.fetchCart(); // sincronizar count al cargar
  }

  bind() {
    // Abrir carrito
    $$('[data-cart-toggle]').forEach((btn) =>
      btn.addEventListener('click', () => this.open())
    );
    // Cerrar carrito
    $$('[data-cart-close]').forEach((el) =>
      el.addEventListener('click', () => this.close())
    );
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    // Añadir al carrito (delegación desde el grid)
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-add-to-cart]');
      if (!btn) return;
      const variantId = parseInt(btn.dataset.addToCart, 10);
      await this.addItem(variantId, btn);
    });
  }

  open() {
    this.drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('[data-cart-close]', this.drawer)?.focus();
  }

  close() {
    this.drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  async fetchCart() {
    try {
      const res  = await fetch('/cart.js');
      const cart = await res.json();
      this.updateUI(cart);
    } catch (err) {
      console.error('[Bucarica] Error al obtener el carrito:', err);
    }
  }

  async addItem(variantId, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Añadiendo…';

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      btn.textContent = '✓ Añadido';
      btn.classList.add('buca-btn--added');

      await this.fetchCart();
      this.open();

      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('buca-btn--added');
        btn.disabled = false;
      }, 1800);
    } catch (err) {
      console.error('[Bucarica] Error al añadir al carrito:', err);
      btn.textContent = 'Error — intenta de nuevo';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }
  }

  async removeItem(lineIndex) {
    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line: lineIndex, quantity: 0 }),
      });
      const cart = await res.json();
      this.updateUI(cart);
    } catch (err) {
      console.error('[Bucarica] Error al eliminar del carrito:', err);
    }
  }

  updateUI(cart) {
    // Actualizar badges de cantidad
    const count = cart.item_count;
    this.countEls.forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });

    // Carrito vacío
    if (count === 0) {
      this.itemsEl.innerHTML = '<p class="buca-cart-drawer__empty">Tu carrito está vacío.</p>';
      if (this.footerEl) this.footerEl.hidden = true;
      return;
    }

    // Renderizar ítems
    this.itemsEl.innerHTML = cart.items
      .map(
        (item, i) => `
        <div class="buca-cart-item" data-line="${i + 1}">
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.title}" class="buca-cart-item__img" loading="lazy">`
              : `<div class="buca-cart-item__img" style="background:#4B3621; display:flex; align-items:center; justify-content:center; font-size:1rem;">📖</div>`
          }
          <div class="buca-cart-item__body">
            <p class="buca-cart-item__title">${item.title}</p>
            <p class="buca-cart-item__qty">${item.quantity} × ${formatMoney(item.price)}</p>
          </div>
          <button
            class="buca-cart-item__remove"
            data-remove-line="${i + 1}"
            aria-label="Eliminar ${item.title}"
          >×</button>
        </div>`
      )
      .join('');

    // Delegación para eliminar ítems
    $$('[data-remove-line]', this.itemsEl).forEach((btn) => {
      btn.addEventListener('click', () => this.removeItem(parseInt(btn.dataset.removeLine, 10)));
    });

    // Footer con total
    if (this.footerEl) {
      this.footerEl.hidden = false;
      if (this.totalEl) this.totalEl.textContent = formatMoney(cart.total_price);
    }
  }
}

/* ── SMOOTH SCROLL para anchors internos ────────────────────── */
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

/* ── INIT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initFilters();
  initSmoothScroll();
  new CartDrawer();
});
