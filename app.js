const products = [
  { id: 'rice', name: 'Rice', price: 250, group: 'Grains', desc: 'A pantry staple for steaming and serving alongside your favorite ulam.' },
  { id: 'cabbage', name: 'Cabbage', price: 100, group: 'Vegetables', desc: 'Crisp green leaves for slaws, stir-fries, and a warming pot of nilaga.' },
  { id: 'carrots', name: 'Carrots', price: 280, group: 'Vegetables', desc: 'Earthy, crunchy carrots for roasting, soups, or a fresh snack.' },
  { id: 'tomatoes', name: 'Tomatoes', price: 105, group: 'Vegetables', desc: 'Juicy red tomatoes for a fresh ensalada or a quick sauté.' },
  { id: 'corn', name: 'Corn', price: 100, group: 'Grains', desc: 'Golden ears of corn to steam, grill, or share at the table.' },
  { id: 'potatoes', name: 'Potatoes', price: 50, group: 'Vegetables', desc: 'Versatile potatoes for stews, crispy wedges, and creamy mash.' }
];

const byId = Object.fromEntries(products.map(product => [product.id, product]));
const storageKey = 'agri-demo-v1';

const defaults = {
  cart: { cabbage: 1, rice: 1, tomatoes: 1 },
  name: 'User',
  claimed: false,
  messages: [],
  notifications: true,
  signedIn: true
};

let saved;
try {
  saved = JSON.parse(localStorage.getItem(storageKey));
} catch {
  // Start with the default profile when saved data cannot be read.
}

const state = { ...defaults, ...saved };
const app = document.querySelector('#app');
const farmer = 'Franciso P. Cadungog';
let filter = 'All';
let noticeTimer;

function notify(message) {
  const box = document.querySelector('#notice');
  box.textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    box.textContent = '';
  }, 3000);
}

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    notify('Browser storage is unavailable. Changes last for this visit.');
  }
}

// Update old default names once, including profiles already saved in the browser.
if (!state.profileNameUpdated) {
  if (state.name === 'UserABC' || state.name === 'USER') {
    state.name = defaults.name;
  }
  state.profileNameUpdated = true;
  save();
}

function escapeText(value) {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML.replaceAll('"', '&quot;');
}

function money(value) {
  return '₱' + value.toLocaleString('en-PH');
}

function imageOf(id) {
  return `<img src="./${id}.webp" alt="${byId[id].name}">`;
}

function button(label, action, value = '', className = 'btn') {
  return `<button class="${className}" data-action="${action}" data-value="${value}">${label}</button>`;
}

function marketLink() {
  return '<a class="back" href="#home">← Back to market</a>';
}

function card(product) {
  const { id, name, price } = product;
  const crop = ['carrots', 'potatoes'].includes(id) ? 'crop' : '';

  return `
    <article class="card">
      <a class="picture ${crop}" href="#product/${id}">${imageOf(id)}</a>
      <div class="cardinfo">
        <h3><a href="#product/${id}">${name}</a></h3>
        <div class="row">
          <span class="price">${money(price)} <small>/ kg</small></span>
          <button class="add" aria-label="Add ${name} to cart"
                  data-action="add" data-value="${id}">+</button>
        </div>
      </div>
    </article>`;
}

function home() {
  const filters = ['All', 'Vegetables', 'Grains'].map(category => `
    <button data-action="filter" data-value="${category}"
            aria-pressed="${category === filter}"
            class="${category === filter ? 'chosen' : ''}">
      ${category}
    </button>`).join('');

  const items = products
    .filter(product => filter === 'All' || product.group === filter)
    .map(card)
    .join('');

  return `
    <section class="hero">
      <div class="welcome">
        <span class="eyebrow">Local farmers’ market</span>
        <h1>Welcome back,<br>${escapeText(state.name)}.</h1>
        <p>What are we doing today?</p>
        <button class="linkbtn" data-action="browse">Browse produce ↓</button>
      </div>
      <div class="harvest">
        <img src="./corn.webp" alt="Fresh golden ears of corn">
        <a class="photo-label" href="#product/corn">Sweet corn ↗</a>
      </div>
    </section>
    <div class="promo">
      <b>✳ &nbsp; Free data available</b>
      ${state.claimed ? '<span>Demo offer claimed ✓</span>' : button('Claim now →', 'claim')}
    </div>
    <section id="featured">
      <div class="row">
        <h2>Featured items</h2>
        <div class="filters" aria-label="Product categories">${filters}</div>
      </div>
      <div class="grid">${items}</div>
    </section>`;
}

