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

    if (type === "projects") {
      const projectsData = await fetchData(`projects/${user.user_id}`);

      if (!projectsData) {
        document.getElementById("content").innerHTML =
          "<p>Не вдалося завантажити дані про проекти.</p>";
        return;
      }
      tableHTML = `<table>
  <tr>
    <th>ID</th><th>Назва проекту</th><th>Опис</th><th>Клієнт</th><th>Дата початку</th><th>Дата завершення</th><th>Статус</th>
  </tr>`;

      projectsData.forEach((project) => {
        // Форматуємо дату до 'YYYY-MM-DD'
        const formattedDateStart = new Date(project.start_date)
          .toISOString()
          .split("T")[0];
        const formattedDateEnd = new Date(project.end_date)
          .toISOString()
          .split("T")[0];
        tableHTML += `<tr>
    <td>${project.project_id}</td>
    <td>${project.name}</td>
    <td>${project.description}</td>
    <td>${project.client_name}</td>
    <td>${formattedDateStart}</td>
    <td>${formattedDateEnd}</td>
    <td>${project.status}</td>
  </tr>`;
      });
    } else if (type === "projectadd") {
      openModal(); // Відкриваємо модальне вікно
    } else if (type === "work_submissions") {
      const work_submissionsData = await fetchData(
        `work_submissions/${user.user_id}`
      );
      tableHTML = `<table>
    <tr>
        <th>ID</th><th>Проект</th><th>Дата здачі роботи</th><th>Виконавець</th><th>Статус</th><th>Коментар</th>
    </tr>`;
      work_submissionsData.forEach((work_submission) => {
        const formattedDate = new Date(work_submission.submission_date)
          .toISOString()
          .split("T")[0];
        tableHTML += `<tr>
        <td>${work_submission.submission_id}</td>
        <td>${work_submission.project_name}</td>
        <td>${formattedDate}</td>

        <td>${work_submission.developer_name}</td>
        <td>${work_submission.status}</td>
        <td>${work_submission.comment}</td>
    </tr>`;
      });
    }
    tableHTML += "</table>";
    document.getElementById("content").innerHTML = tableHTML;
  }

  //-----------------------------------------------------------

  function openModal() {
    document.getElementById("modal").style.display = "block";
  }

  function closeModal() {
    document.getElementById("modal").style.display = "none";
  }

  async function createProject() {
    // Отримуємо значення з полів форми
    const projectName = document.getElementById("projectName").value;
    const description = document.getElementById("description").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const status = "in development";

    // Отримуємо ID користувача з LocalStorage
    const userJson = localStorage.getItem("user");
    const user = JSON.parse(userJson);

    try {
      const response = await fetch("http://localhost:3000/projectsadd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: user.user_id,
          name: projectName,
          description,
          start_date: startDate,
          end_date: endDate,
          status,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Проект створено успішно");
        closeModal(); // Закриваємо модальне вікно
        showTable("projects"); // Перезавантажуємо список проектів
      } else {
        alert(result.message || "Помилка створення проекту");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Не вдалося створити проект");
    }
  }