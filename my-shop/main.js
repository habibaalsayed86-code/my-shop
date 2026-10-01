const productsContainer = document.getElementById('products-container');
const categoryButtons = document.querySelectorAll('.sidebar a');
const modal = document.getElementById('product-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalBody = modal.querySelector('.modal-body');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartBody = document.getElementById('cart-body');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');
const closeCartBtn = document.getElementById('close-cart');

let allProducts = [];
let selectedProduct = null;

function getCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || {};
    const fixedCart = {};
    Object.values(savedCart).forEach(item => {
      if (!item || !item.id) return;
      fixedCart[item.id] = { ...item, quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1 };
    });
    return fixedCart;
  } catch (error) {
    localStorage.removeItem('cart');
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

async function fetchProducts() {
  productsContainer.innerHTML = '<p class="products-message">Loading products...</p>';
  try {
    const response = await fetch('https://fakestoreapi.com/products');
    if (!response.ok) throw new Error('Products could not be loaded');
    const data = await response.json();
    allProducts = [...data, ...data, ...data, ...data].map((product, index) => ({ ...product, displayId: index }));
    displayProducts(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    productsContainer.innerHTML = '<p class="products-message">Error loading products. Please refresh the page.</p>';
  }
}

function displayProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML = '<p class="products-message">There are no products in this section.</p>';
    return;
  }
  const cart = getCart();
  productsContainer.innerHTML = products.map(product => `
    <div class="product-card" data-display-id="${product.displayId}">
      <img src="${product.image}" alt="${product.title}">
      <div class="product-title">${product.title}</div>
      <div class="product-price">$${Number(product.price).toFixed(2)}</div>
      <button class="add-to-cart-btn${cart[product.id] ? ' added' : ''}" type="button" data-product-id="${product.id}">${cart[product.id] ? 'Added to cart' : 'Add to Cart'}</button>
    </div>
  `).join('');
}

function getProductByDisplayId(displayId) {
  return allProducts.find(product => product.displayId === Number(displayId));
}

productsContainer.addEventListener('click', event => {
  const card = event.target.closest('.product-card');
  if (!card) return;
  const product = getProductByDisplayId(card.dataset.displayId);
  if (!product) return;
  if (event.target.closest('.add-to-cart-btn')) {
    event.stopPropagation();
    addToCart(product);
  } else {
    openProductModal(product);
  }
});

function openProductModal(product) {
  selectedProduct = product;
  const isAdded = Boolean(getCart()[product.id]);
  modalBody.innerHTML = `
    <div class="modal-image-container"><img src="${product.image}" alt="${product.title}" id="modal-product-image"></div>
    <div class="modal-details">
      <h2>${product.title}</h2>
      <p class="category">Category: ${product.category}</p>
      <p class="price">$${Number(product.price).toFixed(2)}</p>
      <p class="description">${product.description}</p>
      <button class="add-to-cart-btn${isAdded ? ' added' : ''}" id="modal-add-to-cart" type="button">${isAdded ? 'Added to cart' : 'Add to Cart'}</button>
    </div>`;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  initImageRotation();
}

function closeModal() {
  modal.style.display = 'none';
  selectedProduct = null;
  if (!cartSidebar.classList.contains('open')) document.body.style.overflow = 'auto';
}

modalBody.addEventListener('click', event => {
  if (event.target.closest('#modal-add-to-cart') && selectedProduct) addToCart(selectedProduct);
});
closeModalBtn.addEventListener('click', closeModal);

function initImageRotation() {
  const image = document.getElementById('modal-product-image');
  if (!image) return;
  let isDragging = false;
  let startX = 0;
  let currentRotation = 0;
  const startDragging = x => { isDragging = true; startX = x; };
  const rotateImage = x => {
    if (!isDragging) return;
    currentRotation += (x - startX) * 0.5;
    image.style.transform = `rotateY(${currentRotation}deg)`;
    startX = x;
  };
  image.addEventListener('mousedown', event => startDragging(event.pageX));
  image.addEventListener('mousemove', event => rotateImage(event.pageX));
  image.addEventListener('mouseup', () => { isDragging = false; });
  image.addEventListener('mouseleave', () => { isDragging = false; });
  image.addEventListener('touchstart', event => startDragging(event.touches[0].pageX), { passive: true });
  image.addEventListener('touchmove', event => rotateImage(event.touches[0].pageX), { passive: true });
  image.addEventListener('touchend', () => { isDragging = false; });
}

categoryButtons.forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    categoryButtons.forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    displayProducts(allProducts.filter(product => product.category === button.dataset.category));
  });
});

