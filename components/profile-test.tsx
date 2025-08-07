"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import goApiClient, { ProfileResponse } from "@/lib/go-api-client"
import { authClient } from "@/lib/auth-client"

export default function ProfileTest() {
  const [profile, setProfile] = useState<ProfileResponse['data'] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    data: session,
    isPending,
    error: authError
  } = authClient.useSession()

  const token = session?.session?.token

  const fetchProfile = async () => {
    if (!token) {
      setError("Token de autenticação não disponível")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await goApiClient.getProfile()

      if (response.error) {
        setError(response.error)
        return
      }

      if (response.data) {
        setProfile(response.data.data)
      }
    } catch {
      setError("Erro ao carregar perfil")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perfil do Usuário (Protegido)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600">Carregando sessão...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (authError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perfil do Usuário (Protegido)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">Erro de autenticação</p>
            <p className="text-sm text-gray-500">{authError.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Perfil do Usuário (Protegido)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">Não autenticado</p>
            <p className="text-sm text-gray-500">
              Faça login para acessar esta funcionalidade
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Perfil do Usuário (Protegido)</CardTitle>
          <Button onClick={fetchProfile} disabled={loading} variant="outline" size="sm">
            {loading ? "Carregando..." : "Buscar Perfil"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Certifique-se de estar logado para acessar esta funcionalidade
            </p>
          </div>
        )}

        {profile && (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-semibold text-lg">{profile.name}</h3>
                  {profile.emailVerified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Email Verificado
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-3">{profile.email}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">ID do Usuário</p>
                    <p className="text-gray-600 font-mono text-xs">{profile.sub}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Emissor</p>
                    <p className="text-gray-600 text-xs">{profile.issuer}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Audience</p>
                    <p className="text-gray-600 text-xs">{profile.audience}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Expira em</p>
                    <p className="text-gray-600 text-xs">{formatDate(profile.expires_at)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Emitido em</p>
                    <p className="text-gray-600 text-xs">{formatDate(profile.issued_at)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Criado em</p>
                    <p className="text-gray-600 text-xs">{profile.createdAt}</p>
                  </div>
                </div>

                {profile.image && (
                  <div className="mt-3">
                    <p className="font-medium text-gray-700 mb-1">Imagem</p>
                    <img
                      src={profile.image}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!profile && !error && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Clique em "Buscar Perfil" para carregar seus dados</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 