# Google Meet Migration Guide

## Overview

The video conferencing feature has been migrated from **Agora RTC SDK v4.5.3** to **Google Meet WebView** for simpler implementation and better reliability.

## Why Google Meet?

- ✅ No native SDK limitations (Agora v4.5.3 lacked video rendering components)
- ✅ Simple web-based solution with `react-native-webview`
- ✅ No complex permission setup or native compilation
- ✅ Proven reliability across platforms
- ✅ Built-in Google authentication
- ✅ No dependency on Agora infrastructure

## Components Changed

### 1. **New GoogleMeetConference Component**
**Location:** `components/common/GoogleMeetConference/index.tsx`

**Features:**
- Embeds Google Meet via WebView
- Full-screen modal presentation
- User name display in footer
- Loading indicator during page load
- Exit button to close meeting
- Error handling for connection issues

**Props:**
```typescript
interface GoogleMeetConferenceProps {
  isVisible: boolean;      // Show/hide modal
  onClose: () => void;     // Handle close action
  meetLink: string;        // Google Meet URL
  userName?: string;       // Display user name
}
```

**Example Usage:**
```tsx
const [isVCVisible, setIsVCVisible] = useState(false);
const [meetLink, setMeetLink] = useState("");

<GoogleMeetConference
  isVisible={isVCVisible}
  onClose={() => setIsVCVisible(false)}
  meetLink={meetLink}
  userName="Nguyễn Văn A"
/>
```

### 2. **Updated Coach SessionDetailModal**
**Location:** `components/coach/calendar/SessionDetailModal.tsx`

**Changes:**
- Replaced VideoConference import with GoogleMeetConference
- Removed Agora state (channelName, vcToken)
- Added meetLink state
- Updated handler to generate Meet URL format
- Simplified props (no uid, agoraAppId, token needed)

### 3. **Updated Learner CourseDetailScreen**
**Location:** `app/(learner)/my-courses/[id]/index.tsx`

**Changes:**
- Replaced VideoConference import with GoogleMeetConference
- Removed unused Agora state variables
- Updated handler to generate Meet URL
- Simplified component props

## API Integration

### Current Implementation
The app currently generates Meet URLs using a simple format:
```typescript
const meetUrl = `https://meet.google.com/${courseId}-session`;
```

### Backend Integration (Future)
Update backend endpoint `/v1/video-conferences/courses/{courseId}` to return:
```json
{
  "meetLink": "https://meet.google.com/abc-defg-hij"
}
```

Then update the handlers:
```typescript
const details = await videoConferenceService.getVideoConferenceDetails(courseId);
setMeetLink(details.meetLink);
setIsVCVisible(true);
```

## Deployment Checklist

- [x] Install `react-native-webview` package
- [x] Create GoogleMeetConference component
- [x] Update SessionDetailModal (Coach)
- [x] Update CourseDetailScreen (Learner)
- [x] Remove unused imports
- [x] Fix TypeScript errors
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Update backend to provide actual Google Meet links
- [ ] Remove VideoConference component (after testing)
- [ ] Uninstall `react-native-agora` package (optional)

## Testing Instructions

1. **Coach Side:**
   - Open calendar view
   - Click on a session detail
   - Click "Tham gia lớp học trực tuyến" button
   - Google Meet should open in WebView

2. **Learner Side:**
   - Open "Khóa học của tôi"
   - Click on a course
   - Scroll to find the video conference button
   - Click to open Google Meet

## Migration Status

### ✅ Completed
- GoogleMeetConference component created
- Coach integration complete
- Learner integration complete
- TypeScript compilation errors resolved
- Package installed

### ⏳ Pending
- E2E testing on physical devices
- Backend update to provide actual Google Meet URLs
- Removal of old VideoConference component
- Uninstalling Agora SDK (optional)

## Reverting to Agora (if needed)

If you need to revert:
```bash
# Restore VideoConference component
git restore components/common/VideoConference/

# Restore SessionDetailModal
git restore components/coach/calendar/SessionDetailModal.tsx

# Restore CourseDetailScreen
git restore app/\(learner\)/my-courses/\[id\]/index.tsx

# Uninstall WebView
npm uninstall react-native-webview
```

## Notes

- Google Meet URLs are currently hardcoded - connect to backend for real URLs
- All user permissions are handled by Google Meet (no camera/mic permissions needed from app)
- WebView automatically handles all Google authentication flows
- Mobile users will be redirected to Google Meet app if installed, or web version
