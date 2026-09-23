import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectMongoDB } from './connectMongoDB.js';
import { Category } from '../models/category.js';
import { Feedback } from '../models/feedback.js';
import { Location } from '../models/location.js';
import { User } from '../models/user.js';

const regions = [
  'Київщина',
  'Львівщина',
  'Одещина',
  'Закарпаття',
  'Івано-Франківщина',
  'Черкащина',
];

const types = ['Озеро', 'Гора', 'Водоспад', 'Ліс', 'Пляж', 'Каньйон'];

const image = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

await connectMongoDB();

const regionDocs = [];
for (const name of regions) {
  regionDocs.push(
    await Category.findOneAndUpdate(
      { name, kind: 'region' },
      { name, kind: 'region' },
      { upsert: true, new: true },
    ),
  );
}

const typeDocs = [];
for (const name of types) {
  typeDocs.push(
    await Category.findOneAndUpdate(
      { name, kind: 'type' },
      { name, kind: 'type' },
      { upsert: true, new: true },
    ),
  );
}

const password = await bcrypt.hash('DemoPass1', 10);
const owner = await User.findOneAndUpdate(
  { email: 'demo@relaxmap.local' },
  { name: 'Олена Мандрівна', email: 'demo@relaxmap.local', password },
  { upsert: true, new: true },
);

const places = [
  ['Синевир', 'Озеро в серці Карпат, до якого ведуть марковані стежки.', 0, 0],
  ['Шипіт', 'Водоспад після дощів стає гучним і широким.', 1, 2],
  ['Буцький каньйон', 'Скелі і поріг річки, зручне місце на півдня.', 5, 5],
  ['Трахтемирів', 'Пагорби над Дніпром з видами на заплаву.', 0, 3],
];

for (const [name, description, regionIndex, typeIndex] of places) {
  const location = await Location.findOneAndUpdate(
    { name },
    {
      name,
      description: `${description} Тут тихо вранці і людно у вихідні, тож приїжджай рано.`,
      type: typeDocs[typeIndex]._id,
      region: regionDocs[regionIndex]._id,
      images: [image],
      owner: owner._id,
      rating: 5,
      reviewsCount: 1,
    },
    { upsert: true, new: true },
  );

  await Feedback.findOneAndUpdate(
    { locationId: location._id, userName: 'Ігор' },
    {
      locationId: location._id,
      owner: owner._id,
      userName: 'Ігор',
      rate: 5,
      description: 'Варто їхати заради тиші і виду.',
      status: 'approved',
    },
    { upsert: true, new: true },
  );
}

console.log('Seed completed');
await mongoose.disconnect();
