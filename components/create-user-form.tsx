"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"

export default function CreateUserForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!")
      setName("")
      setEmail("")
      // Invalida o cache para atualizar a lista
      utils.user.getAll.invalidate()
    },
    onError: (error) => {
      toast.error(`Erro ao criar usuário: ${error.message}`)
    },
  })

  const utils = trpc.useUtils()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createUser.mutate({ name, email })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Novo Usuário</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do usuário"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite o email do usuário"
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={createUser.isPending}
            className="w-full"
          >
            {createUser.isPending ? "Criando..." : "Criar Usuário"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
