# SearchModal Component

Reusable search modal component for car rental searches with integrated map functionality.

## Features

- ✅ Date & time picker for pickup/return
- ✅ Interactive map with Leaflet.js (no API key required)
- ✅ Station selection with user geolocation
- ✅ Automatic rental duration calculation
- ✅ Form validation
- ✅ Responsive design
- ✅ Side-by-side layout when map is open

## Usage

### Basic Usage

```jsx
import SearchModal from './components/Home/SearchModal'

function MyPage() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [stations, setStations] = useState([])
  const [userLocation, setUserLocation] = useState(null)

  function handleSearch(searchData) {
    // Handle search submission
    console.log('Search data:', searchData)
    // searchData contains:
    // {
    //   location: string (station ID),
    //   locationName: string,
    //   pickupDate: string (YYYY-MM-DD),
    //   pickupTime: string (HH:MM),
    //   returnDate: string (YYYY-MM-DD),
    //   returnTime: string (HH:MM)
    // }
  }

  return (
    <>
      <button onClick={() => setSearchOpen(true)}>Search Cars</button>
      
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        stations={stations}
        userLocation={userLocation}
        onSearch={handleSearch}
      />
    </>
  )
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | Yes | Controls modal visibility |
| `onClose` | function | Yes | Callback when modal is closed |
| `stations` | array | No | List of station objects |
| `userLocation` | object | No | User's location `{ lat, lng }` |
| `onSearch` | function | Yes | Callback when search is submitted |

### Station Object Structure

```javascript
{
  id: string,           // or Id, stationId, StationId
  name: string,         // or Name, stationName
  address: string,      // or Address
  latitude: number,     // Optional: for custom coordinates
  longitude: number     // Optional: for custom coordinates
}
```

### Fallback Coordinates

The component includes hardcoded coordinates for Ho Chi Minh City stations:
- District 1 - Nguyen Hue
- District 4 - Khanh Hoi
- Binh Thanh - Pearl Plaza
- District 7 - Phu My Hung
- Go Vap - Emart
- Tan Binh - Airport

To add more stations, edit the `getStationCoordinates()` function in `SearchModal.jsx`.

## Dependencies

- `react` v18+
- `leaflet` v1.9+
- `react-leaflet` v4.2+
- Font Awesome 5 (for icons)

## Installation

```bash
npm install leaflet react-leaflet@4.2.1 --legacy-peer-deps
```

## Styling

The component uses `SearchModal.css` for styling. All styles are scoped with `!important` to avoid conflicts.

## Map Integration

The search modal automatically integrates with `MapModal` component which uses:
- **Leaflet.js** + **OpenStreetMap** (free, no API key)
- User geolocation
- Interactive markers
- Popup windows
- Auto-zoom to fit all markers

## Reusability

This component can be reused in:
- **HomePage** - Main search interface
- **CarListPage** - Modify search filters
- **Any page** - Standalone search modal

## Example: Car List Page

```jsx
import SearchModal from '../Home/SearchModal'

function CarListPage() {
  const [searchOpen, setSearchOpen] = useState(false)
  
  function handleSearch(searchData) {
    // Update URL params and refetch cars
    const params = new URLSearchParams({
      location: searchData.location,
      'pickup-date': searchData.pickupDate,
      'pickup-time': searchData.pickupTime,
      'return-date': searchData.returnDate,
      'return-time': searchData.returnTime
    })
    window.location.href = `/cars?${params.toString()}`
  }

  return (
    <>
      <button onClick={() => setSearchOpen(true)}>
        Modify Search
      </button>
      
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        stations={stations}
        userLocation={userLocation}
        onSearch={handleSearch}
      />
    </>
  )
}
```

## Notes

- Map modal and search modal appear side-by-side when map is open
- Backdrop is shown only when map is closed
- All dates are validated (no past dates, return after pickup)
- Minimum rental: 1 hour
- Time slots: 6:00 AM - 11:00 PM

## Troubleshooting

### Map not loading
- Check browser console for errors
- Ensure Leaflet CSS is imported
- Verify internet connection for OpenStreetMap tiles

### Geolocation not working
- Browser must support geolocation API
- User must grant location permission
- Falls back to Ho Chi Minh City center if denied

### Styling conflicts
- All styles use `!important` flags
- If conflicts persist, increase specificity or adjust z-index values
