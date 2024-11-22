const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());

app.use(express.json()); // для парсингу JSON-запитів

const config = {
  user: "atmit",
  password: "root",
  server: "DESKTOP-9KT5M4L",
  database: "ProgDevIT",
  options: {
    trustServerCertificate: true,
    trustedConnection: false,
    enableArithAbort: true,
    instancename: "SQLEXPRESS",
  },
  port: 1433,
};

app.get("/tasks/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    await sql.connect(config);

    // Виконуємо SQL-запит для отримання задач разом з іменем виконавця
    const result = await sql.query(`
      SELECT 
        Tasks.task_id, Tasks.project_id, Tasks.name, Tasks.description, 
        Users.full_name AS assigned_to_name, Tasks.due_date, 
        Tasks.status, Tasks.priority
      FROM Tasks
      JOIN Users ON Tasks.assigned_to = Users.user_id
      WHERE Tasks.assigned_to = ${userId}
    `);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "Задачі не знайдено для цього користувача" });
    }

    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Помилка при отриманні задач");
  }
});

app.get("/work_submissions/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
        w.submission_id, 
        p.name AS project_name, 
        u.full_name AS developer_name, 
        w.submission_date,
        w.status,
        w.comment
      FROM Work_Submissions w
      JOIN Projects p ON w.project_id = p.project_id
      JOIN Developers d ON w.developer_id = d.developer_id
      JOIN Users u ON d.user_id = u.user_id
      WHERE p.client_id = ${userId}
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Error retrieving work submissions");
  } finally {
    await sql.close();
  }
});

app.get("/projects/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
        p.project_id, 
        p.name, 
        p.description, 
        u.full_name AS client_name, 
        p.start_date, 
        p.end_date, 
        p.status 
      FROM Projects p
      JOIN Users u ON p.client_id = u.user_id
      WHERE p.client_id = ${userId}
    `);
    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "Проекти не знайдено для цього користувача" });
    }
    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Error retrieving projects");
  } finally {
    await sql.close();
  }
});

app.get("/", (req, res) => {
  return res.json("Hi i am backend");
});

app.listen(3000, () => {
  console.log("The server has started");
});

app.get("/systems/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await sql.connect(config);
    const result = await sql.query(`
      SELECT 
        s.maintenance_id, 
        p.name AS project_name, 
        s.date, 
        s.description, 
        u.full_name AS developer_name, 
        s.status
      FROM System_Maintenance s
      JOIN Projects p ON s.project_id = p.project_id
      LEFT JOIN Developers d ON s.assigned_to = d.developer_id
      LEFT JOIN Users u ON d.user_id = u.user_id
      WHERE s.assigned_to = ${userId}
    `);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "Систем не знайдено для цього користувача" });
    }

    res.json(result.recordset);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Error retrieving systems");
  } finally {
    await sql.close();
  }
});

// app.post("/login", async (req, res) => {
//   console.log(req.body);
//   const { email, password } = req.body;
//   console.log(email);
//   try {
//     await sql.connect(config);

//     // Знаходимо користувача за електронною поштою
//     const result = await sql.query(
//       `SELECT * FROM Users WHERE email = '${email}'`
//     );
//     console.log(res);
//     // Якщо користувача не знайдено
//     if (result.recordset.length === 0) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const user = result.recordset[0];

//     let isPasswordValid;
//     // Перевіряємо пароль
//     if (password == user.password) {
//       isPasswordValid = true;
//     }

//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "Invalid password" });
//     }

//     // Якщо все гаразд, повертаємо користувача без пароля
//     const { password: _, ...userData } = user;
//     res.json(userData);
//   } catch (err) {
//     console.error("SQL error", err);
//     res.status(500).send("Error retrieving user");
//   }
// });

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    await sql.connect(config);

    // Пошук користувача за email
    const result = await sql.query(`SELECT * FROM Users WHERE email = '${email}'`);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Користувач не знайдений" });
    }

    const user = result.recordset[0];

    // Перевірка паролю
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Невірний пароль" });
    }

    // Видалення паролю перед поверненням даних
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Помилка авторизації");
  }
});

app.post("/projectsadd", async (req, res) => {
  const { client_id, name, description, start_date, end_date, status } =
    req.body;

  try {
    await sql.connect(config);

    const insertResult = await sql.query(`
      INSERT INTO Projects (client_id, name, description, start_date, end_date, status) 
      VALUES (${client_id}, '${name}', '${description}', '${start_date}', '${end_date}', '${status}')
    `);

    if (insertResult.rowsAffected[0] > 0) {
      res.status(200).json({ message: "Проект успішно створено" });
    } else {
      res.status(500).json({ message: "Помилка при створенні проекту" });
    }
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).json({ message: "Помилка при створенні проекту" });
  }
});

app.post("/work_submissionsadd", async (req, res) => {
  const { project_id, developer_id, submission_date, status, comment } =
    req.body;

  try {
    await sql.connect(config);

    const insertResult = await sql.query(`
      INSERT INTO Work_Submissions (project_id, developer_id, submission_date, status, comment) 
      VALUES (${project_id}, ${developer_id}, '${submission_date}', '${status}', '${comment}')
    `);

    if (insertResult.rowsAffected[0] > 0) {
      res.status(200).json({ message: "Звіт успішно створено" });
    } else {
      res.status(500).json({ message: "Помилка при створенні звіту" });
    }
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).json({ message: "Помилка при створенні звіту" });
  }
});

// app.post("/register", async (req, res) => {
//   const { email, password, full_name } = req.body;

//   // Значення role_id за замовчуванням
//   const role_id = 1;

//   try {
//     await sql.connect(config);

//     // Перевіряємо, чи вже існує користувач з такою електронною поштою
//     const existingUserResult = await sql.query(
//       `SELECT * FROM Users WHERE email = '${email}'`
//     );

//     if (existingUserResult.recordset.length > 0) {
//       return res.status(409).json({ message: "Email already exists" });
//     }

//     // Вставляємо нового користувача у базу даних
//     const insertResult = await sql.query(
//       `INSERT INTO Users (email, password, full_name, role_id) 
//        VALUES ('${email}', '${password}', '${full_name}', ${role_id})`
//     );

//     // Перевіряємо, чи користувач успішно створений
//     if (insertResult.rowsAffected[0] > 0) {
//       const result = await sql.query(
//         `SELECT * FROM Users WHERE email = '${email}'`
//       );
//       console.log(result);

//       const user = result.recordset[0];
//       res.status(200).json(user); // Повертаємо 1 об'єкт користувача
//     } else {
//       res.status(500).json({ message: "Registration was successful" });
//     }
//   } catch (err) {
//     console.error("SQL error", err);
//     res.status(500).send("Error registering user");
//   }
// });


app.post("/register", async (req, res) => {
  const { email, password, full_name } = req.body;
  const role_id = 1;

  try {
    await sql.connect(config);

    // Перевірка, чи вже існує користувач з таким email
    const existingUser = await sql.query(`SELECT * FROM Users WHERE email = '${email}'`);
    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ message: "Email вже зареєстровано" });
    }

    // Хешування паролю
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Вставка нового користувача
    const insertResult = await sql.query(`
      INSERT INTO Users (email, password, full_name, role_id)
      VALUES ('${email}', '${hashedPassword}', '${full_name}', ${role_id})
    `);

    if (insertResult.rowsAffected[0] > 0) {
      const result = await sql.query(`SELECT * FROM Users WHERE email = '${email}'`);
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(500).json({ message: "Створено користувача" });
    }
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Помилка реєстрації");
  }
});
