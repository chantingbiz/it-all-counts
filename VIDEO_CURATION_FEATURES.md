# Video Curation Features

This document describes the new video curation system that has been added to the "It All Counts" app.

## Overview

The video curation system provides users with the ability to:
- Like and dislike videos
- Navigate between videos with Previous/Next buttons
- View video history with filtering options
- Monitor cache usage for liked videos
- Automatically skip disliked videos during autoplay

## Features

### 1. Like/Dislike System

**Location**: Video player footer (right side)
**Functionality**: 
- 👍 Like button: Toggle video like status
- 👎 Dislike button: Toggle video dislike status
- Visual feedback: Green background for liked, red for disliked
- Mutual exclusivity: Liking a video removes dislike, and vice versa

**Keyboard Shortcuts**:
- `H` key: Open/close History modal

### 2. Previous/Next Navigation

**Location**: Video modal header (right side)
**Functionality**:
- Previous button: Go to the previous video in history
- Next button: Go to the next random video from the pool
- Arrow icons: Visual indicators for navigation direction
- Keyboard shortcuts: `P` for previous, `N` for next

**Note**: Previous navigation uses a history stack, so it will go back through videos you've watched in the current session.

### 3. History Modal

**Location**: Below video player footer
**Access**: Click "Video History" button
**Features**:
- **Tabs**: All / Liked / Disliked
- **Grid Layout**: Responsive thumbnail grid (1-3 columns based on screen size)
- **Thumbnails**: Video posters with fallback for missing images
- **Actions**: Like/Dislike toggle buttons and Play button for each video
- **Cache Meter**: Shows estimated storage usage for liked videos

### 4. Cache Management

**Location**: History modal header (right side)
**Display**: Shows "Cache: X / Y MB" with visual progress bar
**Functionality**:
- Estimates storage usage based on liked video count
- Configurable cap (default: 300MB)
- Uses device storage quota when available
- Fallback to estimated usage based on video count × average size

### 5. Playback Rules

**Autoplay Behavior**:
- Disliked videos are never selected for autoplay
- Videos are automatically skipped if they become disliked during a session

**Replay Detection**:
- Videos watched within 24 hours are considered "replays"
- Replays don't consume rate limiting tokens (when rate limiting is implemented)

**History Reset**:
- History automatically resets daily at local midnight
- Based on device clock, not server time
- Only keeps entries from the current day

## Technical Implementation

### File Structure

```
src/
├── lib/
│   └── userPrefs.js          # Core preferences and history management
├── components/
│   ├── HistoryModal.jsx      # History display modal
│   ├── MotivateModal.jsx     # Updated with navigation and history
│   └── VideoPlayer.jsx       # Updated with like/dislike buttons
└── hooks/
    └── useShuffleBag.js      # Enhanced with previous navigation
```

### Data Storage

**Local Storage Key**: `iac-user-prefs-v1`
**Data Structure**:
```javascript
{
  likes: { [videoId]: true },           // Liked videos
  dislikes: { [videoId]: true },        // Disliked videos
  history: [                            // Watch history
    {
      videoId: string,
      title: string,
      poster: string,
      ts: number,                        // UTC timestamp
      liked: boolean,
      disliked: boolean
    }
  ],
  avgVideoMB: 8,                        // Average video size estimate
  cacheCapMB: 300,                      // Cache capacity limit
  lastHistoryDay: "YYYY-MM-DD"          // Last history normalization date
}
```

### API Functions

**Core Functions**:
- `getPrefs()`: Get current preferences (auto-normalizes history)
- `setPrefs(state)`: Save preferences
- `markWatched({videoId, title, poster})`: Record video watch
- `setLike(videoId, on)`: Toggle like status
- `setDislike(videoId, on)`: Toggle dislike status
- `isLiked(videoId)`: Check if video is liked
- `isDisliked(videoId)`: Check if video is disliked
- `getHistory()`: Get watch history
- `getCacheEstimateMB()`: Get cache usage estimate

**Utility Functions**:
- `normalizeHistoryDay()`: Clean up old history entries
- `localDayStr(date)`: Format date as YYYY-MM-DD

## Usage Examples

### Basic Like/Dislike

```javascript
import { setLike, setDislike, isLiked } from '../lib/userPrefs';

// Like a video
setLike('video-123', true);

// Check if video is liked
if (isLiked('video-123')) {
  console.log('Video is liked!');
}

// Remove like
setLike('video-123', false);
```

### Recording Video Watch

```javascript
import { markWatched } from '../lib/userPrefs';

// When video starts playing
markWatched({
  videoId: 'video-123',
  title: 'Motivational Speech',
  poster: 'thumbnail.jpg'
});
```

### Getting History

```javascript
import { getHistory, getPrefs } from '../lib/userPrefs';

// Get all history
const allHistory = getHistory();

// Get only liked videos
const prefs = getPrefs();
const likedVideos = allHistory.filter(h => prefs.likes[h.videoId]);
```

## Future Enhancements

### Planned Features

1. **Video Metadata**: Integrate with video metadata service for better titles and descriptions
2. **Thumbnail Generation**: Auto-generate thumbnails from video content
3. **Cloud Sync**: Sync preferences across devices
4. **Advanced Filtering**: Filter by date, duration, category, etc.
5. **Playlist Support**: Create and manage video playlists
6. **Export/Import**: Backup and restore preferences

### Technical Improvements

1. **Rate Limiting Integration**: Connect replay detection with existing rate limiting system
2. **Performance Optimization**: Implement virtual scrolling for large history lists
3. **Offline Support**: Cache video metadata for offline viewing
4. **Analytics**: Track user engagement patterns

## Browser Compatibility

- **Local Storage**: Modern browsers (IE8+, Chrome 4+, Firefox 3.5+)
- **Storage API**: Chrome 43+, Firefox 44+, Safari 11.1+
- **CSS Grid**: Modern browsers (IE11+ with polyfill)
- **ES6 Features**: Modern browsers (Chrome 51+, Firefox 54+, Safari 10+)

## Performance Considerations

- **History Limit**: Capped at 500 entries to prevent memory issues
- **Lazy Loading**: History modal only loads data when opened
- **Debounced Updates**: Storage writes are optimized to prevent excessive I/O
- **Memory Management**: Old history entries are automatically cleaned up daily

## Troubleshooting

### Common Issues

1. **History Not Showing**: Check if localStorage is enabled and not full
2. **Like/Dislike Not Working**: Verify browser console for JavaScript errors
3. **Cache Meter Inaccurate**: May need to adjust `avgVideoMB` setting
4. **Previous Button Disabled**: No previous videos in current session history

### Debug Mode

Enable debug logging by setting in browser console:
```javascript
localStorage.setItem('iac-debug', 'true');
```

## Contributing

When adding new features to the video curation system:

1. **Follow Existing Patterns**: Use the established API structure
2. **Add Tests**: Include unit tests for new functionality
3. **Update Documentation**: Keep this document current
4. **Performance**: Consider impact on storage and memory usage
5. **Accessibility**: Ensure keyboard navigation and screen reader support

## License

This feature is part of the "It All Counts" app and follows the same licensing terms.
