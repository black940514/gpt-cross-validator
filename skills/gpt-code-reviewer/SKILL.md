---
name: gpt-code-reviewer
description: GPT-5.2를 사용한 코드 검토 (교차검증용)
---

# GPT Code Reviewer Skill

GPT-5.2를 사용하여 코드 품질을 독립적으로 검토합니다. Claude 기반 code-reviewer와 교차검증하여 더 포괄적인 리뷰를 제공합니다.

## When to Use

- Claude code-reviewer와 다른 관점의 검토가 필요할 때
- 보안 취약점을 이중으로 확인하고 싶을 때
- "GPT로 코드 리뷰해줘", "gpt review" 등의 요청

## How It Works

1. 코드 또는 git diff 수집
2. MCP 도구 `gpt_review` 호출
3. GPT-5.2가 다음 항목 검토:
   - Security (보안) - CRITICAL
   - Code Quality (코드 품질) - HIGH
   - Performance (성능) - MEDIUM
   - Best Practices (모범 사례) - LOW
4. APPROVE/REQUEST_CHANGES 판정 반환

## Usage

```
/oh-my-claudecode:gpt-code-reviewer [file_path]
```

또는 자연어로:
- "GPT로 이 코드 리뷰해줘"
- "gpt review src/main.ts"

## MCP Tool Call

```
Tool: gpt_review
Arguments:
  code: "<코드 내용>"
  file_path: "src/main.ts" (선택)
  language: "typescript" (선택)
  context: "<추가 컨텍스트>" (선택)
```

## Output Format

```
## GPT-5.2 Code Review

**Verdict:** APPROVE / REQUEST_CHANGES
**Score:** 8/10

### Summary
전반적으로 잘 작성된 코드이나 몇 가지 보안 이슈가 있습니다.

### Issues

**[critical]** Line 42: SQL Injection 위험
- 사용자 입력이 직접 쿼리에 포함됨
- 수정: Parameterized query 사용

**[major]** Line 89: 에러 핸들링 누락
- try-catch 없이 외부 API 호출
- 수정: 적절한 에러 핸들링 추가

**[minor]** Line 15: 매직 넘버
- 상수로 추출 권장

### Highlights
- 깔끔한 함수 분리
- 타입 정의 명확

### Security Concerns
- API 키 하드코딩 주의

### Performance Notes
- N+1 쿼리 패턴 감지됨
```

## Severity Levels

| Level | Action |
|-------|--------|
| critical | 머지 전 반드시 수정 |
| major | 머지 전 수정 권장 |
| minor | 가능하면 수정 |
| suggestion | 고려해볼 것 |

## Cross-Validation Workflow

Claude code-reviewer와 함께 사용:

```
1. 코드 작성/수정
2. /code-review        # Claude 검토
3. /gpt-code-reviewer  # GPT-5.2 교차검증
4. 두 결과 병합 → 종합 판단
```

## Prerequisites

- OpenAI OAuth 토큰 설정 필요
- `~/.omc/secrets/openai-oauth.json` 파일 필요

## See Also

- `/code-review` - Claude 기반 코드 검토
- `/gpt-critic` - GPT 기반 계획 검토
