"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { User } from "better-auth"

// Configure o axios para incluir credenciais e headers corretos
const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

export default function UsersList() {

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  console.log(users);
  useEffect(() => {
    fetch("/api/users") // <-- chama o proxy, não direto o Go
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setUsers(data); // no Go o handler retorna { "data": [...] }
      })
      .catch((err) => {
        console.error("Erro ao buscar usuários:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lista de Usuários</CardTitle>

        </div>
      </CardHeader>
      <CardContent>
        {/* {userslength === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 mb-4">
              Total de usuários: {users.length}
            </div>
            <div className="grid gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        {user.emailVerified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Verificado
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{user.email}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Criado em: {formatDate(user?.createdAt?.toISOString())}</p>
                        <p>Atualizado em: {formatDate(user?.updatedAt?.toISOString())}</p>
                        {user.image && (
                          <p>Imagem: {user.image}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">
                      ID: {user.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}
      </CardContent>
    </Card>
  )
} 