import { model, Schema } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 64 },
    kind: { type: String, required: true, enum: ['region', 'type'] },
  },
  { timestamps: true, versionKey: false },
);

categorySchema.index({ kind: 1, name: 1 }, { unique: true });

export const Category = model('Category', categorySchema);
