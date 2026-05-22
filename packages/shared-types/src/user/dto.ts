import { DietType } from '../common/enums';

export interface UpdateProfileDto {
  dietPreferences?: {
    type?: DietType;
    allergies?: string[];
  };
  allergies?: string[];
  avatar?: string;
  name?: string;
}

export interface UpdateSettingsDto {
  swipeModeEnabled?: boolean;
}
