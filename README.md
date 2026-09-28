# Relax Map API

Сервер **Природних Мандрів**: Express, MongoDB і сесія в httpOnly-куках.

[![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Swagger](https://img.shields.io/badge/Swagger-api--docs-85EA2D?logo=swagger&logoColor=111111)](https://swagger.io)

Публічні шляхи **без** префікса `/api`: `/auth`, `/users`, `/locations`, `/categories`, `/feedbacks`. Префікс додає Next.js у [фронтенді](https://github.com/tony-kobs/relaxmap-front-final). Локально сервер слухає порт **4000**, документація — `/api-docs`.

## Зміст

1. [Стек](#стек)
2. [Маршрути](#маршрути)
3. [Форми відповідей](#форми-відповідей)
4. [Локальна база](#локальна-база)
5. [Каталог src](#каталог-src)
6. [Запуск](#запуск)

## Стек

| Технологія | Роль |
| --- | --- |
| Express 5 | HTTP і маршрути |
| Mongoose 9 | моделі й MongoDB |
| JWT + cookies | `sessionId`, `accessToken`, `refreshToken` |
| Celebrate / Joi | валідація query, params і body |
| Multer + Cloudinary | фото локації й аватар |
| Helmet, CORS | заголовки безпеки і доступ із фронта |
| Pino | HTTP-логи |
| Swagger UI | інтерактивна документація |
| Nodemon | перезапуск у розробці |

Пароль назовні не виходить: `toJSON` у моделі користувача його прибирає. Пошта є лише у відповіді `/users/me`.

## Маршрути

Колонка «Сесія» означає middleware `authenticate`.

### Auth

| Метод | Шлях | Сесія | Що робить |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | ні | створює акаунт і ставить куки |
| `POST` | `/auth/login` | ні | вхід, ті самі куки |
| `POST` | `/auth/logout` | ні | видаляє сесію і чистить куки, `204` |
| `POST` | `/auth/refresh` | ні | нова пара токенів |
| `GET` | `/auth/session` | ні | перевірка поточної сесії |
| `POST` | `/auth/request-reset-email` | ні | лист для скидання пароля |
| `POST` | `/auth/reset-password` | ні | новий пароль за токеном з листа |

Після входу і реєстрації фронт куки не читає. Вони httpOnly.

Обліковий запис: `name` 2–32, унікальний `email` до 64 символів, `password` 8–128.

### Користувачі

| Метод | Шлях | Сесія | Що робить |
| --- | --- | --- | --- |
| `GET` | `/users/me` | так | свій профіль, включно з email |
| `PATCH` | `/users/me` | так | оновлення профілю |
| `PATCH` | `/users/me/avatar` | так | аватар, поле файлу `avatar` |
| `GET` | `/users/:userId` | ні | публічні `_id`, `name`, `avatar` |
| `GET` | `/users/:userId/locations` | ні | місця цієї людини, та сама пагінація, що в каталозі |

### Місця

| Метод | Шлях | Сесія | Що робить |
| --- | --- | --- | --- |
| `GET` | `/locations` | ні | список із фільтрами |
| `GET` | `/locations/:locationId` | ні | одна локація; немає id — `404` |
| `POST` | `/locations` | так | створення, `multipart/form-data` |
| `PATCH` | `/locations/:locationId` | так | зміна; лише автор, інакше `403` |

Query списку: `page`, `limit` (1–100), `region`, `type` (один id або кілька повторів ключа), `search` по назві, `sort` = `rating` (за замовчуванням), `popular` або `new`.

Тіло створення і редагування: `name` 3–96, `type` і `region` як id категорії, `description` 20–6000, файли `images` (jpg/png, до 8 штук). Потрібне хоча б одне фото.

### Категорії і відгуки

| Метод | Шлях | Сесія | Що робить |
| --- | --- | --- | --- |
| `GET` | `/categories/regions` | ні | масив `{ _id, name, kind: "region" }` |
| `GET` | `/categories/types` | ні | масив `{ _id, name, kind: "type" }` |
| `GET` | `/feedbacks` | ні | лише `status: "approved"` |
| `POST` | `/feedbacks` | так | новий відгук зі статусом `pending` |
| `GET` | `/health` | ні | перевірка, що процес живий |

`GET /feedbacks` без `locationId` — стрічка для головної. З `locationId` — відгуки місця, є `page` і `limit`. Тіло відгуку: `locationId`, `userName` 2–32, `rate` 1–5, `description` 1–200. Поки відгук не схвалений, у публічний список він не потрапляє.

## Форми відповідей

Список місць і відгуків:

```json
{ "data": [], "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
```

Картка місця в `data` містить `name`, `description`, `images`, `rating`, `reviewsCount`, об'єкти `type` і `region`, а також `owner` з `_id`, `name` і `avatar`.

```text
User        name, email, password, avatar
Session     userId, accessToken, refreshToken, терміни дії
Category    name, kind = region | type
Location    name, type, region, description, images[], owner, rating, reviewsCount
Feedback    locationId, owner, userName, rate, description, status = pending | approved
```

Регіон і тип — це одна колекція `Category`, їх розрізняє поле `kind`.

## Локальна база

```bash
npm run seed
```

Команда читає JSON у `src/db/data` і піднімає регіони, типи місць, локації та вже схвалені відгуки. Повторний запуск оновлює ті самі документи, а не плодить дублікати.

## Каталог src

```text
src/
├── server.js                 Express, CORS, Helmet, Swagger, підключення роутів
├── routes/                   шляхи без префікса /api
├── controllers/              хендлери auth, users, locations, categories, feedbacks
├── services/auth.js          куки сесії
├── models/                   User, Session, Category, Location, Feedback
├── validations/              схеми Celebrate
├── middleware/               authenticate, multer, logger, 404, помилки
├── docs/openapi.js           специфікація для /api-docs
├── db/connectMongoDB.js
├── db/seed.js
└── utils/                    Cloudinary, пошта, заглушка 501
```

## Запуск

Потрібні Node.js 20+, MongoDB і, для фото та листів, акаунти Cloudinary та SMTP.

```bash
git clone https://github.com/tony-kobs/relaxmap-back-final.git
cd relaxmap-back-final
npm install
cp .env.template .env
npm run dev
npm run seed
```

Сервер: `http://localhost:4000`. Swagger: `http://localhost:4000/api-docs`. Сира специфікація: `http://localhost:4000/api-docs.json`.

```env
PORT=4000
MONGO_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/relaxmap

JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret

FRONTEND_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

`FRONTEND_URL` потрапляє в CORS разом із `http://localhost:3000`.

| Команда | Результат |
| --- | --- |
| `npm run dev` | nodemon |
| `npm start` | `node src/server.js` |
| `npm run seed` | демо-дані в MongoDB |
| `npm run lint` | ESLint по `src` |

Клієнт, який ходить у це API через власний проксі: [relaxmap-front-final](https://github.com/tony-kobs/relaxmap-front-final).
