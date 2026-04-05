import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class DietPreferences {
  @Prop({
    type: String,
    enum: ['normal', 'vegetarian', 'vegan', 'keto', 'clean'],
    default: 'normal',
  })
  type!: 'normal' | 'vegetarian' | 'vegan' | 'keto' | 'clean';

  @Prop({ type: [String], default: [] })
  allergies!: string[];
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: String, default: null })
  refreshTokenHash?: string | null;

  @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
  role!: 'user' | 'admin';

  @Prop({ type: DietPreferences, default: () => ({ type: 'normal', allergies: [] }) })
  dietPreferences!: DietPreferences;

  @Prop()
  avatar?: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
