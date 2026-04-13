"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateCredentials } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Completa todos los campos." };
  }

  if (!validateCredentials(email, password)) {
    return { error: "Email o contraseña incorrectos." };
  }

  const cookieStore = await cookies();
  cookieStore.set("lidomare-auth", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("lidomare-auth");
  redirect("/login");
}
