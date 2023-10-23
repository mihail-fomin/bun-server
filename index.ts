import { Elysia, t } from 'elysia'
import { cors } from "@elysiajs/cors";
import { Database } from "bun:sqlite";

interface UpdateResult {
  affectedRows: number;
}

const DB = new Database("mydb.sqlite", { create: true });

DB.query(
  `CREATE TABLE IF NOT EXISTS MESSAGES(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT
    );`
).run();

const PORT = Bun.env.PORT || 8000;

const app = new Elysia()
app.use(cors());



app.get("/", (context) => {
  const query = DB.query(`SELECT * FROM MESSAGES;`);
  const result = query.all();
  console.log(result);
  context.set.status = 200;

  return new Response(JSON.stringify({ messages: result }), {
    headers: { "Content-Type": "application/json" },
  });
});

app.post(
  "/add",
  ({ body }) => {
    const message = body?.message;
    console.log(message);
    const query = DB.query(`INSERT INTO MESSAGES (message) VALUES (?1)`);
    query.run(message);
    return new Response(JSON.stringify({ message: "Added" }), {
      headers: { "Content-Type": "application/json" },
    });
  },
  {
    body: t.Object({
      message: t.String(),
    })
  });

app.put(
  "/edit/:id", // :id - это параметр, который будет принимать значение из адресной строки
  ({ body, params }) => {
    const id = params.id; // Извлечение id из параметров адресной строки
    const message = body.message;

    try {
      // Подготовьте SQL-запрос для обновления сообщения
      const updateQuery = DB.query("UPDATE MESSAGES SET message = ?1 WHERE id = ?2");
      updateQuery.run(message, id);

      // Подготовьте SQL-запрос для подсчета обновленных строк
      const countQuery = DB.query("SELECT changes() AS affectedRows");
      const result = countQuery.get() as UpdateResult

      if (result && result.affectedRows > 0) {
        return new Response(JSON.stringify({ message: "Updated" }), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ message: "Not Found" }), {
          headers: { "Content-Type": "application/json" },
          status: 404,
        });
      }
    } catch (error) {
      console.error("Произошла ошибка:", error);
      return new Response(JSON.stringify({ message: "Ошибка при обновлении" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
  },
  {
    body: t.Object({
      message: t.String(),
    })
  }
);

app.delete(
  "/delete/:id", // :id - это параметр, который будет принимать значение из адресной строки
  ({ params }) => {
    const id = params.id; // Извлечение id из параметров адресной строки

    try {
      // Подготовьте SQL-запрос для удаления записи по id
      const deleteQuery = DB.query("DELETE FROM MESSAGES WHERE id = ?1");
      deleteQuery.run(id); // Выполните DELETE-запрос

      // Подготовьте SQL-запрос для проверки измененных строк
      const countQuery = DB.query("SELECT changes() AS affectedRows");
      const result = countQuery.get() as UpdateResult

      if (result && result.affectedRows > 0) {
        return new Response(JSON.stringify({ message: "Deleted" }), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ message: "Not Found" }), {
          headers: { "Content-Type": "application/json" },
          status: 404,
        });
      }
    } catch (error) {
      console.error("Произошла ошибка:", error);
      return new Response(JSON.stringify({ message: "Ошибка при удалении" }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

  })

app.listen(Number(PORT));

console.log(`🦊 Elysia is running at on port ${app.server?.port}...`)
