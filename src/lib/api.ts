const API_BASE_URL = "http://10.30.28.22:8080";

interface LoginResponse {
  message: string;
  user_id: number;
}

interface SignupResponse {
  message: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  community_id: number;
  user_id: number;
  username: string;
  created_at: string;
}

interface Community {
  id: number;
  name: string;
  description?: string;
}

interface ApiError {
  error?: string;
  message?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async signup(username: string, password: string): Promise<SignupResponse> {
    return this.request<SignupResponse>("/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async logout(): Promise<void> {
    await this.request("/logout", { method: "POST" });
  }

  async updateStatus(status: string): Promise<void> {
    await this.request("/status", {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  // Feed endpoints
  async getFeed(): Promise<Post[]> {
    return this.request<Post[]>("/feed");
  }

  // Community endpoints
  async createCommunity(name: string, description?: string): Promise<{ message: string; id: number }> {
    return this.request("/community", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  }

  // Post endpoints
  async createPost(title: string, content: string, community_id: number): Promise<{ message: string; id: number }> {
    return this.request("/post", {
      method: "POST",
      body: JSON.stringify({ title, content, community_id }),
    });
  }

  async deletePost(postId: number): Promise<void> {
    await this.request(`/post/${postId}`, { method: "DELETE" });
  }
}

export const api = new ApiService();
export type { Post, Community, LoginResponse };
