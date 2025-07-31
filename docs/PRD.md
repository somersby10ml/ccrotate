# 제품 요구사항 명세서 (PRD): ccrotate

### 1. 개요 (Overview)

`ccrotate`는 `claude-code` 사용자를 위한 명령줄 인터페이스(CLI) 도구로, 여러 Claude 계정을 효율적으로 관리하고 전환하여 API 요청 제한(Rate Limit) 문제를 해결하는 것을 목표로 한다.

### 2. 목표 (Goals)

- **계정 전환 간소화:** 단일 명령어로 여러 계정 간의 전환을 수행한다.
- **일관성 있는 정보 관리:** `claude-code`와 동일한 방식으로 계정 정보를 평문 관리하여 일관성을 유지한다.
- **예측 가능한 자동화:** 예측 가능한 방식으로 다음 계정으로 순차 전환하는 기능을 제공한다.
- **직관적 사용성:** 명확한 명령어와 가이드를 통해 쉬운 사용 경험을 제공한다.

### 3. 기술 및 플랫폼 요구사항

- **플랫폼:** Node.js 기반으로 제작되며, **Windows와 Linux**를 공식 지원한다.
- **언어:** 모든 소스 코드, 주석, README 문서는 **영어로 작성**한다.
- **저장소 경로:** 계정 프로필은 `~/.ccrotate/profiles.json`에 저장한다. `~/.claude/` 경로는 고정으로 사용한다.

### 4. 핵심 기능 (Core Features) - MVP Scope

### 4.1. 명령어 인터페이스 (CLI)

- **기본 명령어:** `ccrotate`
    - `ccrotate` 또는 `ccrotate help`: 사용법 안내를 표시한다. (안전한 기본 동작)
    - `ccrotate list` (`ls`): 저장된 모든 계정 목록을 표시한다.
    - `ccrotate snap`: 현재 계정 정보를 저장한다.
    - `ccrotate switch <email>`: 특정 계정으로 전환한다.
    - `ccrotate next`: 다음 사용 가능한 계정으로 순차 전환한다.
    - `ccrotate remove <email>` (`rm`): 저장된 계정을 삭제한다.

### 4.2. 기능별 명세

**A. `ccrotate snap` : 계정 정보 스냅샷**

- **고유 식별자:** 계정의 **이메일 주소**를 고유 키로 사용한다. (`~/.claude.json`의 `oauthAccount.emailAddress` 필드에서 추출)
- **수집 대상:**
    - `~/.claude/.credentials.json` 파일의 전체 내용
    - `~/.claude.json` 파일의 `userId` 및 `oauthAccount` 필드 전체
- **동작:**
    1. 현재 활성화된 계정의 이메일과 수집 대상 파일/필드 정보를 읽어온다.
    2. 동일 이메일이 이미 존재하면, 사용자에게 덮어쓰기 여부를 확인 (`y/N`) 후 업데이트한다. `--force` 플래그로 확인 절차를 생략할 수 있다.

**B. `ccrotate list` (`ls`) : 저장된 계정 목록 표시**

- **표시 정보:** 이메일, 마지막 사용일, 현재 활성화 계정 표시()

**C. `ccrotate switch <email>` : 특정 계정으로 전환**

- **동작:**
    1. 이메일로 전환할 계정을 선택한다.
    2. 데이터베이스에서 해당 계정 정보를 읽어온다.
    3. **원자적 파일 쓰기**로 `credentials.json` 등 관련 파일을 안전하게 교체한다.
    4. 전환 성공 메시지를 출력한다.

**D. `ccrotate next` : 순차 계정 전환**

- **동작:**
    1. 현재 활성화된 계정을 기준으로 `list` 순서에 따라 **다음 순번의 계정**을 선택한다. (리스트의 끝에 도달하면 처음으로 돌아감)
    2. 선택된 계정으로 `switch` 로직을 실행하여 전환한다.
    3. `[기존 계정] -> [새 계정]`으로 전환되었음을 알린다.

**E. `ccrotate remove <email>` (`rm`) : 계정 삭제**

- **동작:**
    1. 이메일로 삭제할 계정을 지정한다.
    2. 사용자에게 삭제 여부를 최종 확인 (`y/N`) 받는다.
    3. 데이터베이스에서 해당 계정 정보를 영구적으로 삭제한다.

### 5. 데이터 관리 (Data Management)

- **저장소:** 모든 계정 프로필 정보는 단일 JSON 파일(`~/.ccrotate/profiles.json`)에 평문으로 저장된다. 이는 원본 `claude-code`의 저장 방식과 일관성을 유지하기 위함이다.
- **데이터 구조:**
    
    ```json
    {
      "user1@example.com": {
        "credentials": { "...(credentials.json 전체 내용)..." },
        "userId": "...(사용자 ID)...",
        "oauthAccount": { "emailAddress": "user1@example.com", "...(기타 OAuth 정보)..." },
        "lastUsed": "2024-01-01T00:00:00.000Z"
      },
      "user2@example.com": {
        "credentials": { "...(credentials.json 전체 내용)..." },
        "userId": "...(사용자 ID)...",
        "oauthAccount": { "emailAddress": "user2@example.com", "...(기타 OAuth 정보)..." },
        "lastUsed": "2024-01-02T00:00:00.000Z"
      }
    }
    ```
    

### 6. 사용자 경험 및 에러 핸들링

- **최초 사용자:** `ccrotate list` 실행 시, "저장된 계정이 없습니다. `claude-code`로 로그인 후 `ccrotate snap`을 실행하여 첫 계정을 추가하세요." 와 같은 안내 메시지를 표시한다.
- **에러 메시지:** "파일 접근 권한이 없습니다.", "JSON 파싱에 실패했습니다." 등 오류 상황에 대해 사용자가 이해하기 쉬운 메시지를 출력한다.

### 7. 알려진 리스크 및 향후 고려사항

- **알려진 리스크 (매우 중요):**
    - **API 토큰 유형 문제:** 현재 사용하는 인증 토큰이 웹 세션용일 경우, 자동화된 요청으로 인해 Claude 서비스 약관에 위배되어 **계정이 정지될 위험**이 존재한다. 이는 v1 출시 후 최우선으로 분석 및 해결해야 할 과제이다.
- **향후 고려사항 (Post-MVP):**
    - Rate Limit 자동 감지 기능.
    - 계정별 우선순위 설정 등 고급 회전 전략.
