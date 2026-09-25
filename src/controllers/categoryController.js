import { Category } from '../models/category.js';

const getByKind = (kind) => async (req, res) => {
  const categories = await Category.find({ kind }, '_id name kind')
    .collation({ locale: 'uk' })
    .sort({ name: 1 })
    .lean();

  res.status(200).json(categories);
};

export const getRegions = getByKind('region');
export const getTypes = getByKind('type');
