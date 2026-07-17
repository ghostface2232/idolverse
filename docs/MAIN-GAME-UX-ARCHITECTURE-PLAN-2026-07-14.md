# Idolverse 메인 게임 UX·렌더링 아키텍처 개선 계획

> 작성일: 2026-07-14  
> 상태: 구현 착수 전 최종 조사·의사결정 문서  
> 범위: 회사 창단 완료 이후의 메인 게임 진행 화면, 주간 루프, React/Phaser 렌더링 경계, 모바일·데스크톱 정보 구조, 디자인 시스템, 아트 파이프라인, 접근성 및 성능  
> 관련 문서: [종합 리뷰](./REVIEW-2026-07-13.md), [살아있는 디오라마 제안](./DESIGN-living-diorama.md), [게임 설계 가이드](../GUIDE.md)

---

## 1. 요약 결론

현재 메인 게임 화면의 낮은 완성도는 단순히 픽셀 아트 자산이 부족해서 생긴 문제가 아니다. 더 근본적인 원인은 다음 네 가지다.

1. **주간 선택과 결과 사이의 인과관계가 화면에 보이지 않는다.**
2. **React와 Phaser가 같은 공간과 상태를 중복 해석하면서도 어느 쪽도 완전한 경험을 제공하지 못한다.**
3. **Phaser가 게임 월드가 아니라 상호작용 없는 애니메이션 배경으로 사용된다.**
4. **메인 화면이 플레이어에게 현재 목표, 위험, 다음 행동을 명확히 알려주지 않는다.**

따라서 권장 제품 구조는 다음과 같다.

> **React가 `브리핑 → 결정 → 검토 → 자동 수행 → 결과 → 다음 목표`의 경영 경험을 지휘하고, Phaser는 그 결정이 회사와 멤버에게 실제로 일어나는 모습을 공연한다.**

React와 Phaser의 혼합 자체는 문제가 아니다. 문제는 소유권 경계가 없다는 것이다. 최종 구조에서는:

- React가 HUD, 결정 카드, 계획 보드, 내비게이션, 시트, 모달, 통계, 접근성을 담당한다.
- Phaser가 사옥, 방, 시설, 캐릭터, 이동, 카메라, 파티클, 월드에 붙은 이모트와 선택 표시를 담당한다.
- Zustand만 영속 게임 상태를 소유한다.
- Phaser는 여러 도메인 store를 직접 구독하지 않고 하나의 최소 `SimulationProjection`만 소비한다.
- EventBus는 상태 전달이 아닌 일회성 표현 명령에만 사용한다.

Phaser를 당장 제거하거나 전체 UI를 Phaser로 이전하는 것은 권장하지 않는다. Idolverse가 목표로 하는 것이 멤버를 관찰하고 회사가 성장하는 모습을 보는 카이로소프트형 육성 게임이라면 Phaser는 여전히 적합하다. 다만 새로운 월드 아트에 대규모로 투자하기 전에 **연습실 한 방과 멤버 두 명으로 완성형 수직 슬라이스**를 만들고 명확한 품질 게이트를 통과시켜야 한다.

---

## 2. 조사 범위와 검증 방법

본 문서는 다음 근거를 교차 검토해 작성했다.

- 메인 게임 React 컴포넌트 및 공통 UI 컴포넌트 정적 감사
- Phaser lifecycle, scale, store subscription, entity rendering 및 EventBus 감사
- 창단·오디션 UI와 메인 게임 UI의 정보 구조·시각 언어 비교
- `public/images`의 시설·스태프 원본 자산 직접 검수
- 주간 처리, 결과 보고서, 이벤트 큐, 저장 시점 검토
- 카이로소프트 경영·육성 게임의 공식 설명 및 게임 루프 조사
- Phaser, React Aria, Motion 등 공식 기술 문서 검토
- 렌더링 아키텍처, 게임 UX, 디자인 시스템 세 분야의 독립 서브에이전트 분석 후 직접 교차 검증

검증 결과:

- `npm run check`: 성공
- `npm test`: 6개 테스트 파일, 30개 테스트 전부 성공
- `npm run build`: 성공
- 빌드 JS: 1,807.56kB, gzip 513.66kB, 단일 대형 청크 경고 발생
- 로컬 자동 브라우저 캡처는 브라우저 런타임 초기화 충돌로 수행하지 못함

따라서 구체적인 화면 체감에 관한 일부 판단은 실행 화면 캡처가 아니라 코드, DOM/Canvas 구성, 자산 및 레이아웃 구조를 근거로 한다. 구현 착수 전 Phase 0에서 실제 기기 기준선 캡처를 추가해야 한다.

---

## 3. 창단 화면과 메인 화면의 완성도 차이

창단 플로우가 완성품처럼 느껴지는 이유는 그래픽만이 아니다. 창단 화면에는 매 단계마다 명확한 상호작용 아크가 있다.

| 창단 화면 | 현재 메인 화면 |
|---|---|
| 기대 결과를 먼저 보여준다. | 이번 선택이 무엇을 바꿀지 바로 이해하기 어렵다. |
| 선택에 따라 비용·품질·적합도가 즉시 반응한다. | 선택과 WeekReport 결과 사이의 원인이 단절되어 있다. |
| `StepIndicator`로 현재 위치와 남은 과정이 명확하다. | 데뷔 조건, 투자사 목표, 다음 시즌 목표가 상시 보이지 않는다. |
| 스태프 초상, 시설 일러스트, 투자자 로고가 선택에 얼굴을 부여한다. | Phaser에는 임시 도형 캐릭터와 평면 방만 있다. |
| 선택 상태가 카드 전체, 링, 비용, CTA 비활성화로 함께 표현된다. | 결정 선택은 주로 테두리 색상 변화에 의존한다. |
| 화면 하단의 CTA가 다음 행동을 명확히 제시한다. | 결정 열기와 다음 주 진행이 나란히 있으나 전체 플레이 흐름이 설명되지 않는다. |

결론적으로 메인 화면에서 우선 고쳐야 하는 것은 색상이나 그림자가 아니라 다음 두 가지다.

1. **선택 → 결과 루프의 가시성**
2. **매주 하나의 에피소드로 느껴지는 시간적 리듬**

---

## 4. 현재 구현의 상세 문제

### 4.1 렌더러 소유권이 중복되어 있다

Phaser는 [SimulationScene.ts](../src/game/scenes/SimulationScene.ts)에서 세 개 방의 좌표를 계산하고, React는 [SimulationOverlay.tsx](../src/components/dashboard/SimulationOverlay.tsx)에서 별도의 3행 grid를 만들어 라벨을 배치한다.

- Phaser: `topPad = 12`, `roomGap = 10`, 3개 방 높이 계산
- React: `p-3`, `gap-2.5`, `grid-rows-3`

현재는 값이 우연히 유사해 보일 수 있지만 다음 상황에서 쉽게 어긋난다.

- 카메라 zoom 또는 flash
- viewport 높이 변화
- 방 수 증가
- landscape 레이아웃
- 월드 카메라 pan
- 방별 크기 차등 적용

활동을 방으로 변환하는 로직도 양쪽에 중복되어 있다.

- Phaser의 `ACTIVITY_TO_ROOM`
- React의 `activityArea()`

이 구조에서는 새로운 활동이나 방을 추가할 때 두 구현이 수동으로 동기화되어야 한다.

### 4.2 Phaser가 월드 역할을 하지 못한다

현재 Phaser 화면에는 다음이 없다.

- `setInteractive` 기반 멤버·방 선택
- pointer 또는 drag 입력
- 카메라 pan·snap
- 시설 상호작용
- 캐릭터 목적지 이동
- 활동별 애니메이션
- 선택된 멤버와 React 상세 패널의 연결

React overlay 역시 `pointer-events-none`이므로 중앙 월드는 실질적으로 클릭 불가능한 배경이다.

방 또한 실제 회사 공간이 아니라 React 카드 스타일을 Phaser `Graphics`로 다시 그린 세 개의 둥근 패널이다. 이는 Phaser 사용 비용을 지불하면서도 Canvas가 제공할 수 있는 공간성·동선·관찰 경험을 얻지 못하는 구조다.

### 4.3 캐릭터가 실제 상태를 충분히 갱신하지 않는다

현재 캐릭터는 여러 `Graphics`를 합쳐 만든 임시 도형이다. 다음 동기화 문제도 존재한다.

- 부상 마크는 캐릭터 생성 시에만 추가되므로 이후 `injuryWeeks` 변경을 반영하지 않는다.
- depth가 생성 당시 y 값으로 한 번만 설정되어 방 이동 후 다시 계산되지 않는다.
- 외부 활동 캐릭터는 `visible=false`가 되지만 무한 bob tween은 계속 실행된다.
- 기존 캐릭터는 위치만 갱신하며 표정, 부상, 현재 행동 등의 시각 상태를 diff하지 않는다.

