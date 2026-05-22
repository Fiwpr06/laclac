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

@Schema({ _id: false })
export class UserSettings {
  @Prop({ type: String, enum: ['vi', 'en'], default: 'vi' })
  language!: 'vi' | 'en';

  @Prop({ default: true })
  soundEnabled!: boolean;

  @Prop({ default: true })
  hapticEnabled!: boolean;

  @Prop({ default: false })
  reduceMotion!: boolean;

  @Prop({ default: false })
  disableConfetti!: boolean;

  @Prop({ default: 1 })
  textScale!: number;

  @Prop({ default: false })
  swipeModeEnabled!: boolean;
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: String, default: null })
  passwordHash?: string | null;

  @Prop({ type: String, default: null })
  googleId?: string | null;

  @Prop({ type: String, default: null })
  refreshTokenHash?: string | null;

  @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
  role!: 'user' | 'admin';

  @Prop({ type: DietPreferences, default: () => ({ type: 'normal', allergies: [] }) })
  dietPreferences!: DietPreferences;

  @Prop({ type: String, default: null })
  avatarUrl?: string | null;

  @Prop({ type: UserSettings, default: () => ({}) })
  settings!: UserSettings;

  @Prop({ default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
