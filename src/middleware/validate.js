import { celebrate, Modes } from 'celebrate';

/**
 * celebrate з abortEarly: false і Modes.FULL: перевіряються всі поля
 * в усіх сегментах (body, query, params), і клієнт отримує всі помилки
 * валідації одразу, а не лише першу.
 */
export const validate = (schema) =>
  celebrate(schema, { abortEarly: false }, { mode: Modes.FULL });