### 4.4 Phaser lifecycle이 탭 UI와 맞지 않는다

[GameDashboard.tsx](../src/pages/GameDashboard.tsx)는 `activeTab === "dashboard"`일 때만 [PhaserGame.tsx](../src/game/PhaserGame.tsx)를 렌더링한다. 따라서 다른 탭으로 이동하면 `Phaser.Game` 전체가 파괴되고 돌아올 때 새로 생성된다.

이 방식은 다음 문제를 만든다.

- 자산 재로딩
- 카메라 위치와 선택 상태 소실
- event listener·tween lifecycle 복잡도 증가
- 탭 전환 비용 증가
- 추후 월드가 커질수록 모바일 메모리 churn 증가

게임 월드는 탭이 아니라 세션 수명에 맞춰 유지되어야 한다.

### 4.5 Scale 설정과 월드 레이아웃의 의미가 충돌한다

[balance.ts](../src/data/balance.ts)는 `baseWidth: 360`, `baseHeight: 640`을 논리 기준처럼 선언하지만 [PhaserGame.tsx](../src/game/PhaserGame.tsx)는 `Phaser.Scale.RESIZE`를 사용한다. `RESIZE`에서는 실제 Canvas 크기와 논리 game size가 부모 영역에 따라 바뀌므로 360×640은 고정 논리 해상도로 동작하지 않는다.

문제는 `RESIZE` 자체라기보다 viewport 크기에 맞춰 방 높이와 배치를 매번 재설계하는 것이다. 픽셀 월드는 고정 타일 좌표를 가져야 하고, 기기 차이는 카메라 viewport가 더 많이 또는 적게 보여주는 방식으로 처리해야 한다.

연습실 수직 슬라이스에서 다음 두 정책을 비교해야 한다.

1. `RESIZE` + 고정 타일 월드 + 정수 좌표·제한된 정수 zoom
2. 고정 논리 viewport + `FIT` + letterbox/crop 정책

단순히 모든 화면을 viewport 비율에 맞춰 늘리는 방식은 금지한다.

### 4.6 주간 선택과 결과가 연결되지 않는다

[DecisionCardDeck.tsx](../src/components/dashboard/DecisionCardDeck.tsx)는 카드 요약과 trade-off 문자열을 보여주지만 다음을 충분히 제공하지 않는다.

- 확정 비용과 확률 결과의 구분
- 어떤 멤버가 영향을 받는지
- 어떤 일정이 취소되는지
- 포지션·계절·투자자 보정의 근거
- 여러 선택의 일정 충돌
- 전체 계획의 예상 비용과 위험

[WeekReport.tsx](../src/components/WeekReport.tsx)는 결과를 문자열 목록과 재정 합계 중심으로 표시한다. `statChanges`는 타입에 존재하지만 실제 처리에서 계속 빈 배열로 시작하며 채워지지 않는다. `promotionResults`와 `awardResults`도 결과 모델에 비해 UI 표현이 충분하지 않다.

플레이어는 이전 값을 기억해야만 무엇이 변했는지 알 수 있다. 경영 게임에서 이것은 치명적인 피드백 단절이다.

### 4.7 주간 workflow가 React 로컬 상태에 묶여 있다

현재 다음 값이 `GameDashboard` 로컬 state에 있다.

- 선택 완료된 결정
- 결정 완료 여부
- 현재 WeekReport
- 이벤트 큐
- 시트 open 상태

시트 open 같은 순수 UI 상태는 로컬이어도 괜찮다. 그러나 선택 결과, pending event, 주간 resolution 상태는 게임 진행 정확성과 저장 복원에 관여하므로 로컬 state에 두면 안 된다.

특히 현재 흐름은 주간 처리 후 자동 저장을 먼저 수행하고 이벤트 선택을 나중에 적용한다. 이벤트 선택 결과가 즉시 저장되지 않으며, 새로고침하면 React event queue가 복원되지 않을 수 있다.

### 4.8 번들과 초기 로딩이 불필요하게 크다

[App.tsx](../src/App.tsx)는 `GameDashboard`를 정적 import하고, [EventBus.ts](../src/game/EventBus.ts)는 이벤트 emitter 하나를 위해 Phaser를 import한다. 따라서 로그인·메뉴·창단 단계에서도 Phaser가 메인 bundle에 포함된다.

`manualChunks`는 브라우저 cache에는 도움이 되지만 초기 다운로드를 자동으로 줄이지 않는다. 최우선은 다음이다.

- `GameDashboard`와 Phaser를 dynamic import
- 순수 presentation bus에서 Phaser 의존성 제거
- 창단 후반 또는 게임 로드 직전에 Phaser chunk prefetch

### 4.9 접근성·모바일 입력 기반이 부족하다

현재 공통 Modal과 BottomSheet는 시각적으로는 동작하지만 다음이 부족하다.

- 최초 focus
- focus trap
- 닫은 뒤 trigger focus 복귀
- background inert
- dialog title과 고유 id 연결
- 실제 swipe/snap 동작

추가 문제:

- 하단 탭은 활성 상태를 주로 색으로 표현하고 `aria-current`가 없다.
- 일부 활동 버튼과 닫기 버튼은 44px 미만이다.
- `maximum-scale=1.0`이 브라우저 확대를 제한한다.
- 전역 `min-width: 360px`은 더 좁은 viewport나 확대 상태에서 잘림을 만들 수 있다.
- Phaser flash·zoom·무한 bob에 reduced-motion 대응이 없다.
- Canvas 상태의 스크린리더 대체 경로가 없다.

---

## 5. 카이로소프트에서 채택할 경험과 버릴 경험

카이로소프트 게임에서 가져와야 할 것은 낡은 UI 외형이 아니라 관찰과 개입의 리듬이다.

공식 게임 설명에서 반복되는 구조는 다음과 같다.

- 인물·시설·장르·컨셉 조합을 선택한다.
- 캐릭터가 자동으로 활동하고 성장하는 모습을 본다.
- 짧은 결과와 보상을 얻는다.
- 새로운 시설, 조합, 인물, 목표가 해금된다.

참고 자료:

