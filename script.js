// =====================================
// LOGIN PAGE (index.html)
// =====================================
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;
  const errorMsg = document.getElementById("error-msg");

  if (!username || !password || !role) {
    errorMsg.style.color = "red";
    errorMsg.innerText = 'All fields are required!';
    return;
  }

  if (
    (username === "admin" && password === "admin123" && role === "Admin") ||
    (username === "owner" && password === "owner123" && role === "StoreOwner") ||
    (username === "emp" && password === "emp123" && role === "Employee")
  ) {
    errorMsg.style.color = "green";
    errorMsg.innerText = "Login successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  } else {
    errorMsg.style.color = "red";
    errorMsg.innerText = "Invalid credentials!";
  }
}


// =====================================
// DASHBOARD NAVIGATION
// =====================================
function navigate(page) {
  window.location.href = page;
}

function logout() {
  window.location.href = "index.html";
}

function goBack() {
  window.location.href = "dashboard.html";
}

const form = document.getElementById("stockForm");

if (form && !form.dataset.listenerAdded) {
  form.dataset.listenerAdded = "true";

  form.addEventListener("submit", async (e) => {
    console.log("Submit clicked");
    e.preventDefault();

    const name = document.getElementById("productName").value;
    const category = document.getElementById("category").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const price = parseFloat(document.getElementById("price").value);

    const newStock = { name, category, quantity, price };

    try {
      const response = await fetch("http://localhost:5000/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStock),
      });

      if (response.ok) {
        alert("Stock added!");
        form.reset();
        loadStock();
      } else {
        alert("Failed to add stock.");
      }
    } catch (error) {
      alert("Error adding stock");
      console.error(error);
    }
  });
}


async function loadStock() {
  const tableBody = document.querySelector("#stockTable tbody");
  tableBody.innerHTML = "";

  try {
    const response = await fetch("http://localhost:5000/stock");
    const stockData = await response.json();

    stockData.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price.toFixed(2)}</td>
        <td><button onclick="deleteStock('${item.name}')">Delete</button></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    alert("Could not load stock data");
  }
}

async function deleteStock(name) {
  if (!confirm(`Delete ${name}?`)) return;

  try {
    const response = await fetch(`http://localhost:5000/stock/${name}`, {
      method: "DELETE"
    });

    if (response.ok) {
      alert("Stock deleted!");
      loadStock();
    } else {
      alert("Failed to delete stock.");
    }
  } catch (err) {
    console.error(err);
    alert("Error while deleting stock.");
  }
}

// =====================================
// SALES PAGE (sales.html)
// =====================================
const productSelect = document.getElementById("productSelect");
const qtyInput = document.getElementById("saleQty");
const totalDisplay = document.getElementById("totalPrice");
const saleMessage = document.getElementById("saleMessage");

async function loadSalesProducts() {
  if (!productSelect) return;

  const response = await fetch("http://localhost:5000/stock");
  const stockData = await response.json();

  productSelect.innerHTML = `<option value="">Select Product</option>`;
  stockData.forEach(item => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = `${item.name} - ₹${item.price}`;
    option.dataset.price = item.price;
    option.dataset.quantity = item.quantity;
    productSelect.appendChild(option);
  });

  productSelect.addEventListener("change", updateTotal);
  if (qtyInput) qtyInput.addEventListener("input", updateTotal);
}

function updateTotal() {
  const selected = productSelect.options[productSelect.selectedIndex];
  const price = parseFloat(selected.dataset.price || 0);
  const qty = parseInt(qtyInput.value || 0);
  totalDisplay.textContent = (price * qty).toFixed(2);
}

const salesForm = document.getElementById("salesForm");
if (salesForm) {
  salesForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selected = productSelect.options[productSelect.selectedIndex];
    const product = selected.value;
    const qty = parseInt(qtyInput.value);
    const availableQty = parseInt(selected.dataset.quantity);

    if (!product || qty <= 0) return;
    if (qty > availableQty) {
      alert(`Only ${availableQty} items available!`);
      return;
    }

    // Fetch current stock
    const response = await fetch("http://localhost:5000/stock");
    const stockData = await response.json();

    // Update stock quantity
    const updatedStock = stockData.map(item => {
      if (item.name === product && item.quantity >= qty) {
        item.quantity -= qty;
      }
      return item;
    });

    // Save back updated stock
    await fetch("http://localhost:5000/stock/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedStock),
    });

    alert(`✅ Sale recorded: ${qty} × ${product}`);

    salesForm.reset();
    totalDisplay.textContent = "0.00";
    loadSalesProducts(); // reload dropdown
  });
}

// =====================================
// REPORT PAGE (reports.html)
// =====================================
async function loadReport() {
  const reportTable = document.querySelector("#reportTable tbody");
  const totalInventoryDisplay = document.getElementById("totalInventory");

  if (!reportTable || !totalInventoryDisplay) return;

  const response = await fetch("http://localhost:5000/stock");
  const stockData = await response.json();

  let totalValue = 0;
  reportTable.innerHTML = "";

  stockData.forEach(item => {
    const value = item.quantity * item.price;
    totalValue += value;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.quantity}</td>
      <td>₹${item.price.toFixed(2)}</td>
      <td>₹${value.toFixed(2)}</td>
    `;
    reportTable.appendChild(row);
  });

  totalInventoryDisplay.textContent = totalValue.toFixed(2);
}

function downloadReport() {
  const rows = [["Product", "Category", "Quantity", "Unit Price", "Total Value"]];

  fetch("http://localhost:5000/stock")
    .then(res => res.json())
    .then(stockData => {
      stockData.forEach(item => {
        rows.push([
          item.name,
          item.category,
          item.quantity,
          item.price.toFixed(2),
          (item.price * item.quantity).toFixed(2)
        ]);
      });

      let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "stock_report.csv");
      document.body.appendChild(link);
      link.click();
    });
}

// =====================================
// PAGE INITIALIZERS
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("stockForm")) {
    loadStock();
  }

  if (document.getElementById("salesForm")) {
    loadSalesProducts();
  }

  if (document.getElementById("reportTable")) {
    loadReport();
  }
});

