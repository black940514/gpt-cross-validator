---
name: gemini-code-reviewer
description: Gemini Pro를 사용한 코드 검토 (교차검증용, Claude 폴백 지원)
---

# Gemini Code Reviewer Skill

Gemini Pro를 사용하여 코드 품질을 독립적으로 검토합니다. Gemini 실패 시 자동으로 Claude Code Reviewer로 폴백합니다.

## When to Use

- Claude code-reviewer와 다른 관점의 검토가 필요할 때
- 보안 취약점을 이중으로 확인하고 싶을 때
- "Gemini로 코드 리뷰해줘", "gemini review" 등의 요청

## How It Works

1. 코드 또는 git diff 수집
2. MCP 도구 `gemini_review` 호출 시도
3. **성공**: Gemini Pro가 보안/품질/성능 검토
4. **실패** (quota/rate limit): Claude Code Reviewer로 자동 폴백
5. APPROVE/REQUEST_CHANGES 판정 반환

## Fallback Logic

```
TRY: gemini_review (MCP tool)
  ↓ 실패 시
FALLBACK: oh-my-claudecode:code-reviewer (Task agent)
```

**폴백 트리거 조건:**
- quota exceeded
- rate limit (429)
- API 연결 실패
- 타임아웃

## Usage

```
/oh-my-claudecode:gemini-code-reviewer [file_path]
```

또는 자연어로:
- "Gemini로 이 코드 리뷰해줘"
- "gemini review src/main.ts"

## MCP Tool Call

```
Tool: gemini_review
Arguments:
  code: "<코드 내용>"
  file_path: "src/main.ts" (선택)
  language: "typescript" (선택)
```

## Output Format

### Gemini 성공 시:
```
## 🌐 Gemini Pro Code Review

**Verdict:** APPROVE / REQUEST_CHANGES
**Score:** 8/10
**Model:** Gemini 2.0 Flash (교차검증)

### Summary
전반적으로 잘 작성된 코드입니다.

### Issues

**[critical]** Line 42: SQL Injection 위험
- 수정: Parameterized query 사용

**[major]** Line 89: 에러 핸들링 누락

### Highlights
- 깔끔한 함수 분리
- 타입 정의 명확

### Security Concerns
- API 키 하드코딩 주의
```

### Claude 폴백 시:
```
## 🔄 Claude Code Review (Gemini 폴백)

⚠️ Gemini API 사용 불가 (rate limit)
Claude Code Reviewer로 검토 진행

**Verdict:** APPROVE / REQUEST_CHANGES
...
```

## Severity Levels

| Level | Action |
|-------|--------|
| critical | 머지 전 반드시 수정 |
| major | 머지 전 수정 권장 |
| minor | 가능하면 수정 |
| suggestion | 고려해볼 것 |

## Cross-Validation Workflow

```
1. 코드 작성/수정
2. /code-review            # Claude 검토
3. /gemini-code-reviewer   # Gemini 교차검증 (실패 시 Claude 폴백)
4. 두 결과 병합 → 종합 판단
```

## Prerequisites

**Gemini (Primary):**
- MCP 서버 등록 (settings.json)
- API 키: `~/.omc/secrets/gemini-api.json` 또는 `GEMINI_API_KEY`
- 발급: https://aistudio.google.com/app/apikey

**Claude (Fallback):**
- 추가 설정 불필요

## See Also

- `/code-review` - Claude 기반 코드 검토
- `/gemini-critic` - Gemini 기반 계획 검토
- `/ralplan` - 반복 계획 with Gemini 교차검증
