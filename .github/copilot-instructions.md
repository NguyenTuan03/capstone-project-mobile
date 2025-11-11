# Capstone Pickleball Mobile - AI Coding Agent Instructions

## Project Overview
React Native Expo mobile app (scheme: `pickleball`) for a dual-role pickleball learning platform with Coach and Learner experiences. Uses Expo Router file-based routing, TypeScript strict mode, and integrates with AI (Gemini) for video analysis.

## Architecture Patterns

### Role-Based Routing Structure
- **`app/(auth)/`** - Unauthenticated flows (login, register)
- **`app/(coach)/`** - Coach role: calendar, courses, students, content management
- **`app/(learner)/`** - Learner role: courses, AI analysis, profile
- Each role has its own `_layout.tsx` with tab navigation
- Navigation redirects after login based on `user.role.name` ("COACH" | "LEARNER")

### Authentication & HTTP
Two HTTP client patterns exist side-by-side:
1. **`services/jwt-auth/index.tsx`** (jwtAxios) - Used for auth endpoints, auto-refresh with queue
2. **`services/http/interceptor.ts`** (http) - Main API client with refresh token flow

**Token Management:**
- Tokens stored in AsyncStorage: `token`, `refreshToken`, `user`
- Auth state managed by `JWTAuthProvider` context (`services/jwt-auth/JWTAuthProvider.tsx`)
- Access via hooks: `useJWTAuth()` (state), `useJWTAuthActions()` (actions)
- HTTP clients auto-inject `Authorization: Bearer <token>` header

**API Service Pattern:**
```typescript
// Singleton services export default instance
import http from '@/services/http/interceptor';
class SessionService {
  async getSessionById(id: number) {
    const response = await http.get(`/v1/sessions/${id}`);
    return response.data;
  }
}
export default new SessionService();
```

**Direct HTTP calls pattern** (older code, avoid in new features):
```typescript
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
await axios.post(`${API_URL}/v1/auth/login`, data);
```

### Type System
- **Location:** `types/` directory with separate files per domain
- **Conventions:**
  - Interfaces use `Type` suffix: `QuizType`, `SessionType`, `UserType`
  - DTOs use `FormDTO` suffix: `QuizFormDTO`, `QuestionFormDTO`
  - Enums for status/state: `SessionStatus`, `AttendanceStatus`, `CoachVideoStatus`
- **Key Types:**
  - `CalendarSession` - Extended session with embedded course, quizzes, videos
  - `Exercise` - Discriminated union (`type: "video" | "quiz"`) for assignment rendering
  - API responses often nested in `metadata` or `items` fields (see `useLessonResources` extraction logic)

### Component Organization
```
components/
  common/         # Shared utilities (AppForm, AppEnum)
  coach/          # Coach-specific features (calendar, course, students)
  learner/        # Learner-specific features (lesson, quiz)
  ui/             # Reusable UI primitives (collapsible, themed components)
```

**Reusable Form Pattern** (`components/common/AppForm/index.tsx`):
- Single form component with validation, auto-focus, gradient submit button
- Pass `items` array with field configs, handles email/password validation
- Vietnamese error messages, `skipValidation` flag for custom flows

### State Management
- **Context Providers:** Wrap in `app/_layout.tsx`
  - `AppContextProvider` - App-level state
  - `AppAuthProvider` → `JWTAuthProvider` - Auth state
- **Custom Hooks:**
  - `useLessonResources(lessonId)` - Fetches quizzes/videos, handles multiple API response shapes
  - `use-attemp-quiz.ts` - Quiz attempt logic

### Vietnamese Localization
- UI text primarily in Vietnamese ("Đăng nhập", "Khóa học", etc.)
- Utilities: `utils/localization.ts` (`toVietnameseDay`), `utils/dateUtils.ts`, `utils/scheduleFormat.ts`
- Days of week: `DAYS_OF_WEEK_VI` in `components/common/AppEnum/index.ts`

### Mobile UI/UX Design Principles

**Design Philosophy:**
- **Mobile-First:** Optimize for minimal scrolling with compact, information-dense layouts
- **Aggressive Spacing Reduction:** Apply 30-50% reduction from typical web/desktop standards
- **Touch-Friendly:** Maintain usable touch targets (32-36px minimum) despite compact design
- **Visual Hierarchy:** Use consistent spacing tiers to create clear information structure

**Spacing Standards (React Native StyleSheet):**

1. **Padding Values:**
   - **Standard Content:** `12px` (reduced from 18-20px)
   - **Compact Sections:** `8px` (reduced from 12-16px)
   - **Minimal Gaps:** `6px` (reduced from 10-12px)
   - **Header/Footer:** `12px vertical, 16px horizontal` (reduced from 16-20px vertical, 20-24px horizontal)

2. **Margins/Gaps:**
   - **Card Spacing:** `8-10px` (reduced from 14-16px)
   - **Section Gaps:** `12px` (reduced from 18-20px)
   - **Item Gaps:** `6-8px` (reduced from 10-14px)

