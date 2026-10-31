# 카카오 봇 웹훅 수신 서버 (Vercel)

## 폴더 구조
```
kakao-webhook/
├─ api/
│  └─ callback.js   ← 첨부된 callback.js를 여기에 넣기
└─ package.json     ← 아래 내용으로 새로 만들기
```

package.json:
```json
{ "name": "kakao-webhook", "version": "1.0.0" }
```

## 배포 (터미널)
```
npm i -g vercel
cd kakao-webhook
vercel login
vercel --prod
```
배포가 끝나면 `https://xxxx.vercel.app` 주소가 나옵니다.

## 보안 헤더 설정 (선택, 권장)
1. 랜덤 문자열 하나 만들기 (예: `kx9f2a7d...`)
2. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
   - Name: `WEBHOOK_SECRET` / Value: 위 문자열
3. 환경변수 추가 후 `vercel --prod`로 재배포
4. 카카오 웹훅 등록 창 → 헤더 값에 입력
   - Key: `X-Webhook-Secret` / Value: 위 문자열

## 카카오 웹훅 등록
- URL: `https://xxxx.vercel.app/api/callback`
- 저장 후 카카오톡에서 봇에게 말 걸기

## 요청 확인
Vercel 대시보드 → 프로젝트 → Logs 에서 `[BODY]`를 확인.
그 JSON을 복사해서 주시면 Claude API 답장 코드를 붙여드립니다.
