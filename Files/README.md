# Bucarica Librería — Tema Shopify

Tema Shopify 2.0 con soporte completo para el Theme Editor (Online Store 2.0).

## Estructura de archivos

```
bucarica-shopify-theme/
├── assets/
│   ├── bucarica.css          ← CSS principal (toda la paleta y componentes)
│   └── bucarica-theme.js     ← JS: carrito AJAX, filtros, menú móvil
├── config/
│   ├── settings_schema.json  ← Configuración global del tema
│   └── settings_data.json    ← Valores por defecto
├── layout/
│   └── theme.liquid          ← Layout raíz (content_for_header + content_for_layout)
├── locales/
│   └── es.default.json       ← Traducciones en español
├── sections/
│   ├── header.liquid         ← Navbar sticky con menú editable
│   ├── hero.liquid           ← Sección Hero
│   ├── featured-collection.liquid  ← Catálogo con filtros y Cart API
│   ├── about.liquid          ← Nuestra Historia + estadísticas
│   ├── reviews.liquid        ← Testimonios (bloques editables)
│   ├── contact.liquid        ← Formulario nativo Shopify
│   └── footer.liquid         ← Footer
├── snippets/
│   ├── whatsapp-button.liquid
│   └── cart-drawer.liquid
└── templates/
    └── index.json            ← Homepage con secciones predefinidas
```

---

## Despliegue con Shopify CLI

### Requisitos
- Node.js >= 18
- Shopify CLI 3.x (`npm install -g @shopify/cli @shopify/theme`)

### Pasos

```bash
# 1. Instalar Shopify CLI globalmente
npm install -g @shopify/cli @shopify/theme

# 2. Ir a la carpeta del tema
cd bucarica-shopify-theme

# 3. Autenticarse con tu tienda
shopify auth login --store bucarica.myshopify.com

# 4. Publicar el tema (crea un tema nuevo en tu tienda)
shopify theme push --unpublished

# 5. Para desarrollo en vivo con hot-reload:
shopify theme dev --store bucarica.myshopify.com
```

### Flujo recomendado

```
1. shopify theme push --unpublished  → sube como borrador
2. Revisar en Admin Shopify → Online Store → Themes → Preview
3. Configurar colección en Theme Editor (sección "Selección destacada")
4. shopify theme publish <theme-id>  → publicar al público
```

---

## Configuración post-despliegue

### 1. Asignar la colección de libros
- Admin → Online Store → Themes → Customize
- Sección "Selección Destacada" → campo "Colección de libros"
- Selecciona tu colección (ej. "Todos los libros" o "Selección destacada")

### 2. Metafields de productos (recomendado)
Para mostrar datos adicionales en las tarjetas, agrega estos metafields a tus productos:

| Namespace | Key | Tipo | Descripción |
|---|---|---|---|
| `bucarica` | `author` | Text | Nombre del autor |
| `bucarica` | `badge` | Text | Etiqueta (Clásico, Favorito, etc.) |
| `bucarica` | `cover_color` | Color | Color del placeholder de portada |

En Admin → Settings → Custom data → Products → Add definition

### 3. WhatsApp flotante
- Theme Editor → Theme settings → WhatsApp
- Número (formato: `573110000000`, sin `+`)
- Mensaje predeterminado

### 4. Menú de navegación
- Admin → Online Store → Navigation
- Edita el menú "main-menu" con los links: Catálogo, Novedades, Nosotros, Contacto

---

## Notas sobre la arquitectura

**Rojo acción `#E63946`**: Usado EXCLUSIVAMENTE en:
- Botones "Comprar" (`.buca-btn--buy`)
- Badge del carrito (`.buca-cart-btn__badge`)
- Botón flotante WhatsApp (`.buca-whatsapp-btn`)
- Etiquetas de descuento (`.buca-product-card__discount`)

**Cart API AJAX**: El JS usa `/cart/add.js`, `/cart.js` y `/cart/change.js` de Shopify — sin librerías externas.

**`{% form 'contact' %}`**: El formulario de contacto usa el tag nativo de Liquid que envía a la dirección configurada en Admin → Settings → General → Sender email.
