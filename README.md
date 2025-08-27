# 직원 GPS 추적 대시보드

## 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **서버 실행**
```bash
npm start
```

3. **개발 모드 실행**
```bash
npm run dev
```

## 사용법

### 1. 웹 대시보드 접속
- 브라우저에서 `http://localhost:3000` 접속
- 실시간으로 직원들의 위치를 지도에서 확인

### 2. 모바일에서 위치 전송
- 브라우저에서 `http://localhost:3000/mobile.html` 접속
- 직원 ID와 이름 입력
- "현재 위치 전송" 또는 "자동 전송 시작" 클릭

### 3. Google Maps API 키 설정
- `public/index.html` 파일에서 `YOUR_API_KEY`를 실제 API 키로 변경
- Google Cloud Console에서 Maps JavaScript API 활성화 필요

## API 엔드포인트

- `POST /api/location` - GPS 위치 데이터 전송
- `GET /api/employees` - 모든 직원 위치 조회
- `GET /api/employee/:id` - 특정 직원 위치 조회

## 기능

- ✅ 실시간 GPS 위치 추적
- ✅ 웹 대시보드에서 지도 표시
- ✅ WebSocket을 통한 실시간 업데이트
- ✅ 직원별 위치 정보 관리
- ✅ 모바일 웹에서 위치 전송
- ✅ 자동 위치 전송 기능

## 보안 고려사항

- 실제 운영 환경에서는 인증 시스템 추가 필요
- HTTPS 사용 권장
- 위치 데이터 암호화 고려
- 직원 동의 절차 필요