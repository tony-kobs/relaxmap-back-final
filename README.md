# Relax Map API

Бекенд **Природних Мандрів** (RelaxMap): Express 5, MongoDB (Mongoose 9), сесія в httpOnly-куках.

[![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Swagger](https://img.shields.io/badge/Swagger-api--docs-85EA2D?logo=swagger&logoColor=111111)](https://swagger.io)

Публічні шляхи **без** префікса `/api`: `/auth`, `/users`, `/locations`, `/categories`, `/feedbacks`, `/health`. Префікс `/api` додає Next.js у [фронтенді](https://github.com/tony-kobs/relaxmap-front-final).

Локально: порт **4000** (див. `.env.template`). Документація: [`/api-docs`](http://localhost:4000/api-docs), сира специфікація: [`/api-docs.json`](http://localhost:4000/api-docs.json).

Деплой бекенду — з гілки **`dev`**.

## Зміст

1. [Посилання](#посилання)
2. [Команда](#команда)
3. [Стек](#стек)
4. [Маршрути](#маршрути)
5. [Форми відповідей](#форми-відповідей)
6. [Моделі](#моделі)
7. [Локальна база](#локальна-база)
8. [Каталог src](#каталог-src)
9. [Запуск](#запуск)
10. [Env](#env)

## Посилання

| Що | Де |
| --- | --- |
| API на проді (Render) | [relaxmap-back-final.onrender.com](https://relaxmap-back-final.onrender.com/health) |
| Swagger на проді | [relaxmap-back-final.onrender.com/api-docs](https://relaxmap-back-final.onrender.com/api-docs/) |
| OpenAPI JSON | [relaxmap-back-final.onrender.com/api-docs.json](https://relaxmap-back-final.onrender.com/api-docs.json) |
| Сайт (Vercel) | [relaxmap-front-final.vercel.app](https://relaxmap-front-final.vercel.app) |
| Фронтенд-репозиторій | [tony-kobs/relaxmap-front-final](https://github.com/tony-kobs/relaxmap-front-final) |
| Макет | [Figma](https://www.figma.com/design/139uPoMOT1RJ51sirdNQPX/RelaxMap?node-id=6383-168&t=36seQL7y1m6j9bn5-1) |

Сервіс на безкоштовному тарифі Render засинає без запитів, тому перше звернення після паузи може тривати до хвилини.

## Команда

Команда спільна для фронтенду і бекенду.

| Учасник | GitHub | Роль |
| --- | --- | --- |
| Антон Кобись | [tony-kobs](https://github.com/tony-kobs) | Тімлід, бекенд, Header / Footer, вихід |
| Валентин Бурий | [groteskzp](https://github.com/groteskzp) | Каталог: фільтри, сітка локацій, «Показати ще» |
| Христина Білецька | [BiletskaKhristina](https://github.com/BiletskaKhristina) | Профіль: інформація про користувача, порожній стан |
| Андрій Степанюк | [Andrii-Stepaniuk27](https://github.com/Andrii-Stepaniuk27) | Вхід: форма логіну |
| Анна Крочак | [KiraSpace777](https://github.com/KiraSpace777) | Відгуки: слайдер на головній, відгуки на сторінці місця |
| Аліна Овчинникова | [alinakvitochka](https://github.com/alinakvitochka) | Новий відгук: модалка і форма |
| Сергій Човгун | [sergeychovgun](https://github.com/sergeychovgun) | Реєстрація, редагування локації |
| Євгеній Крочак | [Zhenya-77](https://github.com/Zhenya-77) | Створення локації: форма додавання |
| Віктор Матвійчук | [ViktorMatviichuk](https://github.com/ViktorMatviichuk) | Популярні локації: карусель і картка |
| Олександр Павленко | [AlexandrPavlenko-ctrl](https://github.com/AlexandrPavlenko-ctrl) | Сторінка місця: інформація і галерея |
| Сергій Минда | [sergijminda9](https://github.com/sergijminda9) | Перший екран: Hero і переваги |
| Адам Лех | [AdamPershyi](https://github.com/AdamPershyi) | Сесія: модалки підтвердження і підказки входу |

## Стек

| Технологія | Роль |
| --- | --- |
| Express 5 | HTTP, роути монтуються з префіксами (`/auth`, `/users`, …) |
| Mongoose 9 | моделі й MongoDB |
| JWT + cookies | `sessionId`, `accessToken`, `refreshToken` (httpOnly) |
| Celebrate / Joi | валідація query, params і body |
| Multer + Cloudinary | фото локацій і аватар |
| Helmet, CORS | заголовки безпеки і доступ із фронта |
| Pino | HTTP-логи |
| Swagger UI | інтерактивна документація |
| Nodemon / Vitest | dev-перезапуск і тести |

Пароль у відповідях не з’являється (`User.toJSON`). Поле `email` є лише в `/users/me`.

При `login` / `register` старі сесії цього юзера видаляються. У `NODE_ENV=production` куки: `sameSite=none`, `secure=true` (крос-домен Vercel ↔ Render).

## Маршрути

Колонка «Сесія» = middleware `authenticate` (куки `sessionId` + `accessToken`).

Роутери підключаються так: `app.use('/auth', authRoutes)` тощо; у файлах роутів шляхи відносні (`/register`, `/me`, …).

### Auth

| Метод | Шлях | Сесія | Що робить |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | ні | акаунт + куки сесії, `201` |
| `POST` | `/auth/login` | ні | вхід + куки, `200` |
| `POST` | `/auth/logout` | ні | видаляє сесію, чистить куки, `204` |
| `POST` | `/auth/refresh` | ні | нова пара токенів за `refreshToken` |
| `GET` | `/auth/session` | ні | `{ success }`; при потребі тихо рефрешить куки |
| `POST` | `/auth/request-reset-email` | ні | лист із посиланням на скидання |
| `POST` | `/auth/reset-password` | ні | новий пароль за JWT з листа; сесії юзера чистяться |

Обліковий запис: `name` 2–32, унікальний `email` до 64, `password` 8–128.

### Користувачі

| Метод | Шлях | Сесія | Що робить |
| --- | --- | --- | --- |
| `GET` | `/users/me` | так | свій профіль, включно з `email` |
| `PATCH` | `/users/me` | так | `multipart/form-data`: `name` (2–32) і/або файл `avatar` (jpg/png, ≤ 1 МБ) |
| `GET` | `/users/:userId` | ні | публічні `_id`, `name`, `avatar` |
| `GET` | `/users/:userId/locations` | ні | місця автора, пагінація як у каталозі |

Окремого `PATCH /users/me/avatar` **немає** — аватар іде в `PATCH /users/me`.

### Місця

| Метод | Шлях | Сесія | Що робить |
| --- | --- | --- | --- |
| `GET` | `/locations` | ні | список із фільтрами |
| `GET` | `/locations/:locationId` | ні | одна локація; немає id — `404` |
| `POST` | `/locations` | так | створення, `multipart/form-data` |
| `PATCH` | `/locations/:locationId` | так | зміна; лише автор, інакше `403` |

Query списку: `page`, `limit` (1–100), `region` (id), `type` (один id або кілька), `search` по назві, `sort` = `rating` (за замовчуванням) | `popular` | `new`.

Тіло створення / редагування: `name` 3–96, `type` і `region` (id категорії), `description` 20–6000, файли `images` (jpg/png, 1–8 шт.).

### Категорії

| Метод | Шлях | Сесія | Що робить |
| --- | --- | --- | --- |
| `GET` | `/categories/regions` | ні | `{ _id, name, kind: "region" }[]` |
| `GET` | `/categories/types` | ні | `{ _id, name, kind: "type" }[]` |

### Відгуки

| Метод | Шлях | Сесія | Що робить |
| --- | --- | --- | --- |
| `GET` | `/feedbacks` | ні | список відгуків (пагінація) |
| `POST` | `/feedbacks` | так | новий відгук; одразу в списку; перерахунок `rating` і `reviewsCount` локації |
| `DELETE` | `/feedbacks/:feedbackId` | так | видалення свого відгуку; інакше `403`; перерахунок рейтингу |

Модерації / статусів `pending` | `approved` немає (за ТЗ GET + POST; DELETE — власний відгук).

Тіло створення: `{ locationId, userName, rate, description }` — `userName` 2–32, `rate` 1–5, `description` 1–200.

`GET /feedbacks` без `locationId` — стрічка для головної; з `locationId` — відгуки місця (`page`, `limit`).

### Службове

| Метод | Шлях | Сесія | Що робить |
| --- | --- | --- | --- |
| `GET` | `/health` | ні | `{ message: "OK", timestamp }` — процес живий |
| `GET` | `/api-docs` | ні | Swagger UI |
| `GET` | `/api-docs.json` | ні | OpenAPI JSON |

## Форми відповідей

Список місць і відгуків:

```json
{ "data": [], "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
```

Картка місця: `name`, `description`, `images`, `rating`, `reviewsCount`, об’єкти `type` і `region`, `owner` (`_id`, `name`, `avatar`).

Помилки зазвичай: `{ "message": "..." }` (Celebrate / `http-errors` / Multer).

`GET /auth/session`: `{ "success": true | false }` (завжди HTTP 200).

## Моделі

```text
User        name, email, password, avatar
Session     userId, accessToken, refreshToken, терміни дії
Category    name, kind = region | type
Location    name, type, region, description, images[], owner, rating, reviewsCount
Feedback    locationId, owner, userName, rate, description
```

Регіон і тип — одна колекція `Category`, розрізняє поле `kind`. Поля `type`, `region`, `images`, `owner`, `rating` не перейменовувати під сторонні референси.

## Локальна база

```bash
npm run seed
```

Читає JSON з `src/db/data`, піднімає регіони, типи, локації та відгуки. Повторний запуск оновлює ті самі документи (upsert), не плодить дублікати.

## Каталог src

```text
src/
├── server.js                 Express, CORS, Helmet, Swagger, /health, mount роутів
├── config/env.js             fail-fast: MONGO_URL, JWT_* обов’язкові
├── routes/                   відносні шляхи; префікс задає server.js
├── controllers/              auth, users, locations, categories, feedbacks
├── services/auth.js          сесії, куки, refresh
├── models/                   User, Session, Category, Location, Feedback
├── validations/              Celebrate / Joi
├── middleware/               authenticate, multer, logger, 404, помилки
├── docs/openapi.js           специфікація для /api-docs
├── db/connectMongoDB.js
├── db/seed.js
├── templates/                лист скидання пароля
└── utils/                    Cloudinary, SMTP
```

## Запуск

Потрібні Node.js 20+, MongoDB Atlas (або локальна), для фото/листів — Cloudinary і SMTP.

```bash
git clone https://github.com/tony-kobs/relaxmap-back-final.git
cd relaxmap-back-final
npm install
cp .env.template .env
# або скопіюй у .env.local — він має пріоритет над .env
npm run dev
npm run seed
```

Сервер: `http://localhost:4000`.

| Команда | Результат |
| --- | --- |
| `npm run dev` | nodemon |
| `npm start` | `node src/server.js` |
| `npm run seed` | демо-дані в MongoDB |
| `npm test` | Vitest (supertest) |
| `npm run lint` | ESLint по `src` |

Фронт: [relaxmap-front-final](https://github.com/tony-kobs/relaxmap-front-final).

## Env

Сервер і seed вантажать `.env`, потім `.env.local` (override). Обидва файли в `.gitignore`.

Обов’язкові при старті (`src/config/env.js`):

- `MONGO_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Решта — у `.env.template`: `PORT`, `NODE_ENV`, `FRONTEND_URL` (CORS + лінки reset-password), Cloudinary, SMTP.

`FRONTEND_URL` додається в CORS разом із `http://localhost:3000`. Для продакшену вистав `NODE_ENV=production` і реальний URL фронта.
