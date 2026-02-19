import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser {
  name: string;
}

export type UserDocument = IUser & Document;

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
  },
  {
    timestamps: false,
  }
);

const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>('User', UserSchema);

export default User;
