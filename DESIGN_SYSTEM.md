# FastCards Design System

**Generated from ui-ux-pro-max methodology** for a flashcard/spaced repetition learning app.

---

## 🎨 Design Foundation

### Style: Claymorphism

- **Personality:** Soft 3D, chunky, playful, toy-like, bubbly
- **Characteristics:**
  - Thick borders (3-4px)
  - Dual shadows (subtle inner + outer)
  - High border-radius (16-24px)
  - Smooth transitions (150-300ms ease-out)
- **Best For:** Educational apps, kids' apps, fun-focused experiences

### Pattern: App Store Style Landing

- Focus on visual hierarchy with device mockups
- Real screenshots with ratings (4.5+ stars)
- Clear CTAs and download buttons

---

## 🎯 Color Palette

| Role               | Color        | Hex       | Usage                              |
| ------------------ | ------------ | --------- | ---------------------------------- |
| **Primary**        | Indigo       | `#4F46E5` | Primary UI, navigation, highlights |
| **Secondary**      | Light Indigo | `#818CF8` | Supporting elements, backgrounds   |
| **CTA/Success**    | Green        | `#22C55E` | Completion, mastery, progress      |
| **Warning**        | Orange       | `#F97316` | Actions to review, retry           |
| **Background**     | Light Indigo | `#EEF2FF` | Page backgrounds, subtle fills     |
| **Text Primary**   | Dark Indigo  | `#312E81` | Main text, headings                |
| **Text Secondary** | Slate        | `#64748B` | Secondary text, hints              |

**Learning Rationale:**

- **Indigo (Primary):** Represents learning, focus, intelligence
- **Green (CTA):** Represents progress, mastery, completion
- **Orange (Warning):** Represents "learn again" action

---

## 🔤 Typography

### Font Families

- **Headings:** [Baloo 2](https://fonts.google.com/specimen/Baloo+2) (400, 500, 600, 700)
- **Body:** [Comic Neue](https://fonts.google.com/specimen/Comic+Neue) (300, 400, 700)
- **Fallback:** System fonts (Inter, SF Pro Display)

### Type Scale

| Level        | Size | Weight | Use Case       | Tailwind Class          |
| ------------ | ---- | ------ | -------------- | ----------------------- |
| Heading 1    | 32px | 900    | Page titles    | `text-4xl font-black`   |
| Heading 2    | 24px | 900    | Section titles | `text-2xl font-black`   |
| Heading 3    | 20px | 700    | Subsections    | `text-xl font-bold`     |
| Body Large   | 18px | 600    | Card titles    | `text-lg font-semibold` |
| Body Regular | 16px | 500    | Default text   | `text-base font-medium` |
| Body Small   | 14px | 500    | Secondary info | `text-sm font-medium`   |
| Micro        | 12px | 600    | Labels, hints  | `text-xs font-semibold` |

### Example Usage

```tsx
// Heading 1
<Text className="text-4xl font-black text-indigo-950">My Decks</Text>

// Heading 3
<Text className="text-xl font-bold text-slate-800">Deck Name</Text>

// Body + Secondary
<Text className="text-base font-medium text-slate-600">
  12 cards • 85% mastery
</Text>

// Label
<Text className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
  Progress
</Text>
```

---

## 🎛️ Component Specifications

### Buttons

**Primary CTA (Green)**

```tsx
<TouchableOpacity
  className="bg-gradient-to-r from-green-400 to-green-500 px-8 py-4 rounded-3xl shadow-lg shadow-green-200 active:scale-95 transition-all"
  activeOpacity={0.8}
>
  <Text className="text-white font-bold">Mastered</Text>
</TouchableOpacity>
```

**Secondary Button (White/Outline)**

```tsx
<TouchableOpacity
  className="bg-white border-2 border-orange-200 px-6 py-4 rounded-3xl shadow-md active:scale-95"
  activeOpacity={0.8}
>
  <Text className="text-orange-600 font-bold">Learn Again</Text>
</TouchableOpacity>
```

**Icon Button**

```tsx
<Pressable className="bg-white p-3 rounded-full shadow-md active:shadow-lg active:scale-95">
  <Ionicons name="volume-medium" size={24} color="#4F46E5" />
</Pressable>
```

### Cards

**Deck Card**

```tsx
<View className="bg-white rounded-3xl p-6 shadow-md mb-4">
  <View className="flex-row justify-between items-start gap-4 mb-4">
    <View>
      <Text className="text-2xl font-black text-indigo-950">Deck Name</Text>
      <Text className="text-indigo-600 text-sm font-semibold">12 cards</Text>
    </View>
    <View className="bg-green-50 px-4 py-2 rounded-xl">
      <Text className="text-green-700 font-black">85%</Text>
    </View>
  </View>

  {/* Progress Bar */}
  <View className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
    <View
      className="h-full bg-gradient-to-r from-green-400 to-green-500"
      style={{ width: "85%" }}
    />
  </View>
</View>
```

### Progress Indicators

**Progress Bar**

```tsx
<View className="h-3 w-full bg-indigo-100 rounded-full overflow-hidden shadow-inner">
  <View
    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
    style={{ width: `${progressPercentage}%` }}
  />
</View>
```

### Flashcard

**Specifications:**

- Size: 320px width × 256px height (adjustable for responsive)
- Border radius: 24px (rounded-3xl)
- Front: White/light gradient background
- Back: Indigo gradient background
- Flip animation: 600ms cubic-bezier ease
- Shadow: Multiple layers for Claymorphism effect

---

## 📱 Spacing & Layout

### Safe Area Usage

Always wrap screens with `<SafeAreaView>`:

```tsx
<SafeAreaView className="flex-1 bg-gradient-to-b from-indigo-50 to-white">
  {/* Content */}
</SafeAreaView>
```

### Gap Standards

- **8px (gap-2):** Between touch targets (minimum)
- **12px (gap-3):** Between elements
- **16px (gap-4):** Between sections
- **24px (gap-6):** Between major sections

### Padding Standards

- **16px (p-4):** Card padding, section padding
- **24px (p-6):** Large card padding, page edges
- **32px (p-8):** Hero sections, large spacing

---

## ✨ Effects & Animations

### Haptic Feedback

```tsx
// Light press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Success feedback
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Warning feedback
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

### Transitions

- **Active state:** `active:scale-95 transition-all` (press feedback)
- **Hover effects:** 150-300ms smooth ease-out
- **Animations:** Use `react-native-reanimated` for complex animations
- **Disabled state:** Reduce opacity, disable interactions

### Loading States

```tsx
<ActivityIndicator size="large" color="#4F46E5" />
```

---

## ♿ Accessibility Guidelines

### Semantic Structure

1. Always use `SafeAreaView` for screen wrappers
2. Use proper `accessibilityRole` and `accessibilityLabel` on interactive elements
3. Set `accessibilityHint` for complex interactions
4. Use `accessibilityState={{ disabled: isLoading }}`

### Color Contrast

- **Minimum:** 4.5:1 for text on background
- **Test:** Use WCAG AAA standards
- Current palette meets 4.5:1+ contrast ratios

### Touch Targets

- **Minimum size:** 44×44px (recommended)
- **Minimum gap:** 8px between targets
- **Feedback:** Visual + haptic feedback on interaction

### Example:

```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Start studying this deck"
  accessibilityHint="Opens the study screen with flashcards"
  accessibilityState={{ disabled: isLoading }}
  onPress={handlePress}
>
  <Text>Study</Text>
</TouchableOpacity>
```

---

## 🎨 Gradient Usage

### Primary Gradient

```tsx
className = "bg-gradient-to-b from-indigo-50 to-white";
```

### Success Gradient

```tsx
className = "bg-gradient-to-r from-green-400 to-green-500";
```

### Card Gradient (Front)

```tsx
className = "bg-gradient-to-br from-white to-indigo-50";
```

### Card Gradient (Back)

```tsx
className = "bg-gradient-to-br from-indigo-600 to-indigo-700";
```

---

## 🚫 Anti-Patterns to Avoid

❌ **Don't:**

- Use dark modes (contrary to app's playful personality)
- Use complex jargon in UI text
- Place buttons with less than 8px gap
- Use rapid animations (>300ms)
- Skip accessibility labels on interactive elements
- Use small fonts (<12px) for important information
- Ignore SafeAreaView on edges
- Use hard-edged rectangles (use rounded corners)

✅ **Do:**

- Maintain consistent spacing (8px grid)
- Use haptic feedback for interactions
- Provide loading states for async operations
- Use proper color hierarchy
- Test on multiple device sizes
- Ensure touch targets are 44px minimum
- Use semantic HTML/accessibility props
- Show empty states with helpful CTAs

---

## 📦 Implementation Checklist

Before shipping any feature:

- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] `cursor-pointer` class on all clickable elements
- [ ] Hover/active states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected (reduce animations if set)
- [ ] Responsive across 375px, 768px, 1024px, 1440px viewports
- [ ] Accessibility labels on all interactive elements
- [ ] Loading states for async operations
- [ ] Error states with helpful messages
- [ ] Empty states with CTAs
- [ ] Haptic feedback on interactions
- [ ] SafeAreaView wrapping all screens
- [ ] Proper semantic structure

---

## 🔗 Resources

- **Fonts:** [Baloo 2](https://fonts.google.com/specimen/Baloo+2) | [Comic Neue](https://fonts.google.com/specimen/Comic+Neue)
- **Icons:** [Ionicons](https://ionic.io/ionicons) (built-in to Expo)
- **Animation:** [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Haptics:** [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
- **CSS Framework:** [NativeWind](https://www.nativewind.dev/) (Tailwind for React Native)

---

**Last Updated:** April 26, 2026  
**Methodology:** ui-ux-pro-max v2.0
