const CACHE_NAME = 'gps-tracker-v1';
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

let locationInterval;

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'START_GPS_TRACKING') {
    const { employeeId, employeeName } = event.data;
    
    locationInterval = setInterval(async () => {
      try {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            position => {
              const locationData = {
                employeeId,
                employeeName,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: new Date().toISOString()
              };
              
              sendLocationToServer(locationData);
            },
            error => console.error('GPS Error:', error),
            { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
          );
        }
      } catch (error) {
        console.error('Background GPS Error:', error);
      }
    }, 30000); // 30초마다
    
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'GPS_TRACKING_STARTED',
          message: '백그라운드 GPS 추적이 시작되었습니다.'
        });
      });
    });
  }
  
  if (event.data && event.data.type === 'STOP_GPS_TRACKING') {
    if (locationInterval) {
      clearInterval(locationInterval);
      locationInterval = null;
    }
    
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'GPS_TRACKING_STOPPED',
          message: '백그라운드 GPS 추적이 중지되었습니다.'
        });
      });
    });
  }
});

async function sendLocationToServer(locationData) {
  try {
    const response = await fetch('/api/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData)
    });
    
    if (response.ok) {
      console.log('위치 전송 성공:', locationData);
    } else {
      console.error('위치 전송 실패:', response.status);
      storePendingLocation(locationData);
    }
  } catch (error) {
    console.error('네트워크 오류:', error);
    storePendingLocation(locationData);
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