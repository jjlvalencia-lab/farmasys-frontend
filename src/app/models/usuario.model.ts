export interface Usuario {
  id?: number;
  username: string;
  rol: string;
  nombreCompleto?: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface AuthPayload {
  sub: number;
  username: string;
  rol: string;
  exp: number;
}
