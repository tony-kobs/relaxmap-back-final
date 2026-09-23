import { model, Schema } from 'mongoose';

const locationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 96 },
    type: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    region: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 6000,
    },
    images: {
      type: [String],
      required: true,
      validate: [(value) => value.length > 0, 'At least one image is required'],
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

export const Location = model('Location', locationSchema);
