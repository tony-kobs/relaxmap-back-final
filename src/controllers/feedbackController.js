import { Feedback } from '../models/feedback.js';
import createHttpError from 'http-errors';

// ВИКОРИСТОВУЄМО ЧИСТИЙ ІМПОРТ (Bare Import):
// Це реєструє схеми іншого розробника в пам'яті Mongoose, та виправляє помилку 500 у Postman,
// і при цьому лінтер ESLint НЕ видасть помилку про невикористані змінні!
import '../models/location.js';
import '../models/user.js';

// === КОНФІГУРАЦІЙНІ КОНСТАНТИ (Стандарти чистого коду та розробки) ===
const FEEDBACK_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT_LOCATION: 10, // Кількість відгуків для відображення на сторінці конкретного місця відпочинку
  HOMEPAGE_LIMIT: 6, // Суворе обмеження кількості відгуків для слайдера на Головній сторінці
  DEFAULT_STATUS: 'approved', // Відображати лише ті відгуки, які були успішно перевірені та схвалені модератором
  SORT_ORDER: { createdAt: -1 }, // Сортування списку: спочатку показувати найновіші додані відгуки
  PARSE_INT_RADIX: 10, // Змінна для функції parseInt(), яка вказує комп'ютеру, що ми виводимо значення у десятковій системі числення (основа 10)
};

/**
 * GET /feedbacks
 * Отримання списку відгуків з бази даних (Публічний ендпоінт)*/
// --------------------------------------------------------------
export const getFeedbacks = async (req, res, next) => {
  try {
    const { locationId, page, limit } = req.query;

    // Встановлюємо початковий фільтр для вибірки, використовуючи константу FEEDBACK_CONFIG.DEFAULT_STATUS
    const filter = { status: FEEDBACK_CONFIG.DEFAULT_STATUS };

    // КРОК 1: Обчислюємо ліміт (кількість відгуків для поточного запиту)
    // Якщо у параметрах запиту передано ідентифікатор місця відпочинку (locationId):
    // Ми трансформуємо змінну limit у число за допомогою константи FEEDBACK_CONFIG.PARSE_INT_RADIX.
    // Якщо значення limit відсутнє, підставляємо константу FEEDBACK_CONFIG.DEFAULT_LIMIT_LOCATION.
    // Якщо ідентифікатора місця відпочинку немає (запит для Головної сторінки):
    // Встановлюємо фіксоване обмеження, яке зберігає константа FEEDBACK_CONFIG.HOMEPAGE_LIMIT.
    const currentLimit = locationId
      ? parseInt(
          limit || FEEDBACK_CONFIG.DEFAULT_LIMIT_LOCATION,
          FEEDBACK_CONFIG.PARSE_INT_RADIX,
        )
      : FEEDBACK_CONFIG.HOMEPAGE_LIMIT;

    // КРОК 2: Визначаємо поточну сторінку для відображення списку відгуків
    // Трансформуємо змінну page у число за допомогою константи FEEDBACK_CONFIG.PARSE_INT_RADIX.
    // Якщо значення page не передано з фронтенду, використовуємо значення константи FEEDBACK_CONFIG.DEFAULT_PAGE.
    const currentPage = parseInt(
      page || FEEDBACK_CONFIG.DEFAULT_PAGE,
      FEEDBACK_CONFIG.PARSE_INT_RADIX,
    );

    // КРОК 3: Математично розраховуємо кількість елементів, які база даних має пропустити
    // Від значення змінної currentPage віднімаємо одиницю, а отриманий результат множимо на значення змінної currentLimit
    const skip = (currentPage - 1) * currentLimit;

    // КРОК 4: Додаткове динамічне налаштування фільтрації пошуку
    // Якщо змінна locationId містить дані, додаємо цю властивість в об'єкт filter, щоб знайти відгуки лише для обраного місця
    if (locationId) {
      filter.locationId = locationId;
    }

    // Виконуємо запити до бази даних паралельно. Назви полів підтягування (locationId, owner) беремо з власної моделі Feedback
    const [feedbacks, total] = await Promise.all([
      Feedback.find(filter)
        .sort(FEEDBACK_CONFIG.SORT_ORDER)
        .skip(skip)
        .limit(currentLimit)
        // Вказуємо назву моделі явно через об'єкт конфігурації
        .populate({
          path: 'locationId',
          model: 'Location', // Передаємо назву моделі як рядок. Mongoose підтягне її без прямого імпорту файлу!
          select: 'title type region', // Поля, які необхідно повернути фронтенду
        })
        .populate('owner', 'name avatar'),
      Feedback.countDocuments(filter),
    ]);

    // Розраховуємо загальну кількість сторінок, ділячи значення змінної total на значення змінної currentLimit
    const totalPages = Math.ceil(total / currentLimit);

    // Форма відповіді суворо відповідає Технічному завданню: { data, page, limit, total, totalPages }
    res.status(200).json({
      status: 'success',
      code: 200,
      data: feedbacks,
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /feedbacks
 * Створення нового відгуку (Приватний ендпоінт) */
// --------------------------------------------------------------
export const createFeedback = async (req, res, next) => {
  try {
    // Зберігаємо ідентифікатор автора відгуку у змінну ownerId, отримуючи її безпосередньо з об'єкта req.user._id
    const ownerId = req.user._id;

    // Створюємо новий документ відгуку в базі даних MongoDB на основі об'єкта req.body та додаємо туди змінну ownerId
    // Поле status автоматично набуде значення 'pending' (на модерації) завдяки початковим налаштуванням схеми Mongoose
    const newFeedback = await Feedback.create({
      ...req.body,
      owner: ownerId,
    });

    // Повертаємо успішну відповідь зі статусом 201 згідно з вимогами Технічного завдання
    res.status(201).json({
      status: 'success',
      code: 201,
      data: {
        feedback: newFeedback,
      },
    });
  } catch (error) {
    // Якщо база даних повертає помилку через некоректні ідентифікатори, перехоплюємо її та викликаємо функцію createHttpError
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return next(createHttpError(404, 'Location not found'));
    }
    next(error);
  }
};
