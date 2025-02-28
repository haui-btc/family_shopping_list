# Family Shopping List

A collaborative shopping list application that allows family members to create, manage, and share shopping items in real-time.

![Family Shopping List](https://placeholder-for-app-screenshot.com/screenshot.png)

## Features

- **User Authentication**: Secure login and registration system
- **Real-time Item Management**: Add, check off, and delete shopping items
- **Collaborative Experience**: See who added each item
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **User-friendly Interface**: Clean, modern UI with intuitive controls
- **Bulk Actions**: Select all items or delete checked items with a single click
- **Visual Feedback**: Notifications for all user actions

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/family-shopping-list.git
   cd family-shopping-list
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the application:

   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Register/Login**: Create an account or log in with existing credentials
2. **Add Items**: Type an item name and click "Add" or press Enter
3. **Mark Items**: Check the box next to an item to mark it as completed
4. **Delete Items**: Click the trash icon to remove your own items
5. **Bulk Actions**: Use "Select all" to check all items, and "Delete checked" to remove multiple items at once

## Project Structure