document.querySelector('.nav-links a').addEventListener('click', event => {
  event.preventDefault();
  categoryButtons.forEach(item => item.classList.remove('active'));
  displayProducts(allProducts);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function openCart() {
  displayCart();
  cartSidebar.classList.add('open');
  cartOverlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartSidebar.classList.remove('open');
  cartOverlay.style.display = 'none';
  if (modal.style.display !== 'block') document.body.style.overflow = 'auto';
}

cartBtn.addEventListener('click', event => { event.preventDefault(); openCart(); });
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function addToCart(product) {
  const cart = getCart();
  const currentQuantity = cart[product.id]?.quantity || 0;
  cart[product.id] = { ...product, quantity: currentQuantity + 1 };
  delete cart[product.id].displayId;
  saveCart(cart);
  updateAddedButtons(product.id);
  displayCart();
  updateCartCount();
}

function updateAddedButtons(productId) {
  document.querySelectorAll(`.add-to-cart-btn[data-product-id="${productId}"]`).forEach(button => {
    button.textContent = 'Added to cart';
    button.classList.add('added');
  });
  if (selectedProduct?.id === Number(productId)) {
    const modalButton = document.getElementById('modal-add-to-cart');
    if (modalButton) { modalButton.textContent = 'Added to cart'; modalButton.classList.add('added'); }
  }
}

function refreshAddedButtons(productId) {
  const isAdded = Boolean(getCart()[productId]);
  document.querySelectorAll(`.add-to-cart-btn[data-product-id="${productId}"]`).forEach(button => {
    button.textContent = isAdded ? 'Added to cart' : 'Add to Cart';
    button.classList.toggle('added', isAdded);
  });
}

function updateCartCount() {
  const count = Object.values(getCart()).reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = ` (${count}) `;
}

function displayCart() {
  const items = Object.values(getCart());
  if (items.length === 0) {
    cartBody.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
    cartTotalPrice.textContent = '$0.00';
    checkoutBtn.disabled = true;
    return;
  }
  let total = 0;
  cartBody.innerHTML = items.map(product => {
    total += Number(product.price) * product.quantity;
    return `<div class="cart-card" data-id="${product.id}">
      <img src="${product.image}" alt="${product.title}">
      <div class="cart-info"><div class="cart-title">${product.title}</div><div class="cart-price">$${(Number(product.price) * product.quantity).toFixed(2)}</div>
        <div class="quantity-controls"><button class="quantity-btn decrease-btn" type="button" aria-label="Decrease quantity">−</button><span class="quantity-value">${product.quantity}</span><button class="quantity-btn increase-btn" type="button" aria-label="Increase quantity">+</button></div>
      </div><button class="remove-from-cart-btn" type="button">Remove</button></div>`;
  }).join('');
  cartTotalPrice.textContent = `$${total.toFixed(2)}`;
  checkoutBtn.disabled = false;
}

cartBody.addEventListener('click', event => {
  const card = event.target.closest('.cart-card');
  if (!card) return;
  const productId = card.dataset.id;
  const cart = getCart();
  const product = cart[productId];
  if (!product) return;
  if (event.target.closest('.remove-from-cart-btn')) delete cart[productId];
  else if (event.target.closest('.increase-btn')) product.quantity += 1;
  else if (event.target.closest('.decrease-btn')) { product.quantity -= 1; if (product.quantity <= 0) delete cart[productId]; }
  else return;
  saveCart(cart);
  displayCart();
  updateCartCount();
  refreshAddedButtons(productId);
});


const checkoutModal = document.getElementById('checkout-modal');
const checkoutForm = document.getElementById('checkout-form');
const checkoutFormView = document.getElementById('checkout-form-view');
const checkoutSuccess = document.getElementById('checkout-success');
const checkoutTotalPrice = document.getElementById('checkout-total-price');
const closeCheckoutBtn = document.getElementById('close-checkout');
const successCloseBtn = document.getElementById('success-close');

const checkoutFields = {
  name: {
    input: document.getElementById('checkout-name'),
    error: document.getElementById('error-name'),
    validate: v => v.length >= 2 ? '' : 'Please enter your full name.'
  },
  email: {
    input: document.getElementById('checkout-email'),
    error: document.getElementById('error-email'),
    validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Please enter a valid email address.'
  },
  phone: {
    input: document.getElementById('checkout-phone'),
    error: document.getElementById('error-phone'),
    validate: v => /^[+()\d\s-]+$/.test(v) && v.replace(/\D/g, '').length >= 7 && v.replace(/\D/g, '').length <= 15
      ? '' : 'Please enter a valid phone number.'
  },
  address: {
    input: document.getElementById('checkout-address'),
    error: document.getElementById('error-address'),
    validate: v => v.length >= 8 ? '' : 'Please enter your full address.'
  }
};

function validateField(field) {
  const message = field.validate(field.input.value.trim());
  field.error.textContent = message;
  field.input.classList.toggle('invalid', Boolean(message));
  return !message;
}

Object.values(checkoutFields).forEach(field => {
  field.input.addEventListener('input', () => {
    if (field.input.classList.contains('invalid')) validateField(field);
  });
});

function openCheckout() {
  checkoutTotalPrice.textContent = cartTotalPrice.textContent;
  checkoutForm.reset();
  Object.values(checkoutFields).forEach(field => {
    field.error.textContent = '';
    field.input.classList.remove('invalid');
  });
  checkoutFormView.hidden = false;
  checkoutSuccess.hidden = true;
  closeCart();
  checkoutModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  checkoutFields.name.input.focus();
}

function closeCheckout() {
  checkoutModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

checkoutBtn.addEventListener('click', openCheckout);
closeCheckoutBtn.addEventListener('click', closeCheckout);
successCloseBtn.addEventListener('click', closeCheckout);
checkoutModal.addEventListener('click', event => { if (event.target === checkoutModal) closeCheckout(); });
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && checkoutModal.style.display === 'flex') closeCheckout();
});

checkoutForm.addEventListener('submit', event => {
  event.preventDefault();
  const results = Object.values(checkoutFields).map(validateField);
  if (results.includes(false)) {
    const firstInvalid = Object.values(checkoutFields).find(f => f.input.classList.contains('invalid'));
    if (firstInvalid) firstInvalid.input.focus();
    return;
  }
  // Order placed: empty the cart and reset the "Added to cart" buttons
  saveCart({});
  displayCart();
  updateCartCount();
  document.querySelectorAll('.add-to-cart-btn[data-product-id]').forEach(button => {
    button.textContent = 'Add to Cart';
    button.classList.remove('added');
  });
  checkoutFormView.hidden = true;
  checkoutSuccess.hidden = false;
});

window.addEventListener('click', event => { if (event.target === modal) closeModal(); });
window.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (modal.style.display === 'block') closeModal();
  if (cartSidebar.classList.contains('open')) closeCart();
});

displayCart();
updateCartCount();
fetchProducts();