import fs from 'fs/promises';
import path from 'path';
import os from 'os';

interface OAuthToken {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at: number;
  scope?: string;
}

export class OAuthManager {
  private tokenPath: string;
  private token: OAuthToken | null = null;

  constructor() {
    this.tokenPath = path.join(os.homedir(), '.omc', 'secrets', 'openai-oauth.json');
  }

  async ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.tokenPath);
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  }

  async loadToken(): Promise<OAuthToken | null> {
    try {
      const data = await fs.readFile(this.tokenPath, 'utf-8');
      this.token = JSON.parse(data);
      return this.token;
    } catch {
      return null;
    }
  }

  async saveToken(token: OAuthToken): Promise<void> {
    await this.ensureDirectoryExists();
    await fs.writeFile(this.tokenPath, JSON.stringify(token, null, 2), { mode: 0o600 });
    this.token = token;
  }

  isTokenExpired(): boolean {
    if (!this.token) return true;
    // 5분 여유를 두고 만료 체크
    return Date.now() / 1000 > this.token.expires_at - 300;
  }

  async getAccessToken(): Promise<string> {
    if (!this.token) {
      await this.loadToken();
    }

    if (!this.token) {
      throw new Error(
        'OpenAI OAuth 토큰이 설정되지 않았습니다.\n' +
        '다음 위치에 토큰 파일을 생성하세요: ' + this.tokenPath + '\n' +
        '형식: { "access_token": "...", "expires_at": 1234567890 }'
      );
    }

    if (this.isTokenExpired()) {
      if (this.token.refresh_token) {
        await this.refreshToken();
      } else {
        throw new Error('토큰이 만료되었고 refresh_token이 없습니다. 재인증이 필요합니다.');
      }
    }

    return this.token.access_token;
  }

  private async refreshToken(): Promise<void> {
    if (!this.token?.refresh_token) {
      throw new Error('Refresh token이 없습니다.');
    }

    // OpenAI OAuth refresh 엔드포인트 호출
    // 실제 구현에서는 OpenAI의 OAuth 스펙에 맞게 수정 필요
    const response = await fetch('https://auth.openai.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.token.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new Error(`토큰 갱신 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const newToken: OAuthToken = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || this.token.refresh_token,
      token_type: data.token_type || 'Bearer',
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      scope: data.scope,
    };

    await this.saveToken(newToken);
  }

  getTokenPath(): string {
    return this.tokenPath;
  }
}
