import axios, { AxiosInstance, AxiosError } from "axios"
import authClient from "./auth-client"

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
}

export interface AuthVerifyResponse {
  valid: boolean
  userId?: string
  email?: string
}

class GoApiClientAxios {
  private axiosInstance: AxiosInstance

  constructor(baseUrl: string = GO_API_URL) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    })

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await authClient.token().then(x => x.data?.token)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )
  }

  private async request<T = unknown>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
      data?: unknown
      params?: Record<string, unknown>
    } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.request<T>({
        url: endpoint,
        method: options.method || "GET",
        data: options.data,
        params: options.params,
      })

      return {
        data: response.data,
        status: response.status,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          error: error.response?.data?.message || error.message || `API Error: ${error.response?.status} ${error.response?.statusText}`,
          status: error.response?.status || 0,
        }
      }
      return {
        error: error instanceof Error ? error.message : "Unknown error occurred",
        status: 0,
      }
    }
  }

  async verifyAuth(): Promise<ApiResponse<AuthVerifyResponse>> {
    return this.request("/api/auth/verify", {
      method: "GET",
    })
  }
}

export const goApiClientAxios = new GoApiClientAxios()
export default goApiClientAxios
