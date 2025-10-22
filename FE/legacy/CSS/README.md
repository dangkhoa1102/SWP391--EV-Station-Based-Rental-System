# CSS Organization Structure

This project has been reorganized to use a cleaner CSS structure with separate files for different components and pages.

## CSS Directory Structure

```
CSS/
├── shared.css           # Shared components (user menu, notifications)
├── home_page.css        # Home page specific styles (currently empty as styles moved to shared.css)
├── booking_history.css  # Booking history page styles
├── payment_page.css     # Payment page specific styles
└── user_profile.css     # User profile page specific styles
```

## File Organization

### Main CSS Files
- `style.css` - Main stylesheet with global styles and base components
- `CSS/shared.css` - Shared UI components used across multiple pages

### Page-Specific CSS Files
- `CSS/home_page.css` - Home page specific styles
- `CSS/booking_history.css` - Booking history page styles
- `CSS/payment_page.css` - Payment page styles
- `CSS/user_profile.css` - User profile page styles

## CSS Loading Order

Each HTML page follows this loading order:
1. `style.css` (base styles)
2. `CSS/shared.css` (if page uses shared components)
3. `CSS/[page-name].css` (page-specific styles)
4. External CSS libraries (Font Awesome, etc.)

## Shared Components Included

### User Menu System
- `.user-menu` - Container for user menu
- `.user-menu-btn` - Animated burger button with gradient background
- `.user-dropdown` - Dropdown menu container
- `.dropdown-header` - Header with user info
- Menu items with different hover colors:
  - User Profile: Blue theme (#3498db)
  - Booking History: Green theme (#2ecc71) 
  - Logout: Red theme (#e74c3c)

### Notification System
- `.notification` - Base notification styles
- `.notification.success` - Success notifications (green)
- `.notification.error` - Error notifications (red)
- `.notification.show` - Animation class for showing notifications

### Animations
- `@keyframes pulse` - Pulsing animation for user menu button
- `@keyframes shake` - Shake animation for logout button hover

## Benefits of This Structure

1. **Modularity** - Each page has its own CSS file for specific styles
2. **Reusability** - Shared components are centralized in shared.css
3. **Maintainability** - Easier to find and modify specific styles
4. **Performance** - Only load necessary CSS for each page
5. **Organization** - Clear separation between global and page-specific styles

## Usage Example

```html
<!-- For home page -->
<link rel="stylesheet" href="style.css" />
<link rel="stylesheet" href="CSS/shared.css" />
<link rel="stylesheet" href="CSS/home_page.css" />

<!-- For booking history page -->
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="CSS/shared.css">
<link rel="stylesheet" href="CSS/booking_history.css">
```

## Migration Notes

- All inline `<style>` tags have been removed from HTML files
- User menu and notification styles are now centralized in `shared.css`
- Page-specific styles are separated into individual CSS files
- Original functionality is preserved with improved organization