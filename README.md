# GPT Cross Validator

**Claude와 독립적으로 작동하는 GPT-5.2 기반 교차검증 MCP 서버**

[![Node.js](https://img.shields.io/badge/Node.js-≥18.0.0-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](#라이센스)

## 개요

`gpt-cross-validator`는 Claude 에이전트의 의사결정을 검증하는 MCP(Model Context Protocol) 서버입니다. GPT-5.2 모델을 사용하여 계획 검토와 코드 리뷰를 독립적으로 수행하므로, Claude의 판단에 대한 객관적인 교차검증이 가능합니다.

### 핵심 특징

- **독립적 검증**: Claude와 별개의 GPT-5.2 모델로 의사결정 검증
- **계획 검토**: 작업 계획의 명확성, 완전성, 위험도 평가
- **코드 리뷰**: 보안, 성능, 코드 품질 종합 검토
- **구조화된 출력**: JSON 형식의 명확한 평가 결과
- **OAuth 인증**: 안전한 OpenAI API 토큰 관리

## 기능

### 1. gpt_critique - 계획 검토

작업 계획, 설계, 아키텍처를 평가합니다.

**평가 기준:**
- **명확성**: 구현에 필요한 정보가 명확한가?
- **검증 가능성**: 성공 기준이 객관적인가?
- **맥락 완전성**: 필요한 정보가 충분한가?
- **전체 이해도**: 개발자가 전체 목표를 이해할 수 있는가?

**응답 예시:**
```json
{
  "verdict": "OKAY",
  "confidence": 0.92,
  "summary": "계획은 명확한 목표와 구현 경로를 제시합니다.",
  "strengths": [
    "각 단계별 명확한 성공 기준 제시",
    "참고 문서 및 기존 코드 패턴 명시",
    "의존성과 제약사항 전부 포함"
  ],
  "concerns": [
    "데이터베이스 마이그레이션 전략이 불분명함",
    "무중단 배포 계획이 누락됨"
  ],
  "suggestions": [
    "마이그레이션 단계를 docs/migration-plan.md로 구체화",
    "무중단 배포 전략을 추가하거나 다단계 롤아웃 계획 수립"
  ],
  "risk_assessment": {
    "level": "MEDIUM",
    "factors": [
      "기존 데이터와의 호환성 불명확",
      "사용자 영향 최소화 전략 부재"
    ]
  }
}
```

### 2. gpt_review - 코드 리뷰

코드 품질, 보안, 성능을 종합적으로 검토합니다.

**검토 항목:**
- **보안** (필수): 하드코딩된 자격증명, SQL 인젝션, XSS, 입력 검증, 경로 조회, 인증 우회
- **코드 품질**: 함수 크기, 파일 크기, 중첩 깊이, 에러 처리, 디버그 코드, 테스트 커버리지
- **성능**: 알고리즘 효율성, 불필요한 리렌더링, 캐싱 누락, N+1 쿼리, 메모리 누수
- **모범 사례**: TODO 주석, 문서화, 변수명, 매직 넘버, 포맷팅, 타입 안전성

**응답 예시:**
```json
{
  "verdict": "REQUEST_CHANGES",
  "overall_score": 6,
  "summary": "코드 구조는 좋으나 보안 취약점과 에러 처리 누락이 있습니다.",
  "issues": [
    {
      "severity": "critical",
      "line": 42,
      "message": "API 키가 하드코딩되어 있습니다.",
      "suggestion": "환경 변수로 이동: process.env.API_KEY"
    },
    {
      "severity": "major",
      "line": 15,
      "message": "사용자 입력이 검증되지 않고 SQL 쿼리에 직접 사용됨",
      "suggestion": "parameterized query 사용: db.query('SELECT * FROM users WHERE id = ?', [userId])"
    },
    {
      "severity": "major",
      "message": "async 함수에서 promise 처리 누락",
      "suggestion": ".catch()나 try-catch 블록 추가"
    },
    {
      "severity": "minor",
      "message": "console.log() 디버그 출력이 남아있음",
      "suggestion": "배포 전에 제거"
    }
  ],
  "highlights": [
    "타입스크립트 타입이 잘 정의됨",
    "에러 처리 구조가 명확함",
    "단위 테스트 커버리지가 높음"
  ],
  "security_concerns": [
    "API 인증 헤더가 로그에 기록될 수 있음",
    "SQL 쿼리 문자열 연결 사용"
  ],
  "performance_notes": [
    "데이터베이스 쿼리가 인덱스를 활용하도록 최적화 필요"
  ]
}
```

## 설치

### 사전 요구사항

- **Node.js** ≥ 18.0.0
- **OpenAI API 계정** (GPT-5.2 모델 접근 권한 필요)
- **~/.omc 디렉토리** (OMC 설정 디렉토리)

### 1단계: 저장소 클론 및 설치

```bash
git clone <repository-url>
cd gpt-cross-validator
npm install
```

### 2단계: TypeScript 컴파일

```bash
npm run build
```

컴파일된 코드는 `dist/` 디렉토리에 생성됩니다.

### 3단계: OpenAI OAuth 토큰 설정

자세한 내용은 [OAuth 토큰 설정](#oauth-토큰-설정)을 참고하세요.

## OAuth 토큰 설정

### 토큰 파일 위치

```
~/.omc/secrets/openai-oauth.json
```

### 토큰 파일 형식

```json
{
  "access_token": "sk-...",
  "refresh_token": "sk-...",
  "token_type": "Bearer",
  "expires_at": 1234567890,
  "scope": "openai-api"
}
```

**필수 필드:**
- `access_token`: OpenAI API 접근 토큰
- `token_type`: 항상 "Bearer"
- `expires_at`: UNIX 타임스탐프 (초 단위) - 토큰 만료 시간

**선택 필드:**
- `refresh_token`: 토큰 자동 갱신용 (있으면 만료 시 자동 갱신)
- `scope`: API 범위 정보

### 토큰 파일 생성 방법

#### 방법 1: 수동 생성 (개발용)

```bash
# 디렉토리 생성
mkdir -p ~/.omc/secrets

# 파일 생성 및 권한 설정
cat > ~/.omc/secrets/openai-oauth.json << EOF
{
  "access_token": "your-access-token-here",
  "token_type": "Bearer",
  "expires_at": $(date -v+2H +%s)
}
EOF

# 보안 권한 설정 (소유자만 읽기 가능)
chmod 600 ~/.omc/secrets/openai-oauth.json
```

#### 방법 2: OpenAI OAuth 흐름 (프로덕션용)

1. [OpenAI 플랫폼](https://platform.openai.com/)에서 계정 설정
2. API 키 생성 또는 OAuth 토큰 발급
3. 토큰 파일 형식으로 저장

### 보안 고려사항

- 파일 권한은 반드시 `600` (소유자만 읽기)으로 설정
- 토큰은 버전 관리 시스템에 커밋하지 않음
- 토큰이 노출되면 즉시 OpenAI 플랫폼에서 폐지
- 프로덕션 환경에서는 환경 변수 또는 시크릿 매니저 사용

## Claude Code MCP 서버 등록

### Claude Code 설정

Claude Code(oh-my-claudecode)에서 이 MCP 서버를 사용하려면 Claude 설정 파일에 등록해야 합니다.

#### 1단계: 빌드 확인

```bash
npm run build
# dist/index.js가 생성되었는지 확인
ls -la dist/index.js
```

#### 2단계: Claude 설정 파일 수정

Claude Code 설정 파일 위치:
```
~/.claude/claude.json
```

또는 `CLAUDE.md`가 있는 경우:
```
~/.claude/CLAUDE.md
```

#### 3단계: MCP 서버 추가

```json
{
  "mcpServers": {
    "gpt-cross-validator": {
      "command": "node",
      "args": ["/Users/kimtaeyoun/Bamboos/04_2026_withcharlie/gpt-cross-validator/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**주의:** 경로를 본인의 환경에 맞게 수정하세요.

#### 4단계: 서버 재시작

Claude Code를 재시작하면 MCP 서버가 등록됩니다.

### 등록 확인

Claude에서 다음을 시도해보세요:

```
gpt_critique를 사용하여 이 계획을 검토해줄래?
```

또는

```
gpt_review를 사용해서 이 코드를 검토해줘.
```

## 사용 예시

### 계획 검토 (gpt_critique)

**Claude 에이전트 프롬프트:**

```
다음 마이그레이션 계획을 GPT-5.2로 검토해줘:

## 사용자 인증 시스템 마이그레이션 계획

1. 현재 세션 기반 인증에서 JWT로 전환
2. 단계:
   - 신규 JWT 토큰 생성 로직 구현 (src/auth/jwt.ts)
   - 기존 로그인 엔드포인트에 JWT 발급 추가
   - 모든 인증 미들웨어를 JWT 검증으로 업데이트
   - 라우트별 테스트 추가 (tests/auth.spec.ts)
3. 성공 기준: 모든 테스트 통과, 무중단 배포 가능

context: 현재 60개의 API 엔드포인트가 있으며, 연결된 모바일 클라이언트 2개가 있습니다.
```

**응답:**

```json
{
  "verdict": "OKAY",
  "confidence": 0.88,
  "summary": "계획은 명확한 구현 경로를 제시하나, 마이그레이션 일정과 롤백 전략이 필요합니다.",
  "strengths": [
    "단계별 구현 순서가 명확",
    "테스트 전략이 포함됨",
    "무중단 배포 가능성 고려"
  ],
  "concerns": [
    "이전 클라이언트와의 호환성 전략 누락",
    "토큰 갱신 로직이 언급되지 않음",
    "만료된 토큰 처리 방법 불명확"
  ],
  "suggestions": [
    "세션 기반과 JWT 인증을 동시 지원하는 기간 명시",
    "토큰 갱신 엔드포인트 추가 계획 포함",
    "클라이언트 버전별 호환성 매트릭스 작성"
  ],
  "risk_assessment": {
    "level": "MEDIUM",
    "factors": [
      "모바일 클라이언트 2개의 호환성 확보 필요",
      "기존 세션 데이터 마이그레이션 전략 부재"
    ]
  }
}
```

### 코드 리뷰 (gpt_review)

**Claude 에이전트 프롬프트:**

```
gpt_review로 이 코드를 검토해줄 수 있어?

파일: src/auth/jwt.ts
언어: TypeScript

코드:

import jwt from 'jsonwebtoken';

export function createToken(userId: string): string {
  const secret = 'my-secret-key'; // 주의: 이건 예시
  return jwt.sign({ userId }, secret, { expiresIn: '24h' });
}

export function verifyToken(token: string): string {
  const secret = 'my-secret-key';
  const decoded = jwt.verify(token, secret) as any;
  return decoded.userId;
}

export async function handleLogin(req, res) {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);

  if (user.password === password) {
    const token = createToken(user.id);
    res.json({ token });
  } else {
    res.status(401).send('Unauthorized');
  }
}
```

context: JWT 토큰 검증 로직입니다. 모든 보호된 라우트에서 사용됩니다.
```

**응답:**

```json
{
  "verdict": "REQUEST_CHANGES",
  "overall_score": 3,
  "summary": "심각한 보안 취약점이 있습니다. 즉시 수정 필요합니다.",
  "issues": [
    {
      "severity": "critical",
      "line": 4,
      "message": "JWT 비밀키가 하드코딩되어 있습니다.",
      "suggestion": "환경 변수 사용: const secret = process.env.JWT_SECRET || 'development-secret';"
    },
    {
      "severity": "critical",
      "line": 13,
      "message": "입력 검증 없음. 빈 토큰, null, undefined가 처리되지 않음.",
      "suggestion": "if (!token || typeof token !== 'string') throw new Error('Invalid token');"
    },
    {
      "severity": "critical",
      "line": 23,
      "message": "평문 비밀번호 비교. 암호화된 해시와 비교해야 함.",
      "suggestion": "bcrypt.compare(password, user.passwordHash) 사용"
    },
    {
      "severity": "major",
      "line": 17,
      "message": "any 타입 사용. 타입 안전성 감소.",
      "suggestion": "interface TokenPayload { userId: string; } 정의 후 사용"
    },
    {
      "severity": "major",
      "line": 21,
      "message": "try-catch 블록 없음. JWT 검증 실패 시 예외 처리 안 됨.",
      "suggestion": "jwt.verify를 try-catch로 감싸기"
    },
    {
      "severity": "major",
      "line": 28,
      "message": "요청 본문이 검증되지 않음. 빈 값이 전달될 수 있음.",
      "suggestion": "zod, joi, 또는 내장 검증 라이브러리로 검증"
    }
  ],
  "highlights": [
    "토큰 만료 시간이 적절하게 설정됨",
    "표준 JWT 라이브러리 사용"
  ],
  "security_concerns": [
    "하드코딩된 비밀키 - 코드가 노출되면 모든 토큰이 위조 가능",
    "평문 비밀번호 저장 - 데이터베이스 침해 시 즉시 손상",
    "토큰 검증 실패에 대한 에러 처리 부재",
    "HTTPS 사용 여부가 코드에 강제되지 않음"
  ],
  "performance_notes": [
    "JWT 검증은 동기 연산으로 비용이 적으므로 현재 구현 충분"
  ]
}
```

## 출력 형식

### gpt_critique 응답 구조

```typescript
{
  verdict: "OKAY" | "REJECT"              // 계획 승인 여부
  confidence: number (0.0 ~ 1.0)          // 평가 확신도
  summary: string                          // 1-2줄 요약
  strengths: string[]                      // 잘된 점들
  concerns: string[]                       // 문제점들 (구체적)
  suggestions: string[]                    // 개선 제안 (실행 가능)
  risk_assessment: {
    level: "LOW" | "MEDIUM" | "HIGH"       // 위험도
    factors: string[]                      // 위험 요인들
  }
}
```

### gpt_review 응답 구조

```typescript
{
  verdict: "APPROVE" | "REQUEST_CHANGES"   // 코드 승인 여부
  overall_score: number (1 ~ 10)           // 종합 점수
  summary: string                          // 평가 요약
  issues: Array<{
    severity: "critical" | "major" | "minor" | "suggestion"
    line?: number                          // 문제 발생 줄 번호 (선택)
    message: string                        // 문제 설명
    suggestion?: string                    // 해결 방법 (선택)
  }>
  highlights: string[]                     // 잘된 부분들
  security_concerns?: string[]             // 보안 관련 사항
  performance_notes?: string[]             // 성능 관련 사항
}
```

## 문제 해결

### 토큰 에러

**에러 메시지:**
```
Error: OpenAI OAuth 토큰이 설정되지 않았습니다.
위치: ~/.omc/secrets/openai-oauth.json
형식: { "access_token": "...", "expires_at": 1234567890 }
```

**해결 방법:**

1. 토큰 파일이 존재하는지 확인:
```bash
ls -la ~/.omc/secrets/openai-oauth.json
```

2. 파일이 없으면 생성:
```bash
mkdir -p ~/.omc/secrets
cat > ~/.omc/secrets/openai-oauth.json << EOF
{
  "access_token": "sk-your-token",
  "token_type": "Bearer",
  "expires_at": $(python3 -c "import time; print(int(time.time()) + 7200)")
}
EOF
chmod 600 ~/.omc/secrets/openai-oauth.json
```

3. 파일 형식 확인:
```bash
cat ~/.omc/secrets/openai-oauth.json | python3 -m json.tool
```

### 토큰 만료 에러

**에러 메시지:**
```
Error: 토큰이 만료되었고 refresh_token이 없습니다. 재인증이 필요합니다.
```

**해결 방법:**

토큰 파일의 `expires_at`을 현재 시간보다 뒤로 설정:

```bash
# 현재 시간부터 2시간 유효한 새 토큰 발급
python3 << EOF
import json
import time

token_file = '/Users/kimtaeyoun/.omc/secrets/openai-oauth.json'
with open(token_file, 'r') as f:
    token = json.load(f)

# 만료 시간 업데이트 (2시간 후)
token['expires_at'] = int(time.time()) + 7200

with open(token_file, 'w') as f:
    json.dump(token, f, indent=2)

print("Token updated!")
EOF
```

### MCP 서버 연결 실패

**증상:** Claude에서 gpt_critique나 gpt_review 도구를 사용할 수 없음

**해결 단계:**

1. 서버 빌드 확인:
```bash
cd /Users/kimtaeyoun/Bamboos/04_2026_withcharlie/gpt-cross-validator
npm run build
ls -la dist/index.js
```

2. 서버 수동 실행 테스트:
```bash
node dist/index.js
# "GPT Cross Validator MCP Server running on stdio"가 표시되어야 함
```

3. Claude 설정 파일 확인:
```bash
cat ~/.claude/claude.json | grep -A 10 "gpt-cross-validator"
```

4. Claude 재시작

### 권한 에러

**에러 메시지:**
```
Error: EACCES: permission denied
```

**해결 방법:**

```bash
# 토큰 파일 권한 확인 및 수정
chmod 600 ~/.omc/secrets/openai-oauth.json

# 디렉토리 권한 확인
chmod 700 ~/.omc/secrets
chmod 700 ~/.omc
```

### GPT API 연결 실패

**에러 메시지:**
```
Error: 401 Unauthorized
```

**해결 방법:**

1. 토큰이 유효한지 확인:
```bash
cat ~/.omc/secrets/openai-oauth.json | jq '.expires_at'
python3 -c "import time; print('Current timestamp:', int(time.time()))"
```

2. expires_at이 현재 시간보다 뒤에 있는지 확인

3. OpenAI 플랫폼에서 토큰이 폐지되지 않았는지 확인

### 모델 접근 불가

**에러 메시지:**
```
Error: 404 Model gpt-5.2 not found
```

**해결 방법:**

1. OpenAI 계정이 GPT-5.2에 접근 권한이 있는지 확인
2. 사용 가능한 모델 확인: https://platform.openai.com/docs/models
3. 필요하면 src/tools/gpt-critique.ts와 src/tools/gpt-review.ts에서 모델명 변경:

```typescript
// gpt-4.5-preview 또는 다른 사용 가능 모델로 변경
model: 'gpt-4.5-preview',
```

## 개발

### 개발 서버 실행

```bash
npm run dev
```

TypeScript 코드를 직접 실행합니다. (ts-node 사용)

### TypeScript 컴파일

```bash
npm run build
```

`src/`의 TypeScript 코드를 `dist/`로 컴파일합니다.

### 프로젝트 구조

```
gpt-cross-validator/
├── src/
│   ├── index.ts                  # MCP 서버 진입점
│   ├── auth/
│   │   └── oauth-manager.ts      # OpenAI OAuth 토큰 관리
│   ├── tools/
│   │   ├── index.ts              # 도구 내보내기
│   │   ├── gpt-critique.ts       # 계획 검토 도구
│   │   └── gpt-review.ts         # 코드 리뷰 도구
│   └── prompts/
│       ├── critic-system.ts      # 계획 검토 프롬프트
│       └── code-reviewer-system.ts # 코드 리뷰 프롬프트
├── dist/                         # 컴파일된 JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 아키텍처

### 데이터 흐름

```
Claude Agent
    │
    ├─→ [gpt_critique 요청]
    │   └─→ OAuthManager (토큰 로드/갱신)
    │       └─→ OpenAI API (GPT-5.2)
    │           └─→ 계획 평가
    │               └─→ 구조화된 JSON 응답
    │
    └─→ [gpt_review 요청]
        └─→ OAuthManager (토큰 로드/갱신)
            └─→ OpenAI API (GPT-5.2)
                └─→ 코드 평가
                    └─→ 구조화된 JSON 응답
```

### 인증 흐름

```
1. OAuthManager 초기화
   └─→ 토큰 경로 설정: ~/.omc/secrets/openai-oauth.json

2. getAccessToken() 호출
   ├─→ 토큰 파일 로드
   ├─→ 만료 여부 확인 (5분 여유)
   ├─→ 만료되었으면 refresh_token으로 갱신
   └─→ access_token 반환

3. OpenAI API 호출
   └─→ Authorization: Bearer {access_token}
```

## 라이센스

MIT License

## 기여

버그 리포트, 기능 요청, Pull Request를 환영합니다.

## 지원

문제가 발생하면:

1. [문제 해결](#문제-해결) 섹션을 먼저 확인
2. 에러 메시지와 함께 이슈 리포트
3. 토큰 파일 내용은 공유하지 않기 (보안)

## 변경 로그

### v1.0.0

- 초기 릴리스
- gpt_critique 도구 (계획 검토)
- gpt_review 도구 (코드 리뷰)
- OAuth 토큰 관리
- MCP 서버 통합
