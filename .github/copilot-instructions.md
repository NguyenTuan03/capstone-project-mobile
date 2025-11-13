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
import http from "@/services/http/interceptor";
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
components/                      # Root-level components directory (same level as app/)
  common/                        # Shared utilities (AppForm, AppEnum, StepIndicator, LocationSelector)
  coach/                         # Coach-specific features (calendar, course, students)
  learner/                       # Learner-specific features (lesson, quiz)
  ui/                            # Reusable UI primitives (collapsible, themed components)

app/(auth)/components/           # Route-specific components (only used in auth flow)
app/(coach)/*/components/        # Coach route-specific components
app/(learner)/*/components/      # Learner route-specific components
```

**Component Placement Guidelines:**

- **Reusable across app** → `components/common/` (e.g., StepIndicator, LocationSelector, formStyles)
- **Role-specific reusable** → `components/coach/` or `components/learner/`
- **Route-specific only** → Create `components/` folder inside the route directory (e.g., `app/(auth)/components/RegistrationStep1.tsx`)
- **When refactoring large files:** Split into smaller components in appropriate location based on reusability
  - If component is only used in one route → keep in route's `components/` folder
  - If component could be reused elsewhere → move to `components/common/` or role-specific folder

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
   - [ ] Text labels fit within their containers without being cut off
   - [ ] Flexbox layouts distribute space evenly (avoid mixing flex: 1 with fixed widths)
   - [ ] Long text can wrap or is abbreviated appropriately

7. **Text Truncation & Overflow Prevention:**

   - **Keep labels short** - Aim for 1-2 words on mobile (e.g., "Cơ bản" instead of "Thông tin cơ bản")
   - **Use abbreviations** when appropriate (e.g., "HLV" for "Huấn Luyện Viên")
   - **Set maxWidth** on text elements that might overflow:
     ```typescript
     stepLabel: {
       maxWidth: 100,        // Prevent text overflow
       textAlign: 'center',  // Center align for better appearance
     }
     ```
   - **Use numberOfLines** with ellipsis for long text:
     ```typescript
     <Text numberOfLines={1} ellipsizeMode="tail">
       Long text here
     </Text>
     ```
   - **Test with longest possible text** - Use Vietnamese text which can be longer than English

8. **Flexbox Layout Balance:**

   - **Avoid mixing flex and fixed dimensions** in same parent:

     ```typescript
     // ❌ BAD: Unbalanced layout
     <View style={{flexDirection: 'row'}}>
       <View style={{flex: 1}}>Step 1</View>
       <View style={{width: 40}} />  {/* Fixed width line */}
       <View style={{flex: 1}}>Step 2</View>
     </View>

     // ✅ GOOD: Balanced layout
     <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
       <View>Step 1</View>
       <View style={{width: 60}} />  {/* Fixed connector */}
       <View>Step 2</View>
     </View>
     ```

   - **Use space-between for even distribution** instead of center when items should be edge-aligned
   - **Remove unnecessary flex: 1** if it causes uneven spacing
   - **Test symmetry** - Left/right spacing should visually match

9. **Vertical Layout Strategy for Buttons/Cards:**

   - **Use column layout when text is long:**
     ```typescript
     roleButton: {
       flexDirection: 'column',  // Stack items vertically
       alignItems: 'center',     // Center all items
       gap: 6,                   // Space between icon, radio, text
       paddingVertical: 12,
       minHeight: 90,            // Ensure consistent height
     }
     ```
   - **Benefits:** Prevents horizontal overflow, allows text to wrap, clearer visual hierarchy
   - **Order:** Radio/checkbox → Icon → Text label (top to bottom)

10. **Cross-Platform Compatibility (iOS & Android):**

- **Always test UI changes on both platforms** - what looks good on iOS may need adjustments for Android
- **Use Platform-specific components when needed:**

  ```typescript
  import { Platform } from 'react-native';

  // Example: Different shadows for iOS vs Android
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
  ```

- **Avoid iOS-only properties** on Android (shadowColor, shadowOffset, shadowOpacity, shadowRadius)
- **Use `elevation` for Android** instead of shadow properties
- **Combine both for universal support:**
  ```typescript
  shadowColor: '#059669',    // iOS only
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
  elevation: 3,              // Android only
  ```
- **KeyboardAvoidingView behavior:** `padding` for iOS, `undefined` for Android
- **Test touch targets:** Android typically needs slightly larger hit areas than iOS
- **Safe areas:** Use `react-native-safe-area-context` for notch/status bar handling on both platforms

### Enterprise/Professional Button Design

**Design Philosophy:**

- **Minimal & Refined:** Less roundness, subtle shadows, professional color palette
- **Clear Hierarchy:** Primary vs secondary actions distinguished by fill vs outline
- **Visual Polish:** Letter spacing, shadows, and borders for depth
- **Avoid Childish Patterns:** No bright blues, excessive roundness (18-20px), or bubble-like appearance

**Button Standards:**

1. **Primary Action Buttons:**

   ```typescript
   primaryButton: {
     backgroundColor: '#059669',      // Professional green (brand color)
     paddingVertical: 14,
     paddingHorizontal: 24,
     borderRadius: 8,                 // Subtle, not overly round
     alignItems: 'center',
     shadowColor: '#059669',          // Colored shadow for depth
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.15,
     shadowRadius: 4,
     elevation: 3,
   },
   primaryButtonText: {
     color: '#FFFFFF',
     fontSize: 15,
     fontWeight: '700',               // Bold but not extra bold (not 800)
     letterSpacing: 0.3,              // Adds polish
   },
   ```

2. **Secondary Action Buttons (Ghost/Outline):**

   ```typescript
   secondaryButton: {
     backgroundColor: '#FFFFFF',
     paddingVertical: 14,
     paddingHorizontal: 24,
     borderRadius: 8,
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#D1D5DB',          // Subtle gray border
   },
   secondaryButtonText: {
     color: '#374151',                // Dark gray, not black
     fontSize: 15,
     fontWeight: '600',
   },
   ```

3. **Icon-Only Buttons (Header Close, Actions):**
   ```typescript
   iconButton: {
     width: 36,
     height: 36,
     borderRadius: 8,                 // Square with rounded corners, not circle
     backgroundColor: 'transparent',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 1,
     borderColor: '#E5E7EB',          // Light border for definition
   },
   ```

**Anti-Patterns to Avoid:**

- ❌ Bright blue (#3B82F6) for primary actions - too playful
- ❌ High border radius (12-20px) - looks childish
- ❌ Circular buttons (borderRadius: half of width/height) - toy-like
- ❌ Filled gray backgrounds (#F3F4F6) without borders - undefined/mushy
- ❌ Font weight 800 - too heavy, aggressive
- ❌ Multiple filled buttons side-by-side - no hierarchy

**Best Practices:**

- ✅ Use brand green (#059669) for primary actions
- ✅ Use outline/ghost for secondary actions
- ✅ Border radius: 8px for buttons, 6-10px for small elements
- ✅ Font weight: 700 for primary, 600 for secondary
- ✅ Add subtle shadows to primary buttons only
- ✅ Use letter spacing (0.3-0.5) for polish
- ✅ Transparent backgrounds with borders for minimal look

**Reference Implementations:**

- `components/coach/calendar/CustomWeeklyCalendar.tsx` - Aggressive compact calendar layout
- `components/coach/calendar/SessionDetailModal.tsx` - Professional button styles (primary green, ghost secondary, minimal icon buttons)
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
import { router, useLocalSearchParams } from "expo-router";
router.push("/(coach)/home" as Href);
router.replace("/(auth)");
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
import { Modal, ScrollView } from "react-native";

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
      presentationStyle="pageSheet" // iOS: slides up from bottom
      onRequestClose={handleModalClose}
    >
      <View style={styles.modalContainer}>
        <ScrollView>
          {/* Header with close button */}
          <TouchableOpacity
            onPress={handleModalClose}
            style={styles.closeButton}
          >
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
8. **SafeAreaView in Nested Stack Layouts:** Pages inside Stack layouts (e.g., `menu/_layout.tsx`, `course/_layout.tsx`) should NOT use SafeAreaView because the parent Stack's `contentStyle` already applies safe area padding via `useSafeAreaInsets()`. Use regular `View` instead to avoid double padding. Example:

   ```typescript
   // ❌ WRONG - causes double padding
   import {
     SafeAreaView,
     useSafeAreaInsets,
   } from "react-native-safe-area-context";

   export default function Page() {
     const insets = useSafeAreaInsets();
     return (
       <SafeAreaView
         style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 80 }}
       >
         {/* Content */}
       </SafeAreaView>
     );
   }

   // ✅ CORRECT - parent Stack layout handles it
   export default function Page() {
     return (
       <View style={styles.container}>
         {/* Content - padding already applied by parent Stack */}
       </View>
     );
   }
   ```

   Parent Stack layout example:

   ```typescript
   export default function MenuStackLayout() {
     const insets = useSafeAreaInsets();
     return (
       <Stack
         screenOptions={{
           headerShown: false,
           contentStyle: {
             backgroundColor: "#FFFFFF",
             paddingTop: insets.top, // Applies to all child pages
             paddingBottom: insets.bottom + 80, // Accounts for tab bar
           },
         }}
       />
     );
   }
   ```

   **Navigation Hierarchy:**

   - `app/(coach)/` → Tabs layout (no insets - uses tab navigator)
   - `app/(coach)/menu/` → Stack layout (adds insets via contentStyle)
   - `app/(coach)/menu/profile/` → Child page (uses View, inherits padding from Stack)
   - `app/(coach)/menu/subject/` → Child page (uses View, inherits padding from Stack)

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
