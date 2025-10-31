// src/lib/userStore.ts
import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  // Tipos de papéis
  export type UserRole = "admin" | "recepcionista" | "camareira";
  
  // Interface do usuário
  export interface User {
    id?: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }
  
  // Nome da coleção no Firestore
  const USERS_COLLECTION = "users";
  
  // 🔹 Retorna todos os usuários
  export async function getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as User),
    }));
  }
  
  // 🔹 Adiciona um novo usuário
  export async function addUser(user: User): Promise<void> {
    await addDoc(collection(db, USERS_COLLECTION), user);
  }
  
  // 🔹 Busca um usuário pelo e-mail e senha (para login)
// 🔹 Busca um usuário pelo e-mail e senha (agora via backend)
export async function findUser(email: string, password: string): Promise<User | null> {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Erro ao autenticar usuário");
    }

    const user = await response.json();
    return user as User;
  } catch (error) {
    console.error("Erro no findUser (backend):", error);
    return null;
  }
}

  // 🔹 Garante que o admin padrão exista (caso contrário cria automaticamente)
  export async function ensureDefaultAdmin() {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", "admin@admin")
    );
    const snapshot = await getDocs(q);
  
    if (snapshot.empty) {
      await addDoc(collection(db, USERS_COLLECTION), {
        name: "Administrador Master",
        email: "admin@admin",
        password: "1234",
        role: "admin",
      });
      console.log("✅ Usuário admin criado automaticamente no Firestore");
    } else {
      console.log("✅ Admin já existe");
    }
  }
  