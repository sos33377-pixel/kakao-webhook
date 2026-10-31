// Vercel 서버리스 함수 — 카카오 봇 웹훅 수신용
// 저장 위치: 프로젝트 폴더의 api/callback.js
// 배포 후 주소: https://내프로젝트.vercel.app/api/callback

module.exports = async (req, res) => {
  // 1) 헤더 검증 (카카오 웹훅 등록 창의 '헤더 값'에 넣은 Key/Value와 동일해야 함)
  //    검증이 필요 없으면 환경변수 WEBHOOK_SECRET을 설정하지 않으면 건너뜀
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const got = req.headers['x-webhook-secret'];
    if (got !== secret) {
      console.log('[REJECT] 헤더 불일치');
      return res.status(401).json({ ok: false });
    }
  }

  // 2) 받은 내용 전체를 로그로 출력 (카카오가 보내는 형식 확인용)
  console.log('[METHOD]', req.method);
  console.log('[HEADERS]', JSON.stringify(req.headers, null, 2));
  console.log('[BODY]', JSON.stringify(req.body, null, 2));

  // 3) 3초 안에 2XX 응답 필수 → 바로 200 반환
  return res.status(200).json({ ok: true });
};
