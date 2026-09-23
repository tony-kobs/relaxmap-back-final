import { model, Schema } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, trim: true, required: true, minlength: 2, maxlength: 32 },
    email: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    avatar: {
      type: String,
      required: false,
      default: '',
    },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = model('User', userSchema);
