import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class ApiKeyManager {
  private configPath: string;
  private apiKey: string | null = null;

  constructor() {
    this.configPath = path.join(os.homedir(), '.omc', 'secrets', 'gemini-api.json');
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  }

  async ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  }

  async loadApiKey(): Promise<string | null> {
    if (this.apiKey) return this.apiKey;

    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.apiKey = parsed.api_key;
      return this.apiKey;
    } catch {
      return null;
    }
  }

  async saveApiKey(apiKey: string): Promise<void> {
    await this.ensureDirectoryExists();
    await fs.writeFile(
      this.configPath,
      JSON.stringify({ api_key: apiKey }, null, 2),
      { mode: 0o600 }
    );
    this.apiKey = apiKey;
  }

  async getApiKey(): Promise<string> {
    const key = await this.loadApiKey();

    if (!key) {
      throw new Error(
        'Gemini API 키가 설정되지 않았습니다.\n\n' +
        '1. API 키 발급: https://aistudio.google.com/app/apikey\n\n' +
        '2. 환경변수 설정:\n' +
        '   export GEMINI_API_KEY="AIza..."\n\n' +
        '3. 또는 파일 생성:\n' +
        `   ${this.configPath}\n` +
        '   내용: { "api_key": "AIza..." }'
      );
    }

    return key;
  }

  getConfigPath(): string {
    return this.configPath;
  }
}