3. **Border Radius:**
   - **Large Cards:** `12px` (reduced from 16-20px)
   - **Medium Elements:** `10px` (reduced from 14-16px)
   - **Small Badges:** `6-8px` (reduced from 10-12px)
   - **Buttons:** `12px` (reduced from 16px)

4. **Interactive Elements:**
   - **Buttons:** `36-40px height` (reduced from 44-48px), `13-16px vertical padding` (reduced from 16-20px)
   - **Touch Targets:** `32-36px minimum` (reduced from 44px, but maintain usability)
   - **Icon Sizes:** `32px large, 24px medium, 20px small` (reduced from 36-40px, 28-32px, 24px)
   - **Checkboxes/Radio:** `24px` (reduced from 28-32px)

5. **Typography:**
   - **Headings:** `15-17px` (reduced from 18-20px)
   - **Body Text:** `13-14px` (reduced from 15-16px)
   - **Secondary/Caption:** `11-12px` (reduced from 13-14px)
   - **Line Height:** `1.3-1.4` (tighter than web's 1.5-1.6)

6. **Component-Specific Patterns:**
   - **Calendar Day Headers:** `75px min height` (reduced from 90px)
   - **Session Cards:** `12px padding, 12px border radius` (reduced from 18px padding, 16px radius)
   - **Modal Headers:** `16px padding, 36px close button` (reduced from 20px padding, 44px button)
   - **Avatar Sizes:** `32px standard, 38px large` (reduced from 38px, 44px)
   - **Video Thumbnails:** `80x60px compact` (reduced from 100x100px)
   - **Video Player Height:** `200px` (reduced from 220-240px)

**Implementation Guidelines:**

1. **When Creating New Components:**
   - Start with compact spacing from the beginning (12px padding, 8px margins)
   - Use StyleSheet constants for consistency: define spacing values as named constants
   - Test on smallest target devices (iPhone SE, small Android) first
   - Ensure scrollable content fits within 2-3 screen heights maximum

2. **When Updating Existing Components:**
   - Apply systematic 30-50% reduction to all spacing values
   - More aggressive (40-50%) for containers, layouts, modal backgrounds
   - Moderate (30-40%) for content cards, lists, interactive elements
   - Preserve minimum touch target sizes (32px+)

3. **Spacing Reduction Formula:**
   ```typescript
   // Before: padding: 20,
   // After:  padding: 12,  (40% reduction)
   
   // Before: marginBottom: 16,
   // After:  marginBottom: 10,  (38% reduction)
   
   // Before: borderRadius: 20,
   // After:  borderRadius: 12,  (40% reduction)
   ```

4. **Visual Density Balance:**
   - **High Density:** Calendar grids, session lists, student rosters
   - **Medium Density:** Forms, quiz displays, video lists
   - **Low Density:** CTAs, empty states, onboarding screens
   - Use white space strategically - less overall, but more between logical groups

5. **Common Anti-Patterns to Avoid:**
   - ❌ Using web-standard spacing (16-24px padding) - too much scroll on mobile
   - ❌ Inconsistent spacing tiers (11px, 14px, 17px random values) - creates visual chaos
   - ❌ Touch targets below 32px - unusable on mobile
   - ❌ Over-compacting text (below 11px) - readability issues
   - ❌ Reducing line-height below 1.3 - text becomes cramped

6. **Validation Checklist:**
   - [ ] Component fits primary content in 1-2 screen heights
   - [ ] All interactive elements >= 32px touch target
   - [ ] Padding values use 6px, 8px, 12px, or 16px tiers
   - [ ] Border radius scaled proportionally (12px for cards, 6-8px for badges)
   - [ ] Font sizes readable: body >= 13px, captions >= 11px
   - [ ] Visual hierarchy maintained through size/weight, not excessive spacing

**Reference Implementations:**
- `components/coach/calendar/CustomWeeklyCalendar.tsx` - Aggressive compact calendar layout
- `components/coach/calendar/SessionDetailModal.tsx` - Compact full-screen modal (native Modal component)
- `components/coach/calendar/SessionDetailQuiz.tsx` - Native Modal with quiz details (slide-up pattern)
- `components/coach/calendar/SessionDetailVideo.tsx` - Compact media display with player

## Key Development Workflows

### Running the App
```bash
npm install                    # Install dependencies
npx expo start                 # Start dev server
npm run android                # Launch Android
npm run ios                    # Launch iOS
```

### Environment Configuration
Create `.env` with:
```
EXPO_PUBLIC_API_BASE_URL=<backend_url>
EXPO_PUBLIC_API_VERSION=v1
EXPO_PUBLIC_GEMINI_API_KEY=<gemini_key>
```
Access via `process.env.EXPO_PUBLIC_*` (must start with `EXPO_PUBLIC_`)

### Adding New Routes
1. Create file in `app/(coach)/` or `app/(learner)/` following Expo Router conventions
2. Add to tab config in `app/(coach)/_layout.tsx` or `app/(learner)/_layout.tsx`
3. Use `href: null` to hide from tabs but keep route accessible

### Service Integration Pattern
1. Define types in `types/<domain>.ts`
2. Create service class in `services/<domain>Service.ts`
3. Export singleton: `export default new DomainService()`
4. Import in components: `import sessionService from '@/services/sessionService'`

## Critical Patterns

### Expo Router Navigation
```typescript
import { router, useLocalSearchParams } from 'expo-router';
router.push('/(coach)/home' as Href);
router.replace('/(auth)');
const { id } = useLocalSearchParams(); // Dynamic route params
```

### Date Handling
- Library: `date-fns` (preferred over moment.js)
- Calendar: `react-native-calendars` for date pickers
- Format: ISO strings (`yyyy-MM-dd`, `HH:mm`) from backend

### Modal Pattern
**Always use React Native's built-in `Modal` component** - avoid third-party modal/bottom sheet libraries to prevent dependency issues.

**Standard Modal Pattern** (`SessionDetailModal.tsx`, `SessionDetailQuiz.tsx`):
```typescript
import { Modal, ScrollView } from 'react-native';

const [modalVisible, setModalVisible] = useState(false);
const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

const handleItemPress = (item: ItemType) => {
  setSelectedItem(item);
  setModalVisible(true);
};

const handleModalClose = () => {
  setModalVisible(false);
  setTimeout(() => setSelectedItem(null), 300); // Clear after animation
};

return (
  <>
    {/* Trigger */}
    <TouchableOpacity onPress={() => handleItemPress(item)}>
      {/* Card content */}
    </TouchableOpacity>

    {/* Modal */}
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"  // iOS: slides up from bottom
      onRequestClose={handleModalClose}
    >
      <View style={styles.modalContainer}>
        <ScrollView>
          {/* Header with close button */}
          <TouchableOpacity onPress={handleModalClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          {/* Content */}
          {selectedItem && <>{/* Render details */}</>}
        </ScrollView>
      </View>
    </Modal>
  </>
);
```

**Modal Styles:**
```typescript
modalContainer: {
  flex: 1,
  backgroundColor: '#FFFFFF',
},
closeButton: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#F3F4F6',
  justifyContent: 'center',
  alignItems: 'center',
},
```

**Why Native Modal:**
- ✅ No external dependencies (react-native-reanimated, gesture-handler)
- ✅ Works out of the box with Expo
- ✅ `presentationStyle="pageSheet"` gives native iOS bottom sheet behavior
- ✅ Simpler state management (just boolean + selected item)
- ❌ Avoid `@gorhom/bottom-sheet` and other third-party modal libraries

### Video Analysis Flow
- Service: `services/ai/geminiService.ts`
- Schema-based validation with JSON schema for AI responses
- Returns `CombinedAnalysisResult` or `VideoComparisonResult` types
- Handles base64 frame extraction and pose landmark parsing

## Common Gotchas

1. **Two HTTP clients:** Prefer `services/http/interceptor.ts` (http) over direct axios/jwtAxios
2. **API response shapes:** Backend inconsistently wraps in `metadata`, `items`, or `data` - use extraction helpers
3. **Session status:** `SessionStatus` enum in `types/session.ts` - always use enum values, not strings
4. **Tab visibility:** Use `href: null` in tab screen options to hide, not `tabBarButton: () => null` (inconsistent)
5. **Absolute imports:** Always use `@/` alias (configured in `tsconfig.json` paths)
6. **AsyncStorage:** All values are strings - stringify objects, parse on retrieval
7. **Modals:** Always use native `Modal` component, never third-party bottom sheet libraries

## File Naming Conventions
- Components: PascalCase (`CustomWeeklyCalendar.tsx`)
- Utilities: camelCase (`dateUtils.ts`, `priceFormat.ts`)
- Types: singular noun (`course.ts`, `session.ts`)
- Routes: lowercase with special chars (`index.tsx`, `[id].tsx`, `_layout.tsx`)

## Testing & Debugging
- No test setup currently - focus on runtime debugging
- Expo dev tools: Shake device or `Cmd+D` (iOS) / `Cmd+M` (Android) for menu
- Console logs: Check Metro bundler terminal output

## Integration Points
- **Backend API:** Versioned endpoints (`/v1/*`), expects Bearer token
- **Google Gemini:** Video analysis via `@google/generative-ai` SDK
- **AsyncStorage:** Token persistence, user state caching
- **Expo services:** Image picker, AV player, video, haptics, linear-gradient

## When Adding Features
1. Check existing patterns in similar role folder (`(coach)` vs `(learner)`)
2. Reuse `AppForm` for auth-style flows
3. Create service + types before UI components
4. Follow Vietnamese naming for user-facing text
5. Use singleton service pattern with TypeScript classes
