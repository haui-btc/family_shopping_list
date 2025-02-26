const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const mongoose = require("mongoose");

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Set session
    req.session.userId = user._id;
    res.json({ message: "Logged in successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out successfully" });
});

// Add this new route
router.get("/current-user", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  User.findById(req.session.userId)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ username: user.username });
    })
    .catch((err) => {
      res.status(500).json({ message: "Server error" });
    });
});

// Get all items
router.get("/get-items", async (req, res) => {
  const users = await User.find({}, "username shoppingList");
  const allItems = users.reduce((items, user) => {
    const userItems = user.shoppingList.map((item) => ({
      ...item.toObject(),
      addedBy: user.username,
    }));
    return [...items, ...userItems];
  }, []);

  // Sort items by creation date (newest first)
  allItems.sort((a, b) => b.createdAt - a.createdAt);

  res.json(allItems);
});

// Add new item
router.post("/add-item", async (req, res) => {
  const user = await User.findById(req.session.userId);
  const newItem = {
    item: req.body.item,
    checked: false,
    createdAt: new Date(),
    addedBy: user.username,
  };
  user.shoppingList.push(newItem);
  await user.save();
  res.json({ success: true, item: newItem });
});

// Update item (allow only if user is the creator)
router.put("/update-item", async (req, res) => {
  try {
    const { itemId, checked } = req.body;

    // Find the user who owns this item
    const user = await User.findOne({
      "shoppingList._id": itemId,
    });

    if (!user) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Update the item
    const item = user.shoppingList.id(itemId);
    item.checked = checked;
    await user.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete item (allow only if user is the creator)
router.delete("/delete-item", async (req, res) => {
  try {
    const { itemId } = req.body;

    // Find the user who owns this item
    const user = await User.findOne({
      "shoppingList._id": itemId,
    });

    if (!user) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Only allow deletion if the current user is the creator
    if (user._id.toString() !== req.session.userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this item" });
    }

    user.shoppingList = user.shoppingList.filter(
      (item) => item._id.toString() !== itemId
    );
    await user.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
