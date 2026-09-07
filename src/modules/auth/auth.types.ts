import { Gender } from '../patients/patients.types';

export interface RegisterPatientInput {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
