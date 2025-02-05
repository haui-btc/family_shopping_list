const list = document.querySelector("ul");
const input = document.querySelector("input");
const addBtn = document.querySelector("#addBtn");
const selectAllBtn = document.querySelector("#selectAllBtn");
const deleteCheckedBtn = document.querySelector("#deleteCheckedBtn");
const modal = document.querySelector("#confirmModal");
const confirmYesBtn = document.querySelector("#confirmYes");
const confirmNoBtn = document.querySelector("#confirmNo");

let isAllSelected = false;
let currentUsername = "";

// Fetch the current user's username when the page loads
fetch("/auth/current-user")
  .then((response) => response.json())
  .then((data) => {
    if (data.username) {
      currentUsername = data.username;
      const welcomeMessage = document.getElementById("welcomeMessage");
      welcomeMessage.innerHTML = `
        Hello ${currentUsername}
        <button id="logoutBtn" class="logout-btn" title="Logout">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      `;

      // Add logout functionality
      document.getElementById("logoutBtn").addEventListener("click", () => {
        fetch("/auth/logout", { method: "POST" })
          .then((response) => response.json())
          .then(() => {
            window.location.href = "/views/login.html";
          })
          .catch((err) => console.error("Logout error:", err));
      });

      // Load items after getting username
      loadItems();
    }
  })
  .catch((err) => console.error("Error fetching user:", err));

// Modify the createListItem function to save to database
function createListItem(item) {
  // First save to database
  fetch("/auth/add-item", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ item }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        renderItem(data.item);
      }
    })
    .catch((err) => console.error("Error saving item:", err));
}

// Separate rendering function
function renderItem(itemData) {
  const listItem = document.createElement("li");
  const listText = document.createElement("span");
  const userSpan = document.createElement("span");
  const listBtn = document.createElement("button");
  const trashIcon = document.createElement("i");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  // Set checkbox state from database
  checkbox.checked = itemData.checked;

  trashIcon.classList.add("fas", "fa-trash");

  const capitalizedItem =
    itemData.item.charAt(0).toUpperCase() + itemData.item.slice(1);

  userSpan.classList.add("user-tag");
  listText.classList.add("item-text");

  listItem.appendChild(checkbox);
  listItem.appendChild(listText);
  listItem.appendChild(userSpan);
  listText.textContent = capitalizedItem;
  userSpan.textContent = `Added by ${itemData.addedBy}`;

  // Only show delete button if current user is the creator
  if (itemData.addedBy === currentUsername) {
    listBtn.appendChild(trashIcon);
    listItem.appendChild(listBtn);
  }

  // Update item's checked state in database
  checkbox.addEventListener("change", () => {
    fetch("/auth/update-item", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemId: itemData._id,
        checked: checkbox.checked,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          // Revert checkbox state if update failed
          checkbox.checked = !checkbox.checked;
          return response.json().then((data) => Promise.reject(data.message));
        }
      })
      .catch((err) => {
        console.error("Error updating item:", err);
        alert("Could not update item");
      });

    if (checkbox.checked) {
      listText.style.textDecoration = "line-through";
      listText.style.opacity = "0.7";
    } else {
      listText.style.textDecoration = "none";
      listText.style.opacity = "1";
    }
  });

  // Delete item from database
  listBtn.addEventListener("click", () => {
    fetch("/auth/delete-item", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId: itemData._id }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => Promise.reject(data.message));
        }
        list.removeChild(listItem);
      })
      .catch((err) => {
        console.error("Error deleting item:", err);
        alert(err || "Could not delete item");
      });
  });

  list.appendChild(listItem);
}

// Load items when page loads
function loadItems() {
  fetch("/auth/get-items")
    .then((response) => response.json())
    .then((items) => {
      list.innerHTML = ""; // Clear existing items
      items.forEach(renderItem);
    })
    .catch((err) => console.error("Error loading items:", err));
}

addBtn.addEventListener("click", () => {
  const myItem = input.value;
  input.value = "";
  createListItem(myItem);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const myItem = input.value;
    input.value = "";
    createListItem(myItem);
  }
});

selectAllBtn.addEventListener("click", () => {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  isAllSelected = !isAllSelected;

  checkboxes.forEach((checkbox) => {
    checkbox.checked = isAllSelected;
    const textSpan = checkbox.nextElementSibling;
    if (isAllSelected) {
      textSpan.style.textDecoration = "line-through";
      textSpan.style.opacity = "0.7";
    } else {
      textSpan.style.textDecoration = "none";
      textSpan.style.opacity = "1";
    }
  });

  selectAllBtn.textContent = isAllSelected ? "Deselect all" : "Select all";
});

deleteCheckedBtn.addEventListener("click", () => {
  const checkedItems = document.querySelectorAll(
    'input[type="checkbox"]:checked'
  );

  if (checkedItems.length === 0) return; // Don't show dialog if no items are checked

  modal.classList.add("show");

  const handleDelete = () => {
    checkedItems.forEach((checkbox) => {
      list.removeChild(checkbox.parentElement);
    });
    isAllSelected = false;
    selectAllBtn.textContent = "Select all";
    modal.classList.remove("show");
    cleanup();
  };

  const handleCancel = () => {
    modal.classList.remove("show");
    cleanup();
  };

  const cleanup = () => {
    confirmYesBtn.removeEventListener("click", handleDelete);
    confirmNoBtn.removeEventListener("click", handleCancel);
  };

  confirmYesBtn.addEventListener("click", handleDelete);
  confirmNoBtn.addEventListener("click", handleCancel);
});

// Close modal if clicking outside of it
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("show");
  }
});

input.focus();
