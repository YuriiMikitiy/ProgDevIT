async function fetchData(endpoint) {
    try {
      const response = await fetch(`http://localhost:3000/${endpoint}`);
      return await response.json();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  async function showTable(type) {
    let tableHTML = "";

    const userJson = localStorage.getItem("user");
    console.log(userJson);
    console.log(userJson.user_id);
    const user = JSON.parse(userJson);

    if (type === "tasks") {
      const tasksData = await fetchData(`tasks/${user.user_id}`);
      if (!tasksData) {
        document.getElementById("content").innerHTML =
          "<p>Не вдалося завантажити дані про задачі.</p>";
        return;
      }
      tableHTML = `<table>
    <tr>
        <th>ID</th><th>Проект</th><th>Назва</th><th>Опис</th><th>Виконавець</th><th>Дата завершення</th><th>Статус</th><th>Пріоритет</th>
    </tr>`;
      tasksData.forEach((task) => {
        const formattedDate = new Date(task.due_date)
          .toISOString()
          .split("T")[0];
        tableHTML += `<tr>
        <td>${task.task_id}</td>
        <td>${task.project_id}</td>
        <td>${task.name}</td>
        <td>${task.description}</td>
        <td>${task.assigned_to_name}</td>
        <td>${formattedDate}</td>
        <td>${task.status}</td>
        <td>${task.priority}</td>
    </tr>`;
      });
    } else if (type === "submissionadd") {
      openModal(); // Відкриваємо модальне вікно для додавання звіту
    } else if (type === "systems") {
      const systemsData = await fetchData(`systems/${user.user_id}`);
      if (!systemsData) {
        document.getElementById("content").innerHTML =
          "<p>Не вдалося завантажити дані про системи.</p>";
        return;
      }
      tableHTML = `<table>
    <tr>
        <th>ID</th><th>Проект</th><th>Дата</th><th>Опис</th><th>Виконавець</th><th>Статус</th>
    </tr>`;
      systemsData.forEach((system) => {
        // Форматуємо дату до 'YYYY-MM-DD'
        const formattedDate = new Date(system.date)
          .toISOString()
          .split("T")[0];
        tableHTML += `<tr>
        <td>${system.maintenance_id}</td>
        <td>${system.project_name}</td>
        <td>${formattedDate}</td>
        <td>${system.description}</td>
        <td>${system.developer_name || "Не призначено"}</td>
        <td>${system.status}</td>
    </tr>`;
      });
    }
    tableHTML += "</table>";
    document.getElementById("content").innerHTML = tableHTML;
  }

  //---------------------------------------

  function openModal() {
    document.getElementById("submissionModal").style.display = "block";
  }

  function closeModal() {
    document.getElementById("submissionModal").style.display = "none";
  }

  async function createSubmission() {
    console.log("Стаорення запиту");

    const projectId = document.getElementById("projectId").value;
    // Отримуємо сьогоднішню дату
    const today = new Date();
    // Форматуємо дату як YYYY-MM-DD
    const submissionDate = today.toISOString().split("T")[0];
    // Встановлюємо значення в елементі input з ID 'submissionDate'
    const status = "on inspection";
    const comment = document.getElementById("comment").value;

    // Отримуємо ID розробника з LocalStorage
    const userJson = localStorage.getItem("user");
    const user = JSON.parse(userJson);

    try {
      const response = await fetch(
        "http://localhost:3000/work_submissionsadd",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: projectId,
            developer_id: user.user_id,
            submission_date: submissionDate,
            status,
            comment,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert("Звіт створено успішно");
        closeModal(); // Закриваємо модальне вікно
        showTable("tasks"); // Оновлюємо вміст, щоб відобразити новий звіт
      } else {
        alert(result.message || "Помилка створення звіту");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Не вдалося створити звіт");
    }
  }