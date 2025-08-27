// Vercel Serverless Function for GPS tracking
let employees = [];

export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { employeeId, employeeName, latitude, longitude, timestamp } = req.body;
      
      if (!employeeId || !employeeName || !latitude || !longitude) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }
      
      const locationData = {
        employeeId,
        employeeName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: timestamp || new Date().toISOString()
      };

      const existingIndex = employees.findIndex(emp => emp.employeeId === employeeId);
      
      if (existingIndex !== -1) {
        employees[existingIndex] = locationData;
      } else {
        employees.push(locationData);
      }

      console.log('위치 업데이트:', locationData);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Location updated successfully',
        data: locationData 
      });
    } catch (error) {
      console.error('POST 오류:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }

  if (req.method === 'GET') {
    try {
      return res.status(200).json(employees);
    } catch (error) {
      console.error('GET 오류:', error);
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