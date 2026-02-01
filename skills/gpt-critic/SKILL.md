---
name: gpt-critic
description: GPT-5.2를 사용한 계획 검토 (교차검증용)
---

# GPT Critic Skill

GPT-5.2를 사용하여 계획/설계를 독립적으로 검토합니다. Claude 기반 critic과 교차검증하여 더 신뢰할 수 있는 리뷰를 제공합니다.

## When to Use

- Claude critic과 다른 관점의 검토가 필요할 때
- 교차검증으로 계획의 품질을 높이고 싶을 때
- "GPT로 검토해줘", "gpt critic" 등의 요청

## How It Works

1. 계획 파일 또는 내용을 수집
2. MCP 도구 `gpt_critique` 호출
3. GPT-5.2가 4가지 기준으로 검토:
   - Clarity (명확성)
   - Verification (검증 가능성)
   - Context Completeness (컨텍스트 완전성)
   - Big Picture (전체 그림 이해)
4. OKAY/REJECT 판정 반환

## Usage

```
/oh-my-claudecode:gpt-critic [plan_file_path]
```

또는 자연어로:
- "GPT로 이 계획 검토해줘"
- "gpt critic .omc/plans/feature.md"

## MCP Tool Call

```
Tool: gpt_critique
Arguments:
  plan: "<계획 내용>"
  context: "<추가 컨텍스트>" (선택)
```

## Output Format

```
## GPT-5.2 Plan Review

**Verdict:** OKAY / REJECT
**Confidence:** 0.85

### Summary
계획이 명확하고 실행 가능합니다...

### Strengths
- 구체적인 파일 참조 포함
- 검증 기준이 명확함

### Concerns
- 에러 처리 전략 미흡
- 테스트 계획 부재

### Suggestions
1. 예외 케이스 추가
2. 단위 테스트 계획 포함

### Risk Assessment
**Level:** MEDIUM
- 시간 추정 불확실
- 외부 의존성 리스크
```

## Cross-Validation Workflow

Claude critic과 함께 사용:

```
1. /plan feature       # 계획 수립
2. /review             # Claude critic 검토
3. /gpt-critic         # GPT-5.2 교차검증
4. 두 결과 비교 → 개선
```

## Prerequisites

- OpenAI OAuth 토큰 설정 필요
- `~/.omc/secrets/openai-oauth.json` 파일 필요

## See Also

- `/review` - Claude 기반 계획 검토
- `/gpt-code-reviewer` - GPT 기반 코드 검토
