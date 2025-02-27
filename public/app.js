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

// Add this at the top of your file with other DOM element selections
const notificationContainer = document.createElement("div");
notificationContainer.className = "notification";
document.body.appendChild(notificationContainer);

// Function to show notifications
function showNotification(message, type = "error") {
  notificationContainer.className = `notification ${type}`;

  notificationContainer.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">
        <i class="fas ${
          type === "error" ? "fa-exclamation-circle" : "fa-check-circle"
        }"></i>
      </div>
      <div class="notification-message">${message}</div>
    </div>
  `;

  notificationContainer.classList.add("show");

  // Hide notification after 3 seconds
  setTimeout(() => {
    notificationContainer.classList.remove("show");
  }, 3000);
}

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
  listItem.dataset.itemId = itemData._id;

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
        // Replace alert with showNotification
        showNotification(
          err || "Could not update item - please refresh the page",
          "error"
        );
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
    // Add loading state to the list item
    listItem.classList.add("loading");
    // Disable the delete button
    listBtn.disabled = true;

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
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          list.removeChild(listItem);
          showNotification("Item deleted successfully", "success");
        }
      })
      .catch((err) => {
        console.error("Error deleting item:", err);

        // Remove loading state
        listItem.classList.remove("loading");
        // Re-enable the delete button
        listBtn.disabled = false;

        // Show error notification
        showNotification(
          err || "Could not delete item. It may have been removed already."
        );

        // Only remove the item from the UI if it's a "not found" error
        if (
          err &&
          (err.includes("not found") || err.includes("Item not found"))
        ) {
          list.removeChild(listItem);
          showNotification("Item removed successfully", "success");
        }
      });
  });

  list.appendChild(listItem);
}

// Load items when page loads
function loadItems() {
  fetch("/auth/get-items")
    .then((response) => response.json())
    .then((items) => {
      items.forEach(renderItem);
    })
    .catch((err) => console.error("Error loading items:", err));
}

// Add validation before creating a list item
addBtn.addEventListener("click", () => {
  const myItem = input.value.trim(); // Trim to handle spaces-only input

  if (!myItem) {
    // Show notification for empty input
    showNotification("Please enter an item before adding", "error");
    return;
  }

  input.value = "";
  createListItem(myItem);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const myItem = input.value.trim(); // Trim to handle spaces-only input

    if (!myItem) {
      // Show notification for empty input
      showNotification("Please enter an item before adding", "error");
      return;
    }

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
    // Create an array of item IDs to delete
    const itemIds = [];
    checkedItems.forEach((checkbox) => {
      // Get the list item element
      const listItem = checkbox.parentElement;
      // Find the item ID (stored in a data attribute)
      const itemId = listItem.dataset.itemId;
      if (itemId) {
        itemIds.push(itemId);
      }
    });

    // Only proceed if we have items to delete
    if (itemIds.length > 0) {
      // Send delete request to the server
      fetch("/auth/delete-checked-items", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemIds }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Handle successfully deleted items
            if (data.deletedIds && data.deletedIds.length > 0) {
              data.deletedIds.forEach((itemId) => {
                const itemToRemove = document.querySelector(
                  `li[data-item-id="${itemId}"]`
                );
                if (itemToRemove) {
                  list.removeChild(itemToRemove);
                }
              });

              // Show success notification
              showNotification(
                `Deleted ${data.deletedIds.length} items successfully`,
                "success"
              );
            }

            // Handle items that were not found or couldn't be deleted
            if (data.notFoundIds && data.notFoundIds.length > 0) {
              data.notFoundIds.forEach((itemId) => {
                const itemElement = document.querySelector(
                  `li[data-item-id="${itemId}"]`
                );
                if (itemElement) {
                  // Reset the checkbox and styling for items that couldn't be deleted
                  const checkbox = itemElement.querySelector(
                    'input[type="checkbox"]'
                  );
                  if (checkbox) {
                    checkbox.checked = false;
                    const textSpan = checkbox.nextElementSibling;
                    if (textSpan) {
                      textSpan.style.textDecoration = "none";
                      textSpan.style.opacity = "1";
                    }
                  }
                }
              });

              if (data.notFoundIds.length > 0 && data.deletedIds.length === 0) {
                showNotification(
                  "No items were deleted. You can only delete items you created.",
                  "error"
                );
              } else if (data.notFoundIds.length > 0) {
                showNotification(
                  `${data.notFoundIds.length} items couldn't be deleted. You can only delete your own items.`,
                  "error"
                );
              }
            }

            // If nothing was deleted or found
            if (
              (!data.deletedIds || data.deletedIds.length === 0) &&
              (!data.notFoundIds || data.notFoundIds.length === 0)
            ) {
              showNotification(
                "No items were deleted. You can only delete items you created.",
                "error"
              );
            }
          } else {
            showNotification(
              data.message || "Failed to delete some items",
              "error"
            );

            // Reset all checkboxes on error
            document
              .querySelectorAll('input[type="checkbox"]:checked')
              .forEach((checkbox) => {
                checkbox.checked = false;
                const textSpan = checkbox.nextElementSibling;
                textSpan.style.textDecoration = "none";
                textSpan.style.opacity = "1";
              });
          }
        })
        .catch((err) => {
          console.error("Error deleting items:", err);
          showNotification("Error deleting items", "error");

          // Reset all checkboxes on error
          document
            .querySelectorAll('input[type="checkbox"]:checked')
            .forEach((checkbox) => {
              checkbox.checked = false;
              const textSpan = checkbox.nextElementSibling;
              textSpan.style.textDecoration = "none";
              textSpan.style.opacity = "1";
            });
        });
    }

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
