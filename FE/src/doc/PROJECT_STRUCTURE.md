# Project Structure Guidelines

## Folder Organization

### `/src/components`
**Shared/Reusable React Components**

Components that are used across multiple pages or features should be placed here.

Examples:
- `SearchModal.jsx` - Reusable search modal (used in HomePage, CarListPage)
- `MapModal.jsx` - Map modal component (integrated in SearchModal)
- `Header.jsx`, `Footer.jsx` - Common layout components
- `LoginModal.jsx`, `RegisterModal.jsx` - Authentication modals
- `ToastProvider.jsx` - Global toast notification provider

### `/src/styles`
**Shared/Global CSS Files**

CSS files for components in `/src/components` or global styles.

Examples:
- `SearchModal.css` - Styles for SearchModal component
- `MapModal.css` - Styles for MapModal component
- `base.css` - Base/reset styles
- `shared.css` - Shared utilities and common styles
- `toast.css` - Toast notification styles

**Note**: Component-specific CSS should stay with the component if it's not reusable.

### `/src/doc`
**Project Documentation**

All README files, setup guides, and documentation.

Examples:
- `SearchModal_README.md` - SearchModal component documentation
- `README_REACT_MIGRATION.md` - React migration notes

**Note**: Image uploads are handled by the Backend API. Frontend does not need Cloudinary configuration.

### `/src/renter/page/components/[Feature]`
**Feature-Specific Components**

Each feature folder should contain:
- Component file (`.jsx`)
- Component-specific CSS (`.css`)
- Feature-specific sub-components (if any)

Examples:
- `/Car`
  - `CarDetail.jsx` + `car_detail.css`
  - `CarListPage.jsx` + `car_list_page.css`
- `/Home`
  - `HomePage.jsx` + `home_page.css`
- `/Payment`
  - `PaymentPage.jsx` + `payment_page.css`

### `/src/services`
**API Service Files**

Centralized API calls and data fetching logic.

Examples:
- `api.js` - Base API configuration
- `renterApi.js` - Renter-related API calls
- `staffApi.js` - Staff-related API calls

### `/src/utils`
**Utility Functions**

Helper functions, constants, formatters.

Examples:
- `currency.js` - Currency formatting
- `dateUtils.js` - Date/time utilities
- `constants.js` - App-wide constants

### `/src/context`
**React Context Providers**

Global state management using React Context.

Examples:
- `AuthContext.jsx` - Authentication state

## Rules

1. **Reusable components** → `/src/components` + `/src/styles`
2. **Feature-specific components** → Stay in feature folder with their CSS
3. **Documentation** → `/src/doc`
4. **API calls** → `/src/services`
5. **Helper functions** → `/src/utils`
6. **Global state** → `/src/context`

## Import Path Examples

```jsx
// Shared components
import SearchModal from '../../../../components/SearchModal.jsx'
import { useToast } from '../../../../components/ToastProvider.jsx'

// Services
import API from '../../../services/renterApi.js'

// Utils
import { formatVND } from '../../../../utils/currency.js'

// Context
import { useAuth } from '../../../../context/AuthContext.jsx'

// Feature-specific (same folder)
import './car_detail.css'
```
