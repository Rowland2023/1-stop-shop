
# 🧑‍💼 Employee Management Web App

A full-stack CRUD application built with **Node.js**, **Express**, and **MongoDB**, designed to manage employees and departments. The app is containerized using **Docker** for easy setup and deployment.

## 📁 Project Structure

```
├── models/
│   ├── Employee.js
│   └── Department.js
├── routes/
│   ├── employeeRoutes.js
│   └── departmentRoutes.js
├── public/
│   └── index.html
├── seed.js
├── app.js
├── server.js
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Rowland2023/Employee-management-app.git
cd employee-management-app
```

### 2. Start the App with Docker

```bash
docker-compose up --build
```

This command builds and starts both the Node.js app and MongoDB containers. The app will be available at:

```
http://localhost:3000
```

### 3. Seed Initial Department Data (Optional)

If your database is empty, you can seed it with default departments:

```bash
docker exec -it <app_container_name> node seed.js
```

Replace `<app_container_name>` with the name of your running app container (e.g., `employee-app`).

### 4. Stop the App

```bash
docker-compose down
```

This stops and removes the containers.

## 🚀 Features

- Add, view, edit, and delete employees
- Assign employees to departments via dropdown
- View department list
- RESTful API endpoints
- Dockerized backend and database

## 📋 API Endpoints

| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| GET    | `/api/employees`     | Get all employees        |
| POST   | `/api/employees`     | Add new employee         |
| PUT    | `/api/employees/:id` | Update employee          |
| DELETE | `/api/employees/:id` | Delete employee          |
| GET    | `/api/departments`   | Get all departments      |

## 🧪 Testing

You can test the API using:
- Postman
- Browser (via frontend forms)
- MongoDB Compass (for DB inspection)

## 📄 License

This project is for educational purposes as part of the Coursera Full-Stack Development course. Feel free to fork and build upon it.

---

```

