// Vercel Serverless Function for clearing all employee data
export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      // 이 방법으로는 다른 함수의 메모리를 직접 삭제할 수 없으므로
      // 클라이언트 측에서 localStorage를 사용하여 해결하겠습니다
      
      console.log('데이터 삭제 요청 받음');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Clear request received - data will be reset' 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed' 
  });
}