---
name: gemini-critic
description: Gemini Pro를 사용한 계획 검토 (교차검증용, Claude 폴백 지원)
---

# Gemini Critic Skill

Gemini Pro를 사용하여 계획/설계를 독립적으로 검토합니다. Gemini 실패 시 자동으로 Claude Critic으로 폴백합니다.

## When to Use

- Claude critic과 다른 관점의 검토가 필요할 때
- 교차검증으로 계획의 품질을 높이고 싶을 때
- "Gemini로 검토해줘", "gemini critic" 등의 요청

## How It Works

1. 계획 파일 또는 내용을 수집
2. MCP 도구 `gemini_critique` 호출 시도
3. **성공**: Gemini Pro가 4가지 기준으로 검토
4. **실패** (quota/rate limit): Claude Critic으로 자동 폴백
5. OKAY/REJECT 판정 반환

## Fallback Logic

```
TRY: gemini_critique (MCP tool)
  ↓ 실패 시
FALLBACK: oh-my-claudecode:critic (Task agent)
```

**폴백 트리거 조건:**
- quota exceeded
- rate limit (429)
- API 연결 실패
- 타임아웃

## Usage

```
/oh-my-claudecode:gemini-critic [plan_file_path]
```

또는 자연어로:
- "Gemini로 이 계획 검토해줘"
- "gemini critic .omc/plans/feature.md"

## MCP Tool Call

```
Tool: gemini_critique
Arguments:
  plan: "<계획 내용>"
  context: "<추가 컨텍스트>" (선택)
```

## Output Format

### Gemini 성공 시:
```
## 🌐 Gemini Pro Plan Review

**Verdict:** OKAY / REJECT
**Confidence:** 0.85
**Model:** Gemini 2.0 Flash (교차검증)

### Summary
계획이 명확하고 실행 가능합니다...

### Strengths
- 구체적인 파일 참조 포함

### Concerns
- 에러 처리 전략 미흡

### Suggestions
1. 예외 케이스 추가

### Risk Assessment
**Level:** MEDIUM
```

### Claude 폴백 시:
```
## 🔄 Claude Critic Review (Gemini 폴백)

⚠️ Gemini API 사용 불가 (quota exceeded)
Claude Critic으로 교차검증 진행

**Verdict:** OKAY / REJECT
...
```

## Cross-Validation Workflow

```
1. /plan feature       # 계획 수립
2. /review             # Claude critic 검토
3. /gemini-critic      # Gemini 교차검증 (실패 시 Claude 폴백)
4. 결과 비교 → 개선
```

## Prerequisites

**Gemini (Primary):**
- MCP 서버 등록 (settings.json)
- API 키: `~/.omc/secrets/gemini-api.json` 또는 `GEMINI_API_KEY`
- 발급: https://aistudio.google.com/app/apikey

**Claude (Fallback):**
- 추가 설정 불필요

## See Also

- `/review` - Claude 기반 계획 검토
- `/gemini-code-reviewer` - Gemini 기반 코드 검토
- `/ralplan` - 반복 계획 with Gemini 교차검증
