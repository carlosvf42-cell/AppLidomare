export const DEMO_USER = {
  email: "demo@lidomare.com",
  password: "lidomare123",
};

export function validateCredentials(email: string, password: string): boolean {
  return email === DEMO_USER.email && password === DEMO_USER.password;
}