- [Game Dev Story App Store](https://apps.apple.com/us/app/game-dev-story/id396085661)
- [Pocket Academy 3 App Store](https://apps.apple.com/us/app/pocket-academy-3/id1623111026)
- [March to a Million Google Play](https://play.google.com/store/apps/details?id=net.kairosoft.android.ongaku2_en)
- [March to a Million 게임 매뉴얼 전사](https://kairosoft.wiki.gg/wiki/Transcript%3AManual_%28March_to_a_Million%29)

### 채택할 것

- 계속 살아 움직이는 작은 회사 세계
- 중요한 준비는 플레이어가 하고 세부 수행은 자동 처리하는 구조
- 미세 보상, 주간 결산, 시즌·어워드의 3단 피드백
- 멤버·포지션·화학·시설·컨셉 조합의 발견
- 회사와 공간의 장기적 성장 축적
- 귀여운 말풍선, 표정, 실패와 성공의 짧은 연출
- 해금, 수집 목록, 순위, 엔딩 점수, NG+

### 버릴 것

- 계층이 불명확한 중첩 전역 메뉴
- Canvas 안의 작은 텍스트와 정밀 버튼
- 진입 경로에 따라 행동이 달라지는 인물 상세 화면
- 확률·성장 한계·해금 조건·조합 효과의 과도한 은폐
- 읽는 동안에도 시간이 흐르는 UI
- 일반 결과까지 전부 막는 모달
- 모바일 화면의 단순 확대형 데스크톱 UI
- 시설 배치가 핵심 규칙이 아닌데도 자유 카메라와 정밀 편집을 강요하는 것

---

## 6. 목표 주간 경험

### 6.1 상태 머신

```text
PLANNING
  └─ 이번 주 브리핑, 3~4개 핵심 결정
       ↓
REVIEW
  └─ 일정 충돌, 총비용, 예상 위험, 매니저 기본안 확인
       ↓
PLAYBACK
  └─ 월~일 자동 수행 몽타주
       ├─ 선택형 사건 → AWAITING_EVENT → PLAYBACK 복귀
       └─ 완료
       ↓
SUMMARY
  └─ 선택 대비 결과, 경고, 다음 주 훅
       ↓
PLANNING
```

필수 규칙:

- pending event와 resolution 상태는 저장 가능해야 한다.
- 재생 중 앱을 닫아도 주간 진행이 중복 적용되지 않아야 한다.
- 스킵은 표현만 생략하며 결과 정보는 손실하지 않는다.
- Phaser는 게임 결과를 계산하지 않는다.

### 6.2 주간 브리핑

플레이어는 화면 진입 후 5초 안에 다음을 알 수 있어야 한다.

- 현재 주차와 계절
- 남은 핵심 결정 수
- 가장 위험한 문제 하나
- 투자사 대표 목표
- 다음 주요 일정과 D-day
- 예상 현금 여유

매주 강제 모달을 사용하지 않는다. 홈 하단의 접힌 `이번 주 보드`를 기본 진입점으로 한다.

### 6.3 결정 카드

360px에서는 한 번에 하나의 결정을 집중해서 보여준다.

각 선택지는 다음 정보를 제공한다.

- 대상 멤버 또는 그룹
- 행동 이름과 카테고리
- 확정 비용
- 기대 효과 중 핵심 1~2개
- 반드시 포기하는 것 1개
- 확률적 결과의 범위
- 투자자·계절·포지션·컨셉 보정 배지

예시:

```text
지우 예능 출연

대중 인지도  +280~420
예능 경험     상승
컨디션        -6 예상

기회비용: 이번 주 보컬 훈련 불가
보정: Variety 포지션 · 여름 예능 수요 +10%
```

정해진 비용과 손실은 정확히 공개한다. 확률적 결과만 범위로 표시한다. 숨은 친화도나 시장 불확실성은 매니저 능력에 따라 힌트 정확도를 다르게 할 수 있다.

### 6.4 계획 검토

결정을 모두 고른 뒤 다음을 한 번에 확인한다.

- 멤버별 일정 충돌
- 전체 비용과 예상 현금
- 팀 평균 컨디션 예상
- 팬덤 4축 변화 방향
- 투자사 목표 부합 여부
- 매니저가 배정한 나머지 업무
- 되돌리기, 개별 수정, 매니저에게 맡기기

드래그는 선택 기능이어야 하며 기본 조작은 탭이어야 한다.

### 6.5 자동 수행 몽타주

- 평범한 주: 약 1.2초
- 사건이 있는 주: 약 3~4초
- 탭 홀드 또는 명시적 스킵 버튼으로 즉시 완료

표현 내용:

- 멤버가 선택된 활동을 실제 방에서 수행
- 외부 활동 멤버가 사옥 밖으로 이동
- 좋은 화학은 협동 행동, 나쁜 화학은 거리감이나 충돌로 표시
- 성장·돈·팬 delta는 동시 최대 3개
- 부상·갈등·제안은 관련 멤버와 장소를 중심으로 cut-in
- 정보가 많은 결과는 모두 결산에 보존

### 6.6 주간 결산

기본은 전면 Modal이 아니라 하단 배너다.

첫 화면:

- 가장 큰 변화 3개
- 경고 1개
- 주간 등급 또는 헤드라인
- 다음 주 훅 1개

상세 화면:

- 결정별 예상 대비 실제 결과
- 멤버별 before/after
- 재정 카테고리 breakdown
- 팬덤 4축 변화와 주요 원인
- 이벤트·경쟁자·시장 변화

전체 화면을 허용할 사건:

- 데뷔
- 수상
- 멤버 탈퇴
- 파산 또는 계약 종료 위기
- 대형 스캔들

---

## 7. 권장 메인 화면 정보 구조

### 7.1 모바일 360px 기준

```text
┌──────────────────────────┐
│ Y1 W08 · 봄   ₩3.2억  알림 │  TopStatusBar
├──────────────────────────┤
│ 데뷔 평균 55/70 · 심사 D-5│  GoalStrip
├──────────────────────────┤
│                          │
│      살아 있는 사옥       │
│ 멤버·시설·행동·상태·관계   │  WorldViewport
│                          │
├──────────────────────────┤
│ 이번 주 결정 2/3          │
│ 경고: 민서 컨디션 위험     │  ActionDock
│ [계획 보기]   [주 진행]    │
├──────────────────────────┤
│ 회사  이번 주  멤버  시장  더보기 │
└──────────────────────────┘
```

월드는 평상시 사용 가능 높이의 약 40~50%를 차지한다. HUD에 모든 수치를 넣지 않는다. 투자사 유형에 따라 대표 목표 하나만 교체한다.

### 7.2 전역 내비게이션

1. **회사**: 사옥, 현재 행동, 예외 상태
2. **이번 주**: 결정, 계획, 일정, 프로젝트
3. **멤버**: 로스터, 포지션, 컨디션, 화학
4. **시장**: 팬덤, 계절, 차트, 경쟁 그룹
5. **더보기**: 재무, 스태프, 시설, 기록, 설정

앨범과 활동은 항상 보이는 전역 탭보다 `이번 주 프로젝트`나 상황별 ActionDock에서 진입하게 한다. 완성되지 않은 탭은 `준비 중` 화면으로 노출하지 않는다. 잠금이 게임 규칙이라면 해금 조건을 보여주고, 단순 미구현이라면 숨긴다.

### 7.3 태블릿·데스크톱

현재의 `max-w-md` 전화기 UI 단순 확대를 중단한다.

- 좌측 60~65%: 사옥 월드
- 우측 35~40%: 브리핑, 결정, 멤버 상세
- 하단 내비게이션은 좌측 navigation rail로 변환
- modal보다 side panel 우선
- 전체 최대 폭 약 1100~1200px
- 같은 상태와 행동을 유지하되 정보 밀도만 증가

---

## 8. 도메인별 UI 설계

### 8.1 멤버와 포지션

기본 카드에는 6개 능력치를 항상 펼치지 않는다.

기본 노출:

- 초상 또는 작은 sprite
- 주 포지션
- 현재 활동
- 컨디션·스트레스
- 현재 판단에 관련된 핵심 능력치 2~3개
- 부상·불만·갈등 위험 배지

상세 노출:

- visual, vocal, dance, charm, stamina, mental
- 포지션 적합도와 실제 성과 기여
- 최근 4주 변화
- 컨셉 만족·불만 이력
- 일정과 관계 경고

월드, 목록, 알림, 리포트 어디에서 멤버를 열어도 동일한 React 상세 시트를 사용한다.

### 8.2 화학

기본 화면에서 전체 관계망을 보여주지 않는다.

- 팀 효율 총점
- 가장 좋은 페어 2개
- 위험 페어 2개
- 최근 변화 원인

라인업이나 공동 활동 선택 중에는 `예상 팀 효율 +7/-12`처럼 결정에 직접 관련된 변화만 표시한다. 전체 행렬은 심화 분석 화면으로 둔다.

### 8.3 컨셉 적합과 불만

컴백 선택 화면에서 세 층을 함께 보여준다.

1. 계절 시장 수요
2. 그룹 전체 적합도
3. 멤버별 부적합과 누적 불만 위험

일회성 부적합과 반복 부적합에 따른 탈퇴 위험은 시각적으로 명확히 구분한다. 반복 횟수와 위험이 상승한 이유를 숨기지 않는다.

### 8.4 팬덤 4축

각 축은 다음을 가진다.

- 현재 값
- 주간 증감
- 가장 큰 변화 원인
- 현재 수익 또는 기회와의 연결

축:

- 대중 인지도
- 코어 팬덤
- 해외 팬덤
- 업계 평판

홈에는 대표 목표 또는 가장 크게 변한 축만 표시하고, 시장 화면에서 네 축을 비교한다.

### 8.5 투자자

투자사에 따라 홈 HUD의 대표 목표와 결정 추천 순서를 바꾼다.

- IT: 스트리밍·SNS 성장
- 엔터테인먼트: 무대·수상
- VC: ROI와 현금 흐름
- 화장품: 비주얼·광고
- 패션: 스타일·트렌드 적합

투자자 평가는 매주 modal이 아니라 목표 strip과 월·분기 결산으로 처리한다.

### 8.6 경쟁 그룹과 시즌

홈에는 다음 위협만 보여준다.

- 가장 가까운 경쟁자 컴백
- 겹치는 컨셉
- 현재 격차
- 팝업 그룹 등장

시장은 52주 타임라인으로 보여준다.

- 현재 위치
- 다음 계절까지 남은 주
- 예정 행사
- 컨셉 수요 예고
- 경쟁 그룹 컴백

전략적 대응 시간이 생기도록 최소 3~4주 전에 주요 시장 변화를 예고한다.

---

## 9. 목표 렌더링 아키텍처

```text
GameShell (React, 게임 세션 동안 유지)
├─ TopStatusBar / GoalStrip
├─ GameWorldHost
│  └─ Phaser.Game
│     ├─ WorldScene
│     │  ├─ tilemap / rooms / facilities
│     │  ├─ character entities
│     │  ├─ world labels / selection / emotes
│     │  └─ camera / input
│     └─ WeekPlaybackController
├─ ActionDock
├─ Navigation
├─ Member / Decision / Report sheets
└─ Accessibility mirror

Zustand domain stores
└─ SimulationProjectionCoordinator
   ├─ 최소 selector
   ├─ snapshot commit
   ├─ entity diff
   └─ typed presentation events
```

### 9.1 React 소유

- TopStatusBar와 GoalStrip
- 결정 카드와 계획 검토
- 멤버·재정·시장 데이터 패널
- BottomSheet, Dialog, Toast, Popover
- 전역 내비게이션
- 키보드·스크린리더 대체 경로
- 결과 상세와 기록

### 9.2 Phaser 소유

- 월드 공간과 좌표
- 방·가구·시설
- 캐릭터 sprite와 이동
- 월드 선택 링과 이모트
- 카메라 이동·zoom·shake
- 파티클과 짧은 cut-in
- 자동 수행 몽타주

### 9.3 Zustand 소유

- 영속 게임 상태
- 주간 결정 결과
- pending event queue
- week resolution 상태
- 저장·복원 가능한 결과 기록

### 9.4 EventBus 소유

허용:

- `playWeekTimeline`
- `skipPlayback`
- `focusEntity`
- `worldSelectionChanged`
- `playReaction`

금지:

- 돈, 팬덤, 멤버 능력치 등 영속 상태 전달
- 도메인 계산
- Phaser에서 React store를 대신 변경하는 비즈니스 로직

EventBus는 Phaser의 emitter에 의존할 필요가 없다. typed `EventTarget` 또는 작은 전용 emitter로 분리하여 메뉴·창단 bundle에서 Phaser import가 발생하지 않게 한다.

### 9.5 SimulationProjection

Phaser가 필요한 최소 데이터만 투영한다.

```ts
interface SimulationProjection {
  revision: number;
  rooms: RoomProjection[];
  entities: Array<{
    id: string;
    roomId: string | null;
    activity: TraineeActivity;
    injured: boolean;
    conditionBand: "low" | "mid" | "high";
    moodBand: "low" | "mid" | "high";
    visible: boolean;
  }>;
}
```

스탯·화학 전체 객체를 Phaser로 전달하지 않는다. 표현에 필요한 band와 상태만 계산한다. entity별 이전 projection과 다음 projection을 비교해 생성·삭제·이동·상태 변경을 분리한다.

### 9.6 주간 결과와 playback 분리

권장 순서:

1. 순수 함수가 `before`, `after`, structured report를 계산한다.
2. 도메인 상태는 정확히 한 번 commit한다.
3. presentation layer는 report를 기반으로 이전 상태에서 이후 상태로 넘어가는 모습을 재생한다.
4. 스킵 시 최종 projection을 즉시 적용한다.
5. 선택형 이벤트는 persistent queue에 저장하고 해결 직후 다시 autosave한다.

Phaser의 움직임이나 난수는 코스메틱이다. 게임 결과는 항상 시스템 순수 함수가 결정한다.

---

## 10. 디자인 시스템

### 10.1 토큰

현재 브랜드 색상 몇 개와 raw `slate-*` 조합을 다음 의미 토큰으로 확장한다.

```text
surface.world
surface.shell
surface.panel
surface.raised

text.primary
text.secondary
text.muted

action.primary
action.secondary

state.success
state.warning
state.danger
state.info

activity.training
activity.rest
activity.office
activity.external
```

색을 직접 의미로 사용하지 않는다. 위험과 선택은 색상+아이콘+텍스트로 표현한다.

### 10.2 반경과 표면

- 반경 체계: 8 / 12 / 16 / 24px
- 중첩 표면: `outer radius = inner radius + padding`
- 기본 카드: 낮은 명도의 1px outline과 약한 shadow
- 강한 테두리: 선택, 위험, focus에만 사용
- 기존 픽셀 버튼의 단단한 하단 shadow는 게임 행동 버튼에서 유지

### 10.3 타이포그래피

- Pretendard: 설명, 목록, 설정, 데이터 패널
- DungGeunMo: 게임 월드 라벨, 짧은 자원·행동 라벨, 주간 stamp
- 모든 공통 Button에 픽셀 폰트를 강제하지 않는다.
- dynamic number는 tabular numerals 유지
- heading은 `text-wrap: balance`, 짧은 설명은 `text-wrap: pretty` 유지
- Pretendard는 외부 CDN 대신 self-host 권장

### 10.4 모션

권장 토큰:

- press: 120ms
- 작은 상태 전환: 180ms
- sheet·panel: 240ms
- scene 전환: 320ms
- 결과 exit: enter보다 짧은 150ms 안팎

규칙:

- 인터랙티브 상태는 interruptible CSS/Motion transition
- 일회성 연출만 keyframe
- 버튼 press는 `scale(0.96)`
- `transition: all` 금지
- `will-change`는 실제 stutter가 확인된 transform/opacity/filter에만 사용
- reduced-motion에서는 zoom, flash, 큰 translate 제거

### 10.5 컴포넌트 계층

Foundations:

- `GameIcon`
- `PixelIcon`
- `GameText`
- `Surface`
- `Divider`
- `FocusRing`

Status:

- `ResourcePill`
- `StatusMeter`
- `DeltaValue`
- `RiskBadge`
- `NotificationDot`

Input:

- `GameButton`
- `IconButton`
- `ChoiceTile`
- `SegmentedControl`
- `GameTabs`

Overlay:

- `GameDialog`
- `GameSheet`
- `GamePopover`
- `GameTooltip`
- `GameToast`

Game domain:

- `MemberPortrait`
- `MemberChip`
- `RoomHotspot`
- `FacilityCard`
- `DecisionCard`
- `TradeoffRow`
- `WeekControl`

Layout:

- `GameShell`
- `TopStatusBar`
- `GoalStrip`
- `WorldViewport`
- `ActionDock`
- `BottomNav`

---

## 11. 권장 라이브러리

### 11.1 채택 권장

#### React Aria Components

용도:

- Button press 정규화
- Modal/Dialog focus management
- RadioGroup과 선택 카드 semantics
- Tabs와 GridList 키보드 조작
- background inert와 scroll lock

공식 문서:

- [React Aria Button](https://react-aria.adobe.com/Button)
- [React Aria Modal](https://react-aria.adobe.com/Modal/useModalOverlay)
- [React Aria RadioGroup](https://react-aria.adobe.com/RadioGroup)

React Aria와 Radix를 동시에 사용하지 않는다. Idolverse는 touch·keyboard·screen reader press를 통합하고 선택 카드의 semantics를 정리할 필요가 크므로 React Aria를 우선 권장한다.

#### Motion

용도:

- React sheet·panel enter/exit
- 선택 카드 전환
- layout transition
- 숫자 delta와 결과 banner
- reduced-motion 정책 통합

공식 문서:

- [AnimatePresence](https://motion.dev/docs/react-animate-presence)
- [useReducedMotion](https://motion.dev/docs/react-use-reduced-motion)

Phaser animation은 Phaser tween으로 유지하고 DOM animation만 Motion이 담당한다.

#### 아이콘

- `lucide-react`: 닫기, 뒤로가기, 설정, 검색 등 시스템 UI
- 별도 픽셀 atlas: 자원, 시설, 활동, 팬덤, 게임 상태

알파벳 탭 아이콘과 emoji를 최종 화면에 남기지 않는다.

#### Variant 유틸

- `class-variance-authority`
- `clsx`
- `tailwind-merge`

Button, Surface, Badge, Choice variant를 타입화한다.

#### 기존 Howler

이미 설치된 Howler를 사용한다.

- 버튼·카드·주 진행·이벤트·수상 SFX
- 계절 또는 상황별 BGM
- 음악·효과음·진동 설정 분리

### 11.2 조건부 도입

- `@tanstack/react-virtual`: 이벤트 기록·랭킹·팬 로그가 약 50~100개 이상일 때만
- Recharts: 여러 시계열과 tooltip이 필요한 전용 분석 화면이 생길 때만
- Storybook 또는 `/ui-lab`: 360/390/430px, 긴 한국어, 큰 숫자, 빈 상태, 위험 상태 fixture 검증

### 11.3 개발·검증 도구 권장

| 패키지 또는 도구 | 구분 | 도입 시점 | 목적 | 판단 |
|---|---|---|---|---|
| `@storybook/react-vite` | devDependency | Phase 2 | UI primitives와 게임 도메인 컴포넌트를 실제 게임 상태와 분리해 검수 | 권장. 팀 규모가 작아 설치 비용이 부담되면 `/ui-lab` route로 대체 |
| `@storybook/addon-a11y` | devDependency | Phase 2 | 컴포넌트별 axe 접근성 검사 | Storybook 사용 시 함께 도입 |
| `@playwright/test` | devDependency | Phase 2~3 | 320/360/390/430px, landscape, keyboard, 저장 복원 E2E | 권장 |
| `@axe-core/playwright` | devDependency | Phase 2~3 | 렌더된 화면의 자동 접근성 회귀 검사 | Playwright와 함께 권장. 수동 검사 대체는 불가 |
| `rollup-plugin-visualizer` | devDependency | Phase 3 | Phaser lazy split과 UI library 추가 후 bundle 구성 검증 | 권장. CI 산출물은 필요할 때만 생성 |
| `sharp` | devDependency | Phase 4 | 이미지 크기·포맷·alpha·atlas 규격 검증, WebP 파생본 생성 | 권장. 원본 픽셀 sprite에는 보간 resize 금지 |
| Aseprite CLI | 외부 제작 도구 | Phase 4 | sprite frame tag와 PNG/JSON export 자동화 | 픽셀 캐릭터 제작 시 권장 |
| Tiled | 외부 제작 도구 | Phase 4 | 방 tilemap, collision, marker layer 제작 | 월드를 tilemap으로 확정할 경우 권장 |
| TexturePacker 또는 Aseprite atlas export | 외부 제작 도구 | Phase 4 | Phaser atlas PNG+JSON 생성 | 둘 중 하나만 채택 |

공식 참고:

- [Lucide](https://lucide.dev/)는 개별 아이콘 import와 tree shaking을 지원한다.
- [Storybook a11y addon](https://storybook.js.org/docs/writing-tests/accessibility-testing)은 컴포넌트 개발 단계의 axe 검사를 제공한다.
- [Playwright 접근성 검사](https://playwright.dev/docs/accessibility-testing)는 `@axe-core/playwright`를 이용한 화면 단위 검사를 지원한다.
- [Sharp](https://sharp.pixelplumbing.com/)는 PNG·WebP·AVIF 변환과 metadata 검증에 사용할 수 있다.

### 11.4 실제 dependency 도입안

Phase 2에서 한 번에 설치할 후보:

```text
dependencies
  react-aria-components
  motion
  lucide-react
  class-variance-authority
  clsx
  tailwind-merge

devDependencies
  @playwright/test
  @axe-core/playwright
  rollup-plugin-visualizer
```

Phase 4에서 asset pipeline이 확정된 뒤 추가할 후보:

```text
devDependencies
  sharp
  @storybook/react-vite       # Storybook 채택 시
  @storybook/addon-a11y       # Storybook 채택 시
```

버전은 문서에 고정하지 않는다. 실제 도입 시점에 React 19, Vite 7, Tailwind 4와의 peer dependency를 확인하고 `pnpm-lock.yaml`로 정확히 고정한다. 신규 의존성은 한 단계씩 추가하고 각 단계마다 다음을 확인한다.

- production bundle 증분
- tree shaking 여부
- React 19 warning
- 모바일 touch behavior
- SSR이 아닌 Vite SPA 환경에서의 focus·portal 동작

### 11.5 비권장

- MUI, Ant Design, Chakra: 관리 SaaS와 유사한 외형이 되기 쉽다.
- shadcn/ui 외형 그대로 사용: 프로젝트 고유 표면이 약해진다.
- PixiJS 즉시 교체: 현재의 경계 중복과 UX 부재를 해결하지 않는다.
- 모든 화면의 선제적 가상화와 대형 chart library 도입

---

## 12. 아트워크·스프라이트·아이콘 상세 명세

기존 자산 검수 결과:

- 시설 이미지는 2×2 등급 선택용 고해상도 일러스트다.
- 스태프 이미지는 초상화 spritesheet다.
- 움직이는 멤버 월드 sprite는 없다.
- 시설 시트를 64×64 animation frame으로 로드한다는 BootScene TODO는 실제 자산 구조와 맞지 않는다.

따라서 기존 시설·스태프 이미지를 게임 월드 atlas로 그대로 재사용한다는 가정은 폐기한다. 선택 카드·상세 화면에는 계속 사용할 수 있지만 월드에는 별도 자산이 필요하다.

### 12.1 권장 디렉터리 구조

모든 runtime image URL은 `assetUrl()`을 통해 생성한다. CDN bucket도 아래 `public/images` 구조를 그대로 미러링한다.

```text
public/images/
├─ game/
│  ├─ manifests/
│  │  ├─ world-assets.json
│  │  ├─ character-atlases.json
│  │  └─ ui-assets.json
│  ├─ world/
│  │  ├─ tilesets/
│  │  │  ├─ company-interior.png
│  │  │  ├─ company-exterior.png
│  │  │  └─ seasonal-props.png
│  │  ├─ maps/
│  │  │  ├─ practice-room.json
│  │  │  ├─ dorm-room.json
│  │  │  ├─ office-room.json
│  │  │  └─ recording-room.json
│  │  ├─ facilities/
│  │  │  ├─ practice-atlas.png
│  │  │  ├─ practice-atlas.json
│  │  │  ├─ dorm-atlas.png
│  │  │  ├─ dorm-atlas.json
│  │  │  ├─ office-atlas.png
│  │  │  └─ office-atlas.json
│  │  └─ backdrops/
│  │     ├─ company-spring.webp
│  │     ├─ company-summer.webp
│  │     ├─ company-fall.webp
│  │     └─ company-winter.webp
│  ├─ characters/
│  │  ├─ body/
│  │  │  ├─ body-feminine-01.png
│  │  │  ├─ body-feminine-01.json
│  │  │  ├─ body-masculine-01.png
│  │  │  └─ body-masculine-01.json
│  │  ├─ hair/
│  │  ├─ outfits/
│  │  ├─ staff/
│  │  ├─ portraits/
│  │  └─ shadows/
│  ├─ effects/
│  │  ├─ emotes-atlas.png
│  │  ├─ emotes-atlas.json
│  │  ├─ particles-atlas.png
│  │  └─ particles-atlas.json
│  ├─ ui/
│  │  ├─ icons/
│  │  │  ├─ resources.png
│  │  │  ├─ activities.png
│  │  │  ├─ fandom.png
│  │  │  ├─ status.png
│  │  │  └─ facilities.png
│  │  ├─ frames/
│  │  │  ├─ decision-card-9slice.png
│  │  │  ├─ speech-bubble-9slice.png
│  │  │  └─ report-stamp-atlas.png
│  │  └─ badges/
│  └─ cutins/
│     ├─ debut/
│     ├─ awards/
│     ├─ scandal/
│     └─ investor/
├─ facilities/                 # 기존 창단 선택용 이미지 유지
├─ investors/                  # 기존 투자사 이미지 유지
└─ staff/                      # 기존 스태프 초상 시트 유지

src/
├─ components/icons/           # Lucide wrapper와 접근 가능한 DOM icon
├─ data/assetManifest.ts       # 논리 asset key와 상대 경로
├─ game/assets/                # Phaser preload·atlas key 정의
└─ game/world/                 # map schema, marker, animation name 계약
```

Manifest JSON까지 CDN으로 교체할 필요가 없다면 `src/data/assetManifest.ts`에 정적으로 두고 image URL만 `assetUrl()`로 생성하는 편이 타입 안전하다. 외부 JSON manifest를 사용할 경우에도 URL은 `assetUrl()`을 거쳐야 한다.

### 12.2 공통 픽셀 규격

권장 기준은 **16×16 논리 tile + 2배 정수 표시**다.

| 항목 | 권장 규격 | 비고 |
|---|---|---|
| 기본 tile | 16×16 logical px | 벽·바닥·소형 소품 기준 |
| 기본 렌더 배율 | 2× | 16px tile을 약 32 CSS px로 표시. 기기별 정책은 Phase 3 spike에서 확정 |
| 캐릭터 frame | 16×24 logical px | 화면 표시 약 32×48px. 머리·몸·발 pivot 통일 |
| 큰 캐릭터 frame 대안 | 24×32 logical px | 표정과 의상 식별이 부족할 때만 채택. 한 프로젝트 안에서 혼용 금지 |
| pivot | frame bottom-center | 모든 body/hair/outfit layer가 동일 pivot 사용 |
| 이동 좌표 | 정수 logical px | sub-pixel 배치 금지 |
| sampling | nearest | sprite texture에 bilinear filtering 금지 |
| sprite format | PNG RGBA | 투명 pixel art. 손실 압축 금지 |
| 대형 배경·cut-in | WebP, 필요 시 PNG | 투명도가 없고 픽셀 경계가 중요하지 않은 대형 이미지 |
| 색 공간 | sRGB | export tool마다 색 변화가 생기지 않도록 통일 |
| 여백 | frame 간 1~2px extrusion | atlas bleeding 방지. packer 설정으로 자동 생성 가능 |

Phase 4 이전에 16×24와 24×32 캐릭터를 360px 실제 기기에 각각 렌더하여 이름 없이도 멤버를 구분할 수 있는지 확인한다. 더 큰 frame을 선택하면 월드에 동시에 표시할 수 있는 인원과 방의 크기가 줄어든다.

### 12.3 캐릭터 월드 스프라이트

#### 공용 frame tag 계약

모든 body, hair, outfit layer는 동일 frame tag와 frame count를 가져야 한다.

| Animation tag | 방향 | frame | 우선순위 | 사용 위치 |
|---|---:|---:|---|---|
| `idle-down` | 1 | 2 | P0 | 기본 대기 |
| `idle-up` | 1 | 2 | P1 | 벽·시설을 바라볼 때 |
| `idle-side` | 좌우 flip | 2 | P0 | 기본 대기·대화 |
| `walk-down` | 1 | 4 | P0 | 방 안 이동 |
| `walk-up` | 1 | 4 | P0 | 시설 접근 |
| `walk-side` | 좌우 flip | 4 | P0 | 방 사이 이동 |
| `train-vocal` | 1 | 4 | P0 | 보컬 훈련 |
| `train-dance` | 1 | 4~6 | P0 | 댄스 훈련 |
| `rest` | 1 | 4 | P0 | 숙소·휴식 |
| `talk` | 1 | 2~4 | P1 | 멤버·스태프 대화 |
| `celebrate` | 1 | 4 | P1 | 성공·수상·성장 |
| `frustrated` | 1 | 2~4 | P1 | 갈등·불만 |
| `injured` | 1 | 2 | P1 | 부상 상태 |
| `perform` | 1 | 6~8 | P2 | 무대·컴백 cut-in |

P0 수직 슬라이스의 최소 frame 수는 약 24~30 frame이다. 모든 행동을 처음부터 만들지 않는다.

#### 조합형 캐릭터 구조

오디션으로 생성되는 멤버 수가 많으므로 멤버마다 완전한 sprite sheet를 따로 제작하는 방식은 확장성이 낮다. 권장 레이어:

1. body type
2. skin tone
3. hair style + hair palette
4. training outfit
5. casual outfit
6. stage outfit
7. 선택적 accessory

각 layer는 같은 atlas layout과 animation tag를 사용한다. runtime에서 여러 sprite layer를 같은 container에 겹친다. 성능 문제가 확인되면 조합 결과를 RenderTexture 또는 build-time atlas로 bake한다.

게임 상태에는 최소한 다음 appearance 정보가 필요하다.

```ts
interface TraineeAppearance {
  bodyType: string;
  skinTone: string;
  hairStyle: string;
  hairPalette: string;
  casualOutfit: string;
  trainingOutfit: string;
  stageOutfit?: string;
  accessory?: string;
  appearanceSeed: number;
}
```

현재 ID hash로 머리 색을 즉석 생성하는 방식은 임시 구현으로 한정한다. appearance는 save snapshot에 포함되어야 하며 로드할 때 외형이 바뀌면 안 된다.

### 12.4 멤버 초상화

| 자산 | 규격 | 포맷 | 위치 | 사용 화면 |
|---|---|---|---|---|
| 멤버 작은 초상 | 64×64 또는 96×96 | PNG | `game/characters/portraits/thumb/` | 리스트, DecisionCard, 알림 |
| 멤버 상세 초상 | 192×192 | PNG/WebP | `game/characters/portraits/detail/` | 멤버 상세 sheet |
| 상태 variant | 기본·기쁨·걱정·피로 최소 4종 | PNG 또는 layered composition | 같은 디렉터리 | 대사·이벤트·결산 |
| 실루엣 fallback | 동일 규격 | PNG | `game/characters/portraits/fallback/` | asset 실패, 미공개 후보 |

고정 후보만 존재한다면 인물별 초상 제작이 가능하지만 절차적으로 생성되는 오디션 멤버라면 다음 중 하나를 선택해야 한다.

- 월드 sprite 조합과 동일한 appearance layer를 이용해 초상을 합성
- 얼굴형·헤어·의상 portrait part를 조합
- 제한된 portrait pool을 성별·외형 seed에 따라 배정

초상화와 월드 sprite의 머리색·헤어·피부톤이 불일치하지 않아야 한다.

### 12.5 방·시설 자산 목록

| 우선순위 | 공간 | 필수 자산 | 상태·등급 | 권장 위치 |
|---|---|---|---|---|
| P0 | 연습실 | 바닥, 벽, 거울, 스피커, 마이크, 키보드, 의자, 문, 표시등 | studio level 1~4, 사용 중, 고장/과밀 | `game/world/facilities/practice-*` |
| P1 | 숙소 | 침대, 소파, 식탁, 냉장고, 욕실 진입부, 개인 소품 | dorm level 1~4, 휴식, 과밀 | `game/world/facilities/dorm-*` |
| P1 | 사무실 | 매니저 desk, PC, 서류, 회의 테이블, 투자자 연락 표시 | office 기본, 업무 중, 긴급 제안 | `game/world/facilities/office-*` |
| P1 | 녹음실 | booth, mic, console, headphone, producer desk | studio level과 연동, 앨범 제작 | `game/world/facilities/recording-*` |
| P2 | 라운지 | vending, sofa, fan board, trophy shelf | 관계·휴식·수상 누적 | `game/world/facilities/lounge-*` |
| P2 | 외부 방송국 | 대기실, 촬영 stage, camera, cue light | 예능·광고 활동 | `game/world/facilities/broadcast-*` |
| P2 | 공연장 | backstage, stage, audience tiles, light rig | 쇼케이스·음방·수상 | `game/world/facilities/stage-*` |

시설 등급은 단순 색상 교체가 아니라 실루엣과 밀도, 동시 사용 가능 인원, 장비 품질이 한눈에 달라져야 한다. 각 등급에서 모든 tile을 새로 만들기보다 base room 위에 upgrade prop layer를 추가하는 방식이 효율적이다.

### 12.6 Tilemap layer 계약

Tiled를 사용할 경우 각 map은 다음 layer name을 유지한다.

```text
floor             바닥
walls             벽과 고정 구조
furniture_back    캐릭터 뒤에 그릴 가구
walkable          이동 가능 영역 또는 collision metadata
markers           spawn, station, doorway, camera anchor
furniture_front   캐릭터 앞을 가리는 가구
effects           조명·환경 효과 marker
```

Marker object type 예시:

```text
spawn.trainee
spawn.staff
station.vocal
station.dance
station.rest
door.practice
door.dorm
camera.room-center
```

Phaser scene에 room별 좌표와 station 위치를 하드코딩하지 않는다.

### 12.7 아이콘 전체 목록

#### 시스템 UI: Lucide 사용

| 기능 | 예시 아이콘 | 위치 |
|---|---|---|
| 뒤로가기 | ArrowLeft | PanelHeader, detail sheet |
| 닫기 | X | Dialog, Sheet |
| 알림 | Bell | TopStatusBar |
| 설정 | Settings | 더보기 |
| 검색 | Search | 멤버·기록 검색 |
| 펼치기 | ChevronDown/Up | 상세 breakdown |
| 편집 | Pencil | 계획 수정 |
| 잠금 | Lock | 해금 조건 |

Lucide는 시스템 동작에만 사용한다. 게임 세계의 자원과 상태까지 Lucide로 통일하면 고유성이 약해진다.

#### 게임 전용 픽셀 아이콘

기본 규격:

- 16×16 source + 24×24 또는 32×32 표시 variant
- PNG atlas 또는 직접 제작한 pixel SVG
- active/inactive를 별도 그림으로 만들기보다 색 token과 CSS/Phaser tint 사용
- 실루엣만으로 16px에서 식별되어야 함

| 그룹 | 필요한 아이콘 | 사용 위치 |
|---|---|---|
| 자원 | 돈, 앨범 판매, 음원, 티켓, 시간 | HUD, 재정, 결산 |
| 능력치 | visual, vocal, dance, charm, stamina, mental | 멤버 카드, 훈련, 결과 |
| 활동 | 그룹 훈련, 개인 레슨, 휴식, 휴가, 예능, 녹음, 촬영, 공연 | 결정 카드, 월드 상태, 일정 |
| 팬덤 | public, core, global, industry | 시장, HUD 목표, 결과 |
| 관계 | 좋은 화학, 갈등, 친밀, 거리감 | 멤버·계획·월드 emote |
| 상태 | condition, stress, mood, injury, dissatisfaction, departure risk | RiskBadge, 월드 emote |
| 투자사 | streaming/SNS growth, stage/award, investment returns, visual, fashion/trend | GoalStrip, 결정 보정 |
| 시즌 | 봄, 여름, 가을, 겨울 | TopStatusBar, 52주 timeline |
| 결과 | 상승, 하락, 유지, 예상 초과, 예상 미달 | DeltaValue, WeekSummary |
| 시설 | 연습실, 숙소, 사무실, 녹음실, 라운지, 방송국, 무대 | 월드·시설 관리 |

### 12.8 이모트·파티클·선택 표시

| 자산 | frame/규격 | 우선순위 | 사용 |
|---|---|---|---|
| 선택 ring | 24×12 logical, 2~4 frame pulse | P0 | 선택된 캐릭터 발 아래 |
| shadow | 12×4 또는 16×6 | P0 | 공용 캐릭터 shadow |
| musical note | 8×8, 3 frame | P0 | 보컬·기분 좋음 |
| sweat | 8×8, 2~3 frame | P0 | 피로·훈련 |
| sleep | 8×8, 3 frame | P0 | 휴식 |
| conflict | 12×12, 3~4 frame | P1 | 저화학 조우 |
| injury | 12×12, 2 frame | P1 | 부상 |
| dissatisfaction | 12×12, 2~4 frame | P1 | 컨셉 불만 |
| hearts | 12×12, 4 frame | P1 | 좋은 화학 |
| money delta | 8×8 particle | P1 | 수입·지출 |
| confetti | 8×8 조각 atlas | P2 | 데뷔·수상 |
| scandal alert | 16×16, 4 frame | P2 | 대형 사건 |

동시 표시 상한은 모바일 기준 3개다. 우선순위는 `부상·탈퇴 위험 > 선택 결과 > 성장 > 코스메틱`이다.

### 12.9 UI frame·배지·cut-in

| 자산 | 규격 | 포맷 | 위치 | 사용 |
|---|---|---|---|---|
| speech bubble 9-slice | center 8×8 + border | PNG | `game/ui/frames/` | 월드 말풍선 |
| decision frame 9-slice | 최소 24px corner | PNG | `game/ui/frames/` | 위기·일반 결정 frame |
| report stamp | S/A/B/C/D 각 32~48px | PNG atlas | `game/ui/frames/` | 주간 결산 |
| 시즌 badge | 24×24 | PNG atlas | `game/ui/badges/` | HUD·timeline |
| 데뷔 cut-in | 기준 720×400 | WebP/PNG | `game/cutins/debut/` | 전체 화면 특별 사건 |
| 수상 cut-in | 기준 720×400 | WebP/PNG | `game/cutins/awards/` | 어워드 |
| 스캔들 cut-in | 기준 720×400 | WebP/PNG | `game/cutins/scandal/` | 대형 위기 |
| 투자자 cut-in | 기준 720×400 | WebP/PNG | `game/cutins/investor/` | 계약·점검 |

Cut-in은 모바일 화면 전체를 항상 채우지 않고 안전한 crop 영역을 정의한다. 텍스트를 이미지에 굽지 않는다. 번역과 접근성을 위해 제목·설명은 React가 렌더링한다.

### 12.10 계절·회사 성장 시각 자산

계절은 배경색 교체만으로 표현하지 않는다.

- 봄: 창가 햇빛, 식물, 밝은 poster
- 여름: 강한 광원, 선풍기·음료·축제 poster
- 가을: 따뜻한 조명, 어워드 준비 board
- 겨울: 창밖 눈, 난방 소품, 연말 장식·트로피

회사 성장 표현:

- 벽·바닥 마감 품질
- equipment 밀도
- trophy·album shelf 누적
- 직원 수와 desk 증가
- 팬 선물·화환·포스터
- 외부 전경의 건물 규모

성장 자산은 시설 level과 회사 milestone에 연결하고 단순 무작위 장식으로 두지 않는다.

### 12.11 자산별 우선순위와 납품 묶음

#### Art Pack A — 수직 슬라이스 필수

- 연습실 tilemap 1개
- 연습실 기본 prop 12~20개
- 멤버 body 2 type
- hair 6~8종
- training outfit 3종
- idle/walk/train-vocal/train-dance
- shadow, selection ring
- note, sweat, sleep emote
- 능력치·활동 핵심 아이콘
- 멤버 portrait 조합 prototype

#### Art Pack B — 코어 루프

- 숙소·사무실·녹음실
- casual outfit
- rest/talk/frustrated/injured
- 팬덤·투자자·시즌 아이콘
- speech bubble, report stamp
- 시설 level 1~4 prop layer

#### Art Pack C — 데뷔 이후

- 방송국·공연장
- stage outfit
- perform/celebrate
- debut·award·scandal cut-in
- confetti·stage light·audience effect
- 계절 variation

### 12.12 자산 검수 체크리스트

- 모든 image URL이 `assetUrl()`을 사용한다.
- atlas PNG와 JSON의 frame name이 animation contract와 일치한다.
- body/hair/outfit layer의 frame 크기·pivot·tag가 동일하다.
- transparent edge에 반투명 halo가 없다.
- nearest sampling에서 1×·2×·3× 모두 경계가 선명하다.
- 360px 실제 기기에서 멤버 실루엣을 구분할 수 있다.
- color만으로 상태를 구분하지 않는다.
- cut-in에 텍스트가 baked-in 되어 있지 않다.
- portrait와 월드 sprite의 외형 seed가 일치한다.
- 4개 시설 level이 실루엣과 prop 밀도만으로도 구분된다.
- 개별 이미지 용량과 전체 preload budget을 기록한다.
- 누락 asset에는 fallback frame이 존재한다.

### 12.13 제작 순서

1. pixel scale과 캐릭터 frame 크기 비교 렌더
2. 연습실 tilemap과 prop
3. 공용 캐릭터 body·hair·outfit layer 정책
4. idle/walk/train
5. shadow, selection ring, 핵심 emote
6. React 멤버 sheet와 portrait 연결
7. 주 진행 후 활동·상태 변화
8. 품질 승인 후 Art Pack B
9. 데뷔 콘텐츠 연결 후 Art Pack C

처음부터 전체 사옥을 저품질로 채우지 않는다.

---

## 13. 성능과 번들 전략

### 13.1 초기 로딩

- `GameDashboard` dynamic import
- Phaser chunk dynamic import
- EventBus에서 Phaser import 제거
- 창단 마지막 단계나 저장 슬롯 선택 시 Phaser chunk prefetch
- 메뉴와 창단은 Phaser 없이 완전히 동작

### 13.2 runtime

- 게임 세션당 Phaser instance 하나
- 탭·전체 sheet에서 scene sleep/pause
- `visibilitychange`에서 pause
- projection selector는 실제 필요한 field만 구독
- hidden entity tween·animation 중지
- asset atlas 사용으로 Graphics object 수 감소
- 저사양 모바일 목표 30fps, input feedback 100ms 이내

### 13.3 테스트 기준

- 대시보드↔다른 탭 50회 전환 후 instance·listener·메모리 증가 없음
- 주 진행 100회 후 entity container 누수 없음
- 360×640, 390×844, 412×915, landscape에서 layout 겹침 없음
- 느린 CDN에서 preload progress와 fallback 표시
- Phaser chunk 로드 실패 시 명확한 재시도 UI

---

## 14. 접근성·모바일 입력

### 기본 규칙

- 핵심 touch target 44×44px 이상
- hover 전용 필수 정보 금지
- long press에만 존재하는 필수 기능 금지
- swipe는 항상 명시적 버튼 대안 제공
- 핵심 CTA는 하단 thumb zone
- Canvas가 장식이면 `aria-hidden`
- Canvas 상호작용에는 동일 기능의 DOM 명령 패널 제공
- 중요 결과만 `aria-live="polite"`로 요약
- 지속적인 숫자 애니메이션 전체를 읽게 하지 않음

### Modal과 Sheet

- 고유 title id
- 최초 focus
- focus containment
- trigger focus 복원
- background inert
- Escape와 명시적 닫기
- 닫기 버튼 44px
- mobile keyboard 높이 대응

### reduced motion

줄이거나 제거할 항목:

- camera flash
- 큰 zoom
- screen shake
- 무한 bob
- parallax

대체:

- opacity
- color highlight
- 짧은 outline pulse
- instant state update

### viewport

- `maximum-scale=1.0` 제거
- 전역 `min-width: 360px` 제거
- 360px은 디자인 기준이지 기술적 최소 폭이 아님
- safe-area 책임은 `GameShell` 한 계층에만 둠
- scroll lock은 전역 html/body가 아니라 게임 shell과 overlay가 관리

---

## 15. 최적 구현 순서

### Phase 0 — UX 계약과 기준선 확정

구현 산출물: [PHASE-0-MAIN-GAME-UX-CONTRACT-2026-07-14.md](./PHASE-0-MAIN-GAME-UX-CONTRACT-2026-07-14.md)

예상: 2~3일

작업:

- 360/390/430px 및 desktop 현재 화면 캡처
- 주간 결정 완료까지 tap 수 기록
- 주요 정보 인지 시간 측정
- 새 IA와 한 화면 wireframe 승인
- 정상 주, 위기 주, 이벤트 주 상태 흐름 승인

완료 기준:

- 신규 사용자가 5초 안에 다음 행동을 찾음
- 제품 팀이 전역 navigation과 주간 상태 머신에 합의

### Phase 1 — 결과 데이터와 workflow 기반

예상: 4~6일

작업:

- `WeekDelta` 또는 동등한 structured result 모델
- `source`, `target`, `before`, `after`, `day`, `severity` 정의
- `statChanges` 실제 생성
- 결정별 예상 대비 실제 결과 연결
- pending event queue 영속화
- 주간 resolution 상태 머신
- 이벤트 선택 직후 autosave

완료 기준:

- 모든 결과 변화의 원인을 추적 가능
- 이벤트 도중 새로고침 후 정확히 복원
- 같은 주가 두 번 적용되지 않음

### Phase 2 — React 디자인 기반과 GameShell

예상: 5~7일

작업:

- semantic token
- React Aria 기반 Button/Dialog/Sheet/Choice/Tabs
- `TopStatusBar`, `GoalStrip`, `WorldViewport`, `ActionDock`, `BottomNav`
- 새 전역 IA
- 결정 한 장씩 진행 + 최종 계획 검토
- Phaser 없이도 주간 loop를 완주할 수 있는 임시 world surface

완료 기준:

- 360px에서 잘림 없음
- 모든 핵심 touch target 44px
- keyboard와 screen reader로 결정→진행→결산 완주

### Phase 3 — React/Phaser 경계 재구성

예상: 4~6일

작업:

- persistent `GameWorldHost`
- `SimulationProjectionCoordinator`
- typed presentation bus
- Phaser lazy import
- store selector 최소화
- assetUrl 기반 Phaser loader
- sleep/resume/visibility lifecycle
- scale·camera spike

완료 기준:

- 탭 50회 전환 후 Phaser instance 하나 유지
- camera 이동 중 월드 label과 선택 표시 불일치 없음
- 메뉴·창단 초기 bundle에서 Phaser 제외

### Phase 4 — 월드 수직 슬라이스

예상: 7~10일 + 아트 제작

범위:

- 연습실 한 방
- 멤버 두 명
- idle/walk/train
- 캐릭터 tap
- 선택 ring
- React 멤버 상세 sheet
- 주 진행 후 상태 변화
- reduced-motion 대체 표현

통과 기준:

- 임시 Graphics 캐릭터 없이 atlas sprite 사용
- 저사양 모바일 30fps 안정
- input feedback 100ms 이내
- 새 구조가 React-only 카드 화면보다 명확한 관찰 가치를 제공

이 단계가 실패하면 전체 Phaser 확대 전에 DOM/Pixi 대안을 재평가한다. 성공하면 Phaser 유지 결정을 확정한다.

### Phase 5 — 주간 연출 완성

예상: 7~10일

작업:

- 월~일 playback
- 평범한 주 단축 재생
- 선택형 이벤트 pause
- skip/hold-to-complete
- 주간 summary banner
- 돈·스탯·팬 delta
- SFX와 BGM 기초

완료 기준:

- 스킵해도 정보 손실 없음
- 평범한 주 중단형 Modal 0개
- 결과 원인을 2탭 안에 확인

### Phase 6 — 핵심 콘텐츠 연결

예상: 2~3주

작업:

- 앨범 제작
- 활동·프로모션
- 팬덤 4축
- 투자사 목표
- 시장·경쟁자·52주 timeline
- 데뷔·차트·어워드

완료 기준:

- 창단 후 데뷔와 첫 활동까지 complete vertical flow
- `준비 중` 전역 탭 없음
- 시스템 코드가 실제 UI에서 도달 가능

### Phase 7 — 월드 확장과 완성도

예상: 1~2주 + 아트 제작

작업:

- 숙소·사무실·녹음실·외부 활동
- 시설 level 변화
- 계절 환경 변화
- 관계·피로·불만 연기
- 첫 4주 온보딩
- 한국어 용어 통일
- 픽셀 아이콘 완성

완료 기준:

- 임시 도형, 문자 아이콘, emoji, 영문 placeholder 0개
- 같은 품질 기준이 모든 방에 유지

### Phase 8 — 출시 품질 게이트

작업:

- Playwright mobile viewport
- axe 또는 동등 접근성 검사
- keyboard와 screen reader smoke test
- reduced-motion
- 저사양 Android
- 느린 네트워크·CDN 실패
- 저장·복원
- 긴 한국어·큰 금액·빈 상태·최대 로스터
- landscape와 safe-area

---

## 16. 최종 완료 기준

### 사용성

- 신규 사용자가 5초 안에 이번 주 해야 할 일을 찾는다.
- 한 주 핵심 결정 완료에 60~90초를 넘기지 않는다.
- 핵심 행동은 한 손 기준 2~3탭 이내다.
- 모든 결과는 2탭 이내에 원인을 확인할 수 있다.
- 월드·목록·알림·리포트 어디에서 멤버를 열어도 동일한 상세와 행동이 나온다.

### 피드백

- 결정 확정 전에 확정 비용과 기회비용을 모두 확인한다.
- 일반적인 주의 중단형 Modal은 0개다.
- 위기 주도 평균 중단형 Modal 1개 이하를 목표로 한다.
- 스킵 시 손실되는 정보가 없다.

### 모바일·접근성

- 모든 핵심 touch target은 44×44px 이상이다.
- 320/360/390/430px과 landscape에서 잘림이 없다.
- keyboard와 screen reader로 핵심 loop를 완주한다.
- reduced-motion에서 flash·zoom·큰 이동이 없다.
- 브라우저 확대가 차단되지 않는다.

### 정확성

- pending event와 결산이 새로고침 후 복원된다.
- 주간 결과가 중복 적용되지 않는다.
- 모든 visible delta에 source가 존재한다.
- Phaser는 도메인 상태를 계산하거나 직접 소유하지 않는다.

### 성능

- 메뉴·창단 초기 bundle에 Phaser가 포함되지 않는다.
- 저사양 Android에서 안정적인 30fps를 유지한다.
- input feedback은 100ms 이내다.
- 탭 50회 전환 후 Phaser instance·listener·메모리 증가가 없다.
- hidden·paused 상태에서 불필요한 tween이 실행되지 않는다.

### 시각 완성도

- 메인 월드에 임시 벡터 인형이 없다.
- D/T/A/V/S 문자 아이콘과 emoji navigation이 없다.
- 영문 prototype 문구가 없다.
- 창단과 메인 게임이 같은 브랜드 토큰과 선택 문법을 사용한다.
- 시설·멤버·계절의 성장이 월드에서 시각적으로 누적된다.

---

## 17. 하지 말아야 할 순서와 결정

1. **전체 사옥 sprite 제작부터 시작하지 않는다.** 결과 데이터와 interaction contract가 먼저다.
2. **모든 UI를 Phaser로 옮기지 않는다.** 한국어 텍스트, 접근성, 반응형 데이터 UI 비용이 지나치게 커진다.
3. **색상·그림자·아이콘만 교체하고 구조를 유지하지 않는다.** 현재 문제의 중심은 정보 구조와 인과 피드백이다.
4. **React-only와 Phaser 버전을 둘 다 완제품 수준으로 만들지 않는다.** 연습실 한 방 spike로 충분하다.
5. **기존 시설 이미지를 animation spritesheet로 오해하지 않는다.** 선택용 일러스트와 월드 atlas는 다른 자산이다.
6. **EventBus로 게임 상태를 복제하지 않는다.** 상태는 Zustand, EventBus는 표현 명령이다.
7. **drag·swipe·long press를 필수 조작으로 만들지 않는다.** 항상 tap과 button 대안을 제공한다.
8. **`manualChunks`만으로 로딩 문제가 해결됐다고 판단하지 않는다.** 실제 lazy import가 우선이다.
9. **연출을 코어 콘텐츠보다 앞서 확장하지 않는다.** 앨범·활동·데뷔가 도달 불가한 상태에서 월드만 화려해지면 빈 상자가 된다.
10. **접근성과 reduced-motion을 마지막 폴리시로 미루지 않는다.** primitives와 state model 단계에서 포함한다.

---

## 18. 최종 의사결정

Idolverse의 메인 게임은 다음 구조로 재구축한다.

> **React 경영 오케스트레이터 + Phaser 라이브 디오라마 + Zustand 단일 게임 상태 + 순수 주간 시스템**

기존의 `Canvas 위에 React 라벨을 얹은 정적 3방 대시보드`는 폐기한다. 그러나 Phaser 자체는 폐기하지 않는다. 먼저 결과 데이터, workflow, React shell을 완성하고, 이후 한 방의 고품질 월드 수직 슬라이스를 통해 Phaser가 실제 플레이 가치와 성능 기준을 충족하는지 검증한다.

이 순서가 중요한 이유는 명확하다.

- 결과 데이터가 먼저 있어야 연출이 사실을 보여줄 수 있다.
- React shell이 먼저 있어야 Phaser가 UI 역할까지 떠안지 않는다.
- 한 방 수직 슬라이스가 먼저 있어야 전체 아트 제작의 품질과 비용을 예측할 수 있다.
- 코어 콘텐츠가 연결되어야 월드의 움직임이 실제 게임 목표와 연결된다.

최종 목표는 “예쁜 관리 대시보드”가 아니다. 플레이어가 멤버와 회사를 관찰하고, 적은 수의 중요한 결정을 내리고, 그 결정이 살아 있는 세계에서 수행되는 모습을 본 뒤, 결과와 다음 목표를 즉시 이해하는 육성 게임이다.
