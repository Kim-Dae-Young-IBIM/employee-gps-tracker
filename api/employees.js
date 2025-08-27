// Vercel Serverless Function for getting all employees
import locationHandler from './location.js';

export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // location.js의 GET 메소드 재사용
    req.method = 'GET';
    return locationHandler(req, res);
  }

  return res.status(405).json({ 
    success: false, 
    error: 'Method not allowed' 
  });
}