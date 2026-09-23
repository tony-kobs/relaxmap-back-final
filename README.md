# Природні Мандри — backend

Express + MongoDB API для RelaxMap. Публічний контракт для фронта — маршрути без префікса `/api` (`/auth`, `/locations`, `/categories`, `/feedbacks`, `/users`). Префікс `/api` додає Next.js.

## Запуск

```bash
npm install
cp .env.template .env
npm run dev
npm run seed
```

Сервер: `http://localhost:4000`. Swagger: `http://localhost:4000/api-docs`.

Розклад задач і проміжний дедлайн: `../TASKS.md`.
