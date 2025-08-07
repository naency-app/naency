import authClient from "./auth-client"
import { decodeJwt } from "jose"

const GO_API_URL = process.env.NEXT_PUBLIC_GO_API_URL || "http://localhost:8080"

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  status: number
}

export interface UserProfile {
  id: string
  email: string
  name: string
  emailVerified?: boolean
  image?: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthVerifyResponse {
  valid: boolean
  userId?: string
  email?: string
}

export interface DBUser {
  id: string
  name: string
  email: string
  email_verified: boolean
  image?: string
  created_at: string
  updated_at: string
}

export interface UsersResponse {
  status: string
  users: DBUser[]
  count: number
}

export interface ProfileResponse {
  message: string
  data: {
    sub: string
    email: string
    name: string
    emailVerified: boolean
    image: string
    createdAt: string
    updatedAt: string
    issuer: string
    audience: string
    expires_at: number
    issued_at: number
  }
}

class GoApiClient {
  private baseUrl: string
  private cachedToken: string | null

  constructor(baseUrl: string = GO_API_URL) {
    this.baseUrl = baseUrl
    this.cachedToken = null
  }

  private isTokenValid(): boolean {
    if (!this.cachedToken) {
      return false
    }

    const jwt = decodeJwt(this.cachedToken)
    if (!jwt.exp) {
      return false
    }

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    return jwt.exp > currentTimeInSeconds + 10
  }

  private async getToken(): Promise<string | null> {
    if (this.isTokenValid()) {
      return this.cachedToken
    }

    const token = await authClient.token().then(x => x.data?.token) || null
    console.log(token)
    this.cachedToken = token

    return token
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getToken()

      // Send request
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: data.message || `API Error: ${response.status} ${response.statusText}`,
          status: response.status,
        }
      }

      return {
        data,
        status: response.status,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error occurred",
        status: 0,
      }
    }
  }

  // Endpoint protegido - requer autenticação
  async getProfile(): Promise<ApiResponse<ProfileResponse>> {
    const token = await this.getToken()
    return this.request("/api/v1/profile", {
      method: "GET",
    })
  }

  // Endpoints não protegidos - não requerem autenticação
  async getAllUsers(): Promise<ApiResponse<UsersResponse>> {
    return this.request("/api/v1/users", {
      method: "GET",
    })
  }

  async getUser(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/users/${id}`, {
      method: "GET",
    })
  }

  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.request("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async updateUser(id: string, userData: any): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/users/${id}`, {
      method: "DELETE",
    })
  }

  // Métodos legados para compatibilidade
  async verifyAuth(): Promise<ApiResponse<AuthVerifyResponse>> {
    return this.request("/api/auth/verify", {
      method: "GET",
    })
  }
}

export const goApiClient = new GoApiClient()
export default goApiClient
