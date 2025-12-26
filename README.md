# Advanced Search Plugin for Obsidian

Obsidian용 고급 파일 검색 플러그인입니다. 파일명과 내용을 동시에 검색하고, 마크다운 파일에 포함된 이미지를 썸네일로 미리보기할 수 있습니다.

## 주요 기능

- **퍼지 검색 (Fuzzy Search)**: 파일명을 유연하게 검색
- **내용 검색 (Content Search)**: 파일 내용에서 텍스트 검색
- **이미지 썸네일**: 검색 결과에 파일의 첫 번째 이미지를 썸네일로 표시
- **컨텍스트 미리보기**: 검색어가 포함된 부분의 주변 텍스트를 미리보기
- **검색어 하이라이팅**: 검색 결과에서 검색어를 강조 표시
- **커스터마이징 가능**: 검색 딜레이, 결과 수, 컨텍스트 길이 등을 설정 가능

## 설치 방법

### 방법 1: 수동 설치

1. **Node.js 설치** (없는 경우)
   - [Node.js 공식 사이트](https://nodejs.org/)에서 다운로드하여 설치

2. **플러그인 빌드**
   ```bash
   cd obsidian-search-plugin
   npm install
   npm run build
   ```

3. **Obsidian vault에 설치**
   - 빌드가 완료되면 `main.js`, `manifest.json`, `styles.css` 파일이 생성됩니다
   - 이 파일들을 Obsidian vault의 `.obsidian/plugins/advanced-search-plugin/` 폴더에 복사합니다

   ```bash
   # Obsidian vault 경로 예시: /Users/username/Documents/MyVault
   mkdir -p /path/to/your/vault/.obsidian/plugins/advanced-search-plugin
   cp main.js manifest.json styles.css /path/to/your/vault/.obsidian/plugins/advanced-search-plugin/
   ```

4. **Obsidian에서 플러그인 활성화**
   - Obsidian 실행
   - Settings (설정) → Community plugins (커뮤니티 플러그인)
   - "Advanced Search" 플러그인 활성화

### 방법 2: 개발 모드 (실시간 수정)

개발하면서 실시간으로 테스트하고 싶은 경우:

1. **심볼릭 링크 생성**
   ```bash
   ln -s /path/to/obsidian-search-plugin /path/to/your/vault/.obsidian/plugins/advanced-search-plugin
   ```

2. **개발 모드로 실행**
   ```bash
   cd obsidian-search-plugin
   npm run dev
   ```

3. **Obsidian에서 테스트**
   - 코드를 수정하면 자동으로 빌드됩니다
   - Obsidian에서 `Ctrl + R` (또는 `Cmd + R`)로 플러그인을 리로드하세요

## 사용 방법

### 검색 모달 열기

다음 방법 중 하나로 검색 모달을 열 수 있습니다:

1. **단축키**: `Ctrl + Shift + F` (또는 `Cmd + Shift + F` on Mac)
2. **명령어 팔레트**: `Ctrl + P` → "Advanced Search" 검색
3. **리본 아이콘**: 왼쪽 사이드바의 검색 아이콘 클릭

### 검색하기

1. 검색 모달에 2글자 이상 입력
2. 검색 결과가 실시간으로 표시됩니다
3. 화살표 키로 결과 탐색, Enter로 파일 열기

### 검색 결과 구성

각 검색 결과는 다음 정보를 포함합니다:
- **파일명** (굵게 표시)
- **파일 경로** (작은 글씨)
- **매칭된 내용 미리보기** (검색어 강조)
- **이미지 썸네일** (파일에 이미지가 있는 경우)

## 설정

Settings → Advanced Search에서 다음을 조정할 수 있습니다:

- **Search Delay**: 검색 시작 전 대기 시간 (기본값: 300ms)
- **Maximum Results**: 표시할 최대 검색 결과 수 (기본값: 50)
- **Show Content Preview**: 내용 미리보기 표시 여부 (기본값: 켜짐)
- **Context Length**: 검색어 주변에 표시할 문자 수 (기본값: 100)

## 이미지 지원 형식

플러그인은 다음 형식의 이미지를 감지합니다:

- Markdown 스타일: `![alt text](image.png)`
- Wiki 스타일: `![[image.png]]`

## 개발 정보

### 기술 스택
- TypeScript
- Obsidian API
- esbuild (번들러)

### 프로젝트 구조
```
obsidian-search-plugin/
├── main.ts           # 플러그인 메인 코드
├── manifest.json     # 플러그인 메타데이터
├── styles.css        # 커스텀 스타일
├── package.json      # npm 설정
├── tsconfig.json     # TypeScript 설정
└── esbuild.config.mjs # 빌드 설정
```

### 주요 클래스

- **AdvancedSearchPlugin**: 메인 플러그인 클래스
- **AdvancedSearchModal**: 검색 모달 UI
- **AdvancedSearchSettingTab**: 설정 탭

## 트러블슈팅

### 플러그인이 보이지 않아요
- `.obsidian/plugins/advanced-search-plugin/` 폴더에 `main.js`, `manifest.json`, `styles.css` 파일이 있는지 확인
- Obsidian을 재시작해보세요

### 검색이 느려요
- Settings에서 "Maximum Results"를 줄여보세요
- "Search Delay"를 늘려보세요

### 이미지 썸네일이 안 보여요
- 이미지 경로가 올바른지 확인
- 상대 경로 또는 vault 내부 경로를 사용하세요

### Node.js가 없다고 나와요
- [Node.js 공식 사이트](https://nodejs.org/)에서 LTS 버전을 설치하세요

## 라이선스

MIT License

## 기여

버그 리포트나 기능 제안은 환영합니다!

---

**제작**: Obsidian Advanced Search Plugin
**버전**: 1.0.0
