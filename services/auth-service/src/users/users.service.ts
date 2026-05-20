import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './user.schema';

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash?: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
}

interface UpdateSettingsInput {
  language?: 'vi' | 'en';
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
  reduceMotion?: boolean;
  disableConfetti?: boolean;
  textScale?: number;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async createUser(input: CreateUserInput): Promise<UserDocument> {
    return this.userModel.create({
      ...input,
      email: input.email.toLowerCase(),
      role: 'user',
      isActive: true,
      dietPreferences: { type: 'normal', allergies: [] },
      settings: {},
    });
  }

  async updateRefreshToken(userId: string, refreshTokenHash: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash }).exec();
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: null }).exec();
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { avatarUrl }, { new: true })
      .exec();
  }

  async updateSettings(userId: string, settings: UpdateSettingsInput): Promise<UserDocument | null> {
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        updateData[`settings.${key}`] = value;
      }
    }
    return this.userModel
      .findByIdAndUpdate(userId, { $set: updateData }, { new: true })
      .exec();
  }

  async updateName(userId: string, name: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { name }, { new: true })
      .exec();
  }

  async updateProfile(userId: string, updateData: Record<string, any>): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $set: updateData }).exec();
  }
}
