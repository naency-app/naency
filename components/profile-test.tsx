"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export default function ProfileTest() {



  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Perfil do Usuário (Protegido)</CardTitle>

        </div>
      </CardHeader>
      <CardContent>



      </CardContent>
    </Card>
  )
} 