let isProcessing = false;

// Load status on page load
document.addEventListener("DOMContentLoaded", () => {
  loadStatus();
  // Poll for status updates every 2 seconds
  setInterval(loadStatus, 2000);
});

async function loadStatus() {
  try {
    const response = await fetch("/api/status");
    const status = await response.json();
    updateStatusDisplay(status);
  } catch (error) {
    console.error("Failed to load status:", error);
  }
}

function updateStatusDisplay(status) {
  const statusText = document.getElementById("status-text");
  const statusIndicator = document.querySelector(".status-indicator");
  const statusTime = document.getElementById("status-time");

  if (status.type) {
    const actionText = status.type === "block" ? "Blocked" : "Allowed";
    statusText.textContent = `${actionText} chess sites`;

    // Update indicator
    statusIndicator.className = "status-indicator";
    if (status.status === "success") {
      statusIndicator.classList.add("success");
    } else if (status.status === "error") {
      statusIndicator.classList.add("error");
    } else if (status.status === "running") {
      statusIndicator.classList.add("running");
    }

    // Update timestamp
    if (status.timestamp) {
      const date = new Date(status.timestamp);
      statusTime.textContent = `Last action: ${date.toLocaleString()}`;
    }
  } else {
    statusText.textContent = "No action taken yet";
    statusIndicator.className = "status-indicator";
    statusTime.textContent = "";
  }
}

function showLoading(text = "Processing...") {
  const loading = document.getElementById("loading");
  const loadingText = document.getElementById("loading-text");
  loadingText.textContent = text;
  loading.classList.remove("hidden");
}

function hideLoading() {
  const loading = document.getElementById("loading");
  loading.classList.add("hidden");
}

function showMessage(text, type = "success") {
  const message = document.getElementById("message");
  message.textContent = text;
  message.className = `message ${type}`;
  message.classList.remove("hidden");

  // Auto-hide after 5 seconds
  setTimeout(() => {
    message.classList.add("hidden");
  }, 5000);
}

function hideMessage() {
  const message = document.getElementById("message");
  message.classList.add("hidden");
}

function setButtonsDisabled(disabled) {
  document.getElementById("block-btn").disabled = disabled;
  document.getElementById("allow-btn").disabled = disabled;
}

async function blockChess() {
  if (isProcessing) return;

  isProcessing = true;
  setButtonsDisabled(true);
  hideMessage();
  showLoading("Blocking chess sites...");

  try {
    const response = await fetch("/api/block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      showMessage(data.message, "success");
    } else {
      showMessage(data.message || "Failed to block chess sites", "error");
    }
  } catch (error) {
    showMessage("Failed to connect to server", "error");
    console.error("Error:", error);
  } finally {
    hideLoading();
    setButtonsDisabled(false);
    isProcessing = false;
    // Refresh status
    loadStatus();
  }
}

async function allowChess() {
  if (isProcessing) return;

  isProcessing = true;
  setButtonsDisabled(true);
  hideMessage();
  showLoading("Allowing chess sites...");

  try {
    const response = await fetch("/api/allow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      showMessage(data.message, "success");
    } else {
      showMessage(data.message || "Failed to allow chess sites", "error");
    }
  } catch (error) {
    showMessage("Failed to connect to server", "error");
    console.error("Error:", error);
  } finally {
    hideLoading();
    setButtonsDisabled(false);
    isProcessing = false;
    // Refresh status
    loadStatus();
  }
}
