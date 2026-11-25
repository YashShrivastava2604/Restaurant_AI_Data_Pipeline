
import axios from "axios"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Normalize API errors so components can display useful messages.
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail

    if (typeof detail === "string") {
      return detail
    }

    if (error.code === "ECONNABORTED") {
      return "The request timed out. Please try again."
    }

    if (!error.response) {
      return "Unable to connect to the backend. Check whether the API server is running."
    }

    return `Request failed (${error.response.status}).`
  }

  return "An unexpected error occurred."
}
