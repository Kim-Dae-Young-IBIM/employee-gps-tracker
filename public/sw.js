const CACHE_NAME = 'gps-tracker-v3';
const urlsToCache = [
  '/',
  '/mobile.html',
  '/simple-dashboard.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'background-gps') {
    event.waitUntil(sendPendingLocations());
  }
});

let isTracking = false;
let currentEmployee = null;

self.addEventListener('message', event => {
  console.log('🔔 Service Worker 메시지 수신:', event.data);
  
  if (event.data && event.data.type === 'START_GPS_TRACKING') {
    const { employeeId, employeeName } = event.data;
    console.log('🚀 Service Worker GPS 추적 시작:', { employeeId, employeeName });
    
    isTracking = true;
    currentEmployee = { employeeId, employeeName };
    
    // 메인 스레드에 GPS 추적 시작 요청
    self.clients.matchAll().then(clients => {
      console.log('👥 연결된 클라이언트 수:', clients.length);
      clients.forEach(client => {
        console.log('📤 클라이언트에 REQUEST_GPS_START 전송');
        client.postMessage({
          type: 'REQUEST_GPS_START',
          employeeId,
          employeeName
        });
      });
    });
    
    // 응답 메시지
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        console.log('📤 클라이언트에 GPS_TRACKING_STARTED 전송');
        client.postMessage({
          type: 'GPS_TRACKING_STARTED',
          message: '백그라운드 GPS 추적이 시작되었습니다.'
        });
      });
    });
  }
  
  if (event.data && event.data.type === 'STOP_GPS_TRACKING') {
    console.log('🛑 Service Worker GPS 추적 중지');
    isTracking = false;
    currentEmployee = null;
    
    // 메인 스레드에 GPS 추적 중지 요청
    self.clients.matchAll().then(clients => {
      console.log('👥 연결된 클라이언트 수:', clients.length);
      clients.forEach(client => {
        console.log('📤 클라이언트에 REQUEST_GPS_STOP 전송');
        client.postMessage({
          type: 'REQUEST_GPS_STOP'
        });
      });
    });
    
    // 응답 메시지
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        console.log('📤 클라이언트에 GPS_TRACKING_STOPPED 전송');
        client.postMessage({
          type: 'GPS_TRACKING_STOPPED',
          message: '백그라운드 GPS 추적이 중지되었습니다.'
        });
      });
    });
  }
  
  // 메인 스레드에서 GPS 위치 데이터 수신
  if (event.data && event.data.type === 'LOCATION_DATA' && isTracking) {
    const locationData = event.data.locationData;
    console.log('📍 Service Worker 위치 데이터 수신:', locationData);
    sendLocationToServer(locationData);
  } else if (event.data && event.data.type === 'LOCATION_DATA' && !isTracking) {
    console.log('⚠️ GPS 추적이 비활성화 상태에서 위치 데이터 수신 - 무시됨');
  }
});

async function sendLocationToServer(locationData) {
  try {
    locationData.source = 'service_worker'; // Service Worker 출처 표시
    
    console.log('🚀 Service Worker에서 API 전송 시도:', locationData);
    
    const response = await fetch('/api/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData)
    });
    
    console.log('📡 Service Worker API 응답 상태:', response.status);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ Service Worker 위치 전송 성공:', responseData);
      
      // 클라이언트에 성공 알림
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'LOCATION_SENT_SUCCESS',
            data: responseData
          });
        });
      });
    } else {
      console.error('❌ Service Worker 위치 전송 실패:', response.status);
      await storePendingLocation(locationData);
    }
  } catch (error) {
    console.error('❌ Service Worker 네트워크 오류:', error);
    await storePendingLocation(locationData);
  }
}

function storePendingLocation(locationData) {
  return new Promise((resolve) => {
    const request = indexedDB.open('gps-tracker', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingLocations')) {
        db.createObjectStore('pendingLocations', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingLocations'], 'readwrite');
      const store = transaction.objectStore('pendingLocations');
      store.add(locationData);
      resolve();
    };
  });
}

async function sendPendingLocations() {
  return new Promise((resolve) => {
    const request = indexedDB.open('gps-tracker', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['pendingLocations'], 'readwrite');
      const store = transaction.objectStore('pendingLocations');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = async () => {
        const pendingLocations = getAllRequest.result;
        
        for (const location of pendingLocations) {
          try {
            const response = await fetch('/api/location', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(location)
            });
            
            if (response.ok) {
              store.delete(location.id);
            }
          } catch (error) {
            console.error('재전송 실패:', error);
          }
        }
        resolve();
      };
    };
  });
}