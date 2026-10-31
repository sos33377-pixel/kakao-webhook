// 카카오톡 봇 웹훅 → Claude 답변 → 카카오 콜백 API로 답장
// 필요한 환경변수 (Vercel > Settings > Environment Variables)
//   BOT_TOKEN         카카오 디벨로퍼스 봇 인증 토큰(어드민 키)
//   ANTHROPIC_API_KEY Anthropic API 키
//   WEBHOOK_SECRET    (선택) 카카오 웹훅 등록 창의 헤더 X-Webhook-Secret 값과 동일하게
//   ANTHROPIC_MODEL   (선택) 기본값 claude-sonnet-5-5

const { waitUntil } = require('@vercel/functions');

// 봇의 성격/말투는 여기서 바꾸세요
const SYSTEM_PROMPT = `당신은 카카오톡 챗봇 "피피티사냥꾼"입니다.
- 한국어로 친근하고 간결하게 답합니다.
- 카카오톡 말풍선에 보이므로 마크다운(**, #, - 목록 등)을 쓰지 말고 일반 문장으로 씁니다.
- 답변은 최대 5~6문장, 700자 이내로 씁니다.
- 모르는 것은 아는 척하지 말고 모른다고 말합니다.`;

const FALLBACK_TEXT = '잠시 문제가 생겼어요. 조금 뒤에 다시 말씀해 주세요!';

async function askClaude(userText) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userText }],
    }),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error('Claude API ' + r.status + ' ' + errText.slice(0, 300));
  }
  const data = await r.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  return text || FALLBACK_TEXT;
}

async function sendReply(callbackToken, text) {
  const safeText = text.length > 900 ? text.slice(0, 897) + '...' : text; // simpleText 길이 제한 대비
  const r = await fetch('https://kapi.kakao.com/v1/bot/callback', {
    method: 'POST',
    headers: {
      Authorization: 'KakaoAK ' + process.env.BOT_TOKEN,
      'X-Bot-Callback-Token': callbackToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      skillResponse: {
        version: '2.0',
        template: { outputs: [{ simpleText: { text: safeText } }] },
      },
    }),
  });
  const result = await r.text();
  console.log('[REPLY]', r.status, result);
}

async function handleMessage(content, callbackToken) {
  let answer;
  try {
    answer = await askClaude(content);
  } catch (e) {
    console.log('[CLAUDE ERROR]', e.message);
    answer = FALLBACK_TEXT;
  }
  try {
    await sendReply(callbackToken, answer);
  } catch (e) {
    console.log('[KAKAO REPLY ERROR]', e.message);
  }
}

module.exports = async (req, res) => {
  // 1) 헤더 검증 (WEBHOOK_SECRET을 설정한 경우에만)
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && req.headers['x-webhook-secret'] !== secret) {
    console.log('[REJECT] 헤더 불일치');
    return res.status(401).json({ ok: false });
  }

  // 브라우저 접속(GET) 등은 살아있는지만 알려줌
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  const body = req.body || {};
  const d = body.d || {};
  // 토큰류는 로그에 남기지 않음
  console.log('[EVENT]', body.t, '| content:', d.content);

  // 2) 사용자가 메시지를 보낸 이벤트만 처리
  if (body.t === 'MESSAGE_CREATE' && d.content && d.callbackToken) {
    // 3초 안에 200을 돌려주고, 답변 생성/전송은 응답 후에도 이어서 실행
    waitUntil(handleMessage(d.content, d.callbackToken));
  }

  return res.status(200).json({ ok: true });
};
