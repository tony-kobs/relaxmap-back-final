import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectMongoDB } from './connectMongoDB.js';
import { Category } from '../models/category.js';
import { Feedback } from '../models/feedback.js';
import { Location } from '../models/location.js';
import { User } from '../models/user.js';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'data',
);

const load = (fileName) =>
  JSON.parse(readFileSync(path.join(root, fileName), 'utf8'));

const oid = (value) => value?.$oid ?? String(value);

const users = load('relax_map_db.users.json');
const regions = load('relax_map_db.regions.json');
const types = load('relax_map_db.location_types.json');
const locations = load('relax_map_db.locations.json');
const feedbacks = load('relax_map_db.feedbacks.json');

await connectMongoDB();

for (const user of users) {
  await User.findOneAndUpdate(
    { _id: oid(user._id) },
    { name: user.name, avatar: user.avatarUrl },
    { upsert: true },
  );
}

for (const region of regions) {
  await Category.findOneAndUpdate(
    { _id: oid(region._id) },
    { name: region.region, kind: 'region' },
    { upsert: true },
  );
}

for (const type of types) {
  await Category.findOneAndUpdate(
    { _id: oid(type._id) },
    { name: type.type, kind: 'type' },
    { upsert: true },
  );
}

const regionIdBySlug = new Map(
  regions.map((region) => [region.slug, oid(region._id)]),
);
const typeIdBySlug = new Map(
  types.map((type) => [type.slug, oid(type._id)]),
);

const locationByFeedbackId = new Map();

for (const location of locations) {
  const regionId = regionIdBySlug.get(location.region);
  const typeId = typeIdBySlug.get(location.locationType);

  if (!regionId || !typeId) {
    throw new Error(`Немає категорії для локації ${location.name}`);
  }

  const feedbackIds = (location.feedbacksId ?? []).map(oid);

  await Location.findOneAndUpdate(
    { _id: oid(location._id) },
    {
      name: location.name,
      description: location.description,
      images: [location.image],
      type: typeId,
      region: regionId,
      owner: oid(location.ownerId),
      rating: location.rate,
      reviewsCount: feedbackIds.length,
    },
    { upsert: true },
  );

  for (const feedbackId of feedbackIds) {
    locationByFeedbackId.set(feedbackId, {
      locationId: oid(location._id),
      owner: oid(location.ownerId),
    });
  }
}

for (const feedback of feedbacks) {
  const link = locationByFeedbackId.get(oid(feedback._id));

  if (!link) {
    throw new Error(`Відгук ${oid(feedback._id)} не прив'язаний до локації`);
  }

  await Feedback.findOneAndUpdate(
    { _id: oid(feedback._id) },
    {
      locationId: link.locationId,
      owner: link.owner,
      userName: feedback.userName,
      rate: feedback.rate,
      description: feedback.description,
      status: 'approved',
    },
    { upsert: true },
  );
}

console.log('Seed completed', {
  users: users.length,
  regions: regions.length,
  types: types.length,
  locations: locations.length,
  feedbacks: feedbacks.length,
});

await mongoose.disconnect();