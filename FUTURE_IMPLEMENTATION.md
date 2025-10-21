# Future Implementation Guide

This document outlines the planned features and implementation details for future versions of GITAM Student Insights.

## Firebase Authentication

### Google OAuth Setup
- Integrate Firebase Authentication SDK
- Configure Google OAuth provider in Firebase Console
- Set up OAuth consent screen and authorized domains
- Handle authentication flow in Chrome extension

### Chrome Identity API Integration
```typescript
// Example implementation
chrome.identity.getAuthToken({ interactive: true }, (token) => {
  // Exchange Chrome token for Firebase token
  firebase.auth().signInWithCredential(credential);
});
```

### Persistent Login Mechanism
- Store Firebase tokens in chrome.storage.local
- Implement token refresh logic (tokens expire after 1 hour)
- Set up background service worker to maintain auth state
- Handle token expiration gracefully

### Token Refresh Strategy
```typescript
// Background script - periodic token refresh
setInterval(async () => {
  const user = firebase.auth().currentUser;
  if (user) {
    const token = await user.getIdToken(true); // Force refresh
    await chrome.storage.local.set({ firebase_token: token });
  }
}, 30 * 60 * 1000); // Refresh every 30 minutes
```

## Firestore Schema

### Users Collection
```
users/{userId}
  - email: string
  - displayName: string
  - photoURL: string
  - isPro: boolean
  - proExpiresAt: timestamp
  - proStartedAt: timestamp
  - semester: string (e.g., "2024-spring")
  - campus: string (e.g., "Hyderabad", "Visakhapatnam")
  - registrationNumber: string
  - createdAt: timestamp
  - lastLoginAt: timestamp
  - settings: map
    - notifications: boolean
    - theme: string ("light" | "dark" | "system")
    - features: map<string, boolean>
```

### Holidays Collection
```
holidays/{semesterId}
  - semester: string
  - campus: string
  - year: number
  - holidays: array
    - date: string (YYYY-MM-DD)
    - name: string
    - type: string ("holiday" | "exam" | "break")
  - updatedAt: timestamp
```

### Attendance Cache (Optional)
```
attendance_cache/{userId}
  - subjects: array
  - stats: map
  - lastUpdated: timestamp
  - expiresAt: timestamp
```

## Backend APIs Needed

### Holiday Calendar API
```
GET /api/holidays?semester={semesterId}&campus={campus}

Response:
{
  "success": true,
  "data": [
    {
      "date": "2024-01-26",
      "name": "Republic Day",
      "type": "holiday"
    },
    ...
  ]
}
```

### Attendance History API
```
GET /api/attendance/history?startDate={date}&endDate={date}

Response:
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "subject": "Computer Networks",
      "subjectCode": "CS401",
      "status": "present",
      "time": "09:00 AM"
    },
    ...
  ]
}
```

### What-If Calculator API (Optional - can be client-side)
```
POST /api/attendance/calculate

Request:
{
  "currentStats": {...},
  "changes": [...]
}

Response:
{
  "success": true,
  "data": {
    "newPercentage": 78.5,
    "impact": +2.3,
    "predictions": {...}
  }
}
```

## Payment Integration

### External Payment Website (Separate Project)
- Build a separate Next.js/React website for payment handling
- Integrate Stripe or Razorpay for payments
- Payment tiers:
  - Monthly: ₹99/month
  - Semester: ₹299 (6 months)
  - Annual: ₹499/year

### Payment Flow
1. User clicks "Upgrade to Pro" in extension
2. Opens payment website in new tab with user ID parameter
3. User completes payment on website
4. Website webhook updates Firestore with pro status
5. Extension detects pro status change (real-time listener or polling)
6. Features unlock immediately

### Webhook Implementation
```typescript
// Firebase Cloud Function
exports.handlePaymentWebhook = functions.https.onRequest(async (req, res) => {
  // Verify webhook signature
  const { userId, plan, transactionId } = req.body;
  
  // Update Firestore
  await admin.firestore().collection('users').doc(userId).update({
    isPro: true,
    proExpiresAt: calculateExpiryDate(plan),
    proStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    plan: plan,
    transactionId: transactionId
  });
  
  res.status(200).send({ success: true });
});
```

### Extension Pro Status Check
```typescript
// Real-time listener in extension
firebase.firestore().collection('users').doc(userId)
  .onSnapshot((doc) => {
    const data = doc.data();
    if (data?.isPro) {
      // Update local state
      chrome.storage.local.set({ isPro: true, proExpiresAt: data.proExpiresAt });
      // Reload UI to unlock features
      window.location.reload();
    }
  });
```

## Security Considerations

### Token Validation
- Always validate Firebase ID tokens on backend
- Check token expiration
- Verify user permissions before returning sensitive data

### Rate Limiting
- Implement rate limiting on API endpoints
- Prevent abuse of free tier features
- Monitor for suspicious activity

### Data Encryption
- Encrypt sensitive data in Firestore
- Use Firebase Security Rules to restrict access
- Never store passwords or payment information

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Holidays are read-only for all authenticated users
    match /holidays/{semesterId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write
    }
  }
}
```

## Keep-Alive Strategies

### Service Worker Background Sync
```typescript
// Register periodic sync
navigator.serviceWorker.ready.then((registration) => {
  registration.periodicSync.register('sync-attendance', {
    minInterval: 24 * 60 * 60 * 1000 // Once per day
  });
});
```

### Periodic Token Refresh
- Refresh Firebase token every 30 minutes in background
- Store refreshed token in chrome.storage
- Handle refresh failures gracefully

### Local Storage Caching
- Cache user data, holidays, and attendance records
- Set TTL (Time To Live) for cached data
- Implement cache invalidation strategy
- Sync with backend periodically

### Connection Monitoring
```typescript
// Monitor online/offline status
window.addEventListener('online', () => {
  // Sync cached data when back online
  syncCachedData();
});

window.addEventListener('offline', () => {
  // Switch to offline mode, use cached data
  enableOfflineMode();
});
```

## Chrome Extension Research

### Persistent Login Mechanisms
1. **chrome.identity API**: Best for Google OAuth
2. **chrome.storage.local**: Store tokens securely
3. **Service Worker**: Maintain background auth state
4. **Alarms API**: Schedule periodic token refresh

### Popular Extensions Reference
- Study how Gmail, Grammarly, LastPass handle authentication
- Look at open-source extensions for patterns
- Review Chrome extension best practices documentation

## Implementation Checklist

- [ ] Set up Firebase project and enable Authentication
- [ ] Configure Google OAuth in Firebase Console
- [ ] Implement Firebase SDK in extension
- [ ] Create Firestore collections with security rules
- [ ] Build payment website (separate repo)
- [ ] Integrate payment gateway (Stripe/Razorpay)
- [ ] Set up webhook for payment confirmation
- [ ] Implement real-time pro status sync
- [ ] Add holiday calendar API
- [ ] Build attendance history API
- [ ] Implement caching and offline support
- [ ] Add token refresh logic
- [ ] Test authentication flow end-to-end
- [ ] Security audit and testing
- [ ] Documentation for deployment

## Notes for Deployment

- Keep API keys and secrets in environment variables
- Use Firebase Functions for backend logic
- Enable Firebase Analytics for tracking
- Set up error monitoring (Sentry, Firebase Crashlytics)
- Implement comprehensive logging
- Plan for scaling (Firestore has limits)
- Consider CDN for static assets
- Regular security updates and dependency management