function detail(product) {
  return marketLink() + `
    <article class="detail">
      <div class="picture crop">${imageOf(product.id)}</div>
      <div class="panel">
        <span class="eyebrow">${product.group}</span>
        <h1>${product.name}</h1>
        <h2>${money(product.price)} <small>/ kg</small></h2>
        <p>${product.desc}</p>
        <div class="actions">
          ${button('Add to cart', 'add', product.id)}
          <a href="#cart" class="linkbtn">View cart →</a>
        </div>
        <div class="seller">
          <img class="avatar" src="./farmer.webp" alt="Farmer in a field">
          <div><strong>${farmer}</strong><br><small>Farmer · ★★★★★</small></div>
        </div>
        <p><a class="back" href="#chat">Message farmer →</a></p>
      </div>
    </article>`;
}

function cartTotal() {
  return products.reduce((total, product) => {
    const quantity = state.cart[product.id] || 0;
    return total + product.price * quantity;
  }, 0);
}

function cart() {
  const heading = marketLink() + '<h1 class="page-title">Your cart</h1>';
  const lines = products.filter(product => state.cart[product.id] > 0);

  if (lines.length === 0) {
    return heading + `
      <div class="panel">
        <h2>Your cart is empty</h2>
        <a class="back" href="#home">Browse produce →</a>
      </div>`;
  }

  const items = lines.map(({ id, name, price }) => `
    <div class="cartline">
      ${imageOf(id)}
      <div>
        <strong><a href="#product/${id}">${name}</a></strong><br>
        <small>${money(price)} / kg</small>
      </div>
      <div class="qty">
        <button aria-label="Remove one kilogram of ${name}"
                data-action="minus" data-value="${id}">−</button>
        <span>${state.cart[id]}</span>
        <button aria-label="Add one kilogram of ${name}"
                data-action="plus" data-value="${id}">+</button>
      </div>
    </div>`).join('');

  return heading + `
    <div class="checkout">
      <section class="panel">${items}</section>
      <section class="panel">
        <h2>Checkout</h2>
        <p class="row">Total <b>${money(cartTotal())}</b></p>
        <p class="muted">Demo checkout. No payment is collected.</p>
        ${button('Place demo order →', 'checkout')}
      </section>
    </div>`;
}

function chat() {
  const messages = state.messages.map(message =>
    `<div class="bubble mine">${escapeText(message)}</div>`
  ).join('');

  return `
    <section class="chat">
      ${marketLink()}
      <h1 class="page-title">Messages</h1>
      <div class="panel">
        <div class="row">
          <div><b>${farmer}</b><br><small>Farmer · Demo conversation</small></div>
          <img class="avatar" src="./farmer.webp" alt="">
        </div>
        <div class="messages" role="log">
          <div class="bubble mine">Hello, is the corn fresh?</div>
          <div class="bubble">Yes, the corn was freshly harvested.</div>
          ${messages}
        </div>
        <form class="compose" id="chatForm">
          <input aria-label="Message" name="message"
                 placeholder="Write your message here…" maxlength="1200" required>
          <button class="btn">Send</button>
        </form>
      </div>
    </section>`;
}

function settings() {
  const name = escapeText(state.name);

  return `
    <section class="prefs">
      ${marketLink()}
      <h1 class="page-title">Settings</h1>
      <div class="panel">
        <span class="eyebrow">Demo profile</span>
        <h2>${name}</h2>
        <details>
          <summary>Account settings</summary>
          <form id="profile">
            <label for="displayName">Display name</label>
            <input id="displayName" name="displayName" type="text"
                   value="${name}" required maxlength="24">
            <button class="btn">Save changes</button>
          </form>
        </details>
        <details>
          <summary>Referrals</summary>
          <p>Invite a friend with demo referral code <b>AGRI-LOCAL</b>.</p>
        </details>
        <details>
          <summary>Notification settings</summary>
          <label>
            <input type="checkbox" id="alerts" ${state.notifications ? 'checked' : ''}>
            Enable market notifications in this demo
          </label>
        </details>
        <details>
          <summary>Privacy support</summary>
          <p>Your profile, cart, and chat messages are saved in this browser.</p>
        </details>
        <details>
          <summary>Terms of service</summary>
          <p>This is a sample marketplace for browsing produce and trying the ordering process.</p>
        </details>
        <details>
          <summary>Help service</summary>
          <p>Choose a product to view its price per kilo. Use the + and − buttons in your cart to change quantities.</p>
        </details>
        <p>${button('Log out of demo', 'logout', '', 'linkbtn')}</p>
      </div>
    </section>`;
}

function updateCount() {
  const count = Object.values(state.cart).reduce((sum, quantity) => sum + quantity, 0);
  document.querySelector('#count').textContent = count;
}

function render() {
  const [page, id] = location.hash.slice(1).split('/');
  let html;

  if (!state.signedIn) {
    html = `<div class="panel"><h1>You’re logged out</h1>${button('Enter demo market', 'login')}</div>`;
  } else if (page === 'product' && byId[id]) {
    html = detail(byId[id]);
  } else if (page === 'cart') {
    html = cart();
  } else if (page === 'chat') {
    html = chat();
  } else if (page === 'settings') {
    html = settings();
  } else if (page === 'order' && state.lastOrder) {
    html = marketLink() + `
      <div class="panel">
        <h1>Demo order placed</h1>
        <p>Order total <b>${money(state.lastOrder)}</b></p>
      </div>`;
  } else {
    html = home();
  }

  app.innerHTML = html;
  updateCount();

  document.querySelectorAll('nav a').forEach(link => {
    link.classList.toggle('active', link.hash === '#' + (page || 'home'));
  });

  const log = app.querySelector('.messages');
  if (log) log.scrollTop = log.scrollHeight;
}

app.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const { action, value } = target.dataset;

  switch (action) {
    case 'browse':
      document.querySelector('#featured').scrollIntoView({ behavior: 'smooth' });
      return;

    case 'filter':
      filter = value;
      render();
      app.querySelector('.chosen').focus({ preventScroll: true });
      return;

    case 'add':
    case 'plus':
    case 'minus': {
      const change = action === 'minus' ? -1 : 1;
      state.cart[value] = Math.max(0, (state.cart[value] || 0) + change);

      if (action === 'add') {
        save();
        updateCount();
        notify(byId[value].name + ' added to cart');
        return;
      }
      break;
    }

    case 'claim':
      state.claimed = true;
      notify('Demo data offer claimed');
      break;

    case 'checkout':
      state.lastOrder = cartTotal();
      state.cart = {};
      save();
      location.hash = 'order';
      return;

    case 'logout':
      state.signedIn = false;
      break;

    case 'login':
      state.signedIn = true;
      location.hash = 'home';
      break;

    default:
      return;
  }

  save();
  render();
});

app.addEventListener('change', event => {
  if (event.target.id === 'alerts') {
    state.notifications = event.target.checked;
    save();
    notify('Preference saved');
  }
});

app.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.target);

  if (event.target.id === 'chatForm') {
    const message = data.get('message').trim();
    if (!message) return;

    state.messages.push(message);
    save();
    render();
    app.querySelector('[name="message"]').focus();
  }

  if (event.target.id === 'profile') {
    const name = data.get('displayName').trim();
    if (!name) return;

    state.name = name;
    save();
    render();
    notify('Profile updated');
  }
});

window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
});

render();

const themeToggle = document.querySelector('#theme-toggle');

function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(dark));
  document.querySelector('#theme-icon').textContent = dark ? '☀' : '☾';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#081f35' : '#0092f1';
}

let darkMode = false;
try {
  darkMode = localStorage.getItem('agri-theme') === 'dark';
} catch {
  // Use the light theme when browser storage is unavailable.
}

applyTheme(darkMode);

themeToggle.addEventListener('click', () => {
  darkMode = !darkMode;
  applyTheme(darkMode);
  try {
    localStorage.setItem('agri-theme', darkMode ? 'dark' : 'light');
  } catch {
    // The selected theme still applies for this visit.
  }
});