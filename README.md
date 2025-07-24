---

# Flight Order Management System - API Server

This is the backend server for the Flight Order Management System, a full-stack CRM application. It is a RESTful API built with **Node.js**, **Express**, and **MongoDB** that handles all business logic, data persistence, and user authentication for the platform.

## Core Features 🚀

- **Secure Authentication:** User registration and login are handled using JSON Web Tokens (JWT) with password hashing (bcrypt).
- **Role-Based Access Control (RBAC):** Middleware protects routes based on user roles (**Customer**, **Agent**, **Admin**), ensuring users can only access the data and perform the actions they are authorized for.
- **CRUD Operations:** Provides complete Create, Read, Update, and Delete operations for all major data models including Users, Orders, and Passengers.
- **Complex Business Logic:** Manages the entire multi-step order processing workflow, from creation to agent assignment and final customer approval.
- **External API Integration:** Includes proxy endpoints for fetching data from third-party weather and currency conversion services.

---

## Technology Stack 🛠️

- **Backend Framework:** Node.js, Express.js
- **Database:** MongoDB with Mongoose for data modeling.
- **Authentication:** JSON Web Tokens (JWT), bcrypt.js
- **Validation:** Joi for validating incoming request bodies.
- **Logging:** Winston for logging application events and errors.

---

## API Endpoints 🗺️

The following is a summary of the main API routes available.

### Authentication & Users

| Method   | Endpoint              | Description                            | Access      |
| :------- | :-------------------- | :------------------------------------- | :---------- |
| `POST`   | `/api/users/register` | Register a new user.                   | Public      |
| `POST`   | `/api/users/login`    | Authenticate a user and receive a JWT. | Public      |
| `GET`    | `/api/users`          | Get a list of all users.               | Admin       |
| `GET`    | `/api/users/:id`      | Get details for a single user.         | Admin       |
| `PUT`    | `/api/users/:id`      | Update a user's profile information.   | Owner/Admin |
| `DELETE` | `/api/users/:id`      | Delete a user.                         | Admin       |
| `PATCH`  | `/api/users/:id/role` | Change a user's role (e.g., to Agent). | Admin       |

### Orders

| Method   | Endpoint                  | Description                                         | Access            |
| :------- | :------------------------ | :-------------------------------------------------- | :---------------- |
| `POST`   | `/api/orders`             | Create a new order.                                 | Customer          |
| `GET`    | `/api/orders`             | Get all orders in the system.                       | Admin             |
| `GET`    | `/api/orders/my-orders`   | Get all orders for the logged-in Customer or Agent. | Customer/Agent    |
| `GET`    | `/api/orders/:id`         | Get details for a single order.                     | Owner/Agent/Admin |
| `PUT`    | `/api/orders/:id`         | Update an order's details (flights, price, etc.).   | Agent/Admin       |
| `DELETE` | `/api/orders/:id`         | Delete an order.                                    | Admin             |
| `PATCH`  | `/api/orders/:id/approve` | Approve an order.                                   | Customer (Owner)  |

---

## Environment Variables 🔑

To run this project, you will need to create a `.env` file in the root directory of the server and add the following configuration variables:

```env
# The port the server will run on
PORT=3001

# Your MongoDB connection string
MONGO_URI="your_mongodb_connection_string"

# A secret key for signing JWTs (use a long, random string)
JWT_KEY="your_secret_jwt_key"

# API keys for the mini-apps
WEATHER_API_KEY="your_weatherapi.com_api_key"
COIN_API_KEY="your_currencyapi.com_api_key"
```

---

## Installation & Startup 🚀

1.  **Clone the repository:**

    ```bash
    git clone [your-repository-url]
    cd [repository-folder]
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up your `.env` file:**
    Create the `.env` file and add the variables as described above.

4.  **Run the server:**

    - For development with automatic restarting (using nodemon):
      ```bash
      npm run dev
      ```
    - For a standard production start:
      ```bash
      npm start
      ```

    The API server will be running on the port specified in your `.env` file (e.g., `http://localhost:3001`).
