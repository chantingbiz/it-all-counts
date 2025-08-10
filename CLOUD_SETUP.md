# Cloud Sync Setup Guide

This app now includes a storage abstraction layer that can use either local storage (default) or cloud storage via Supabase.

## Current Behavior

By default, the app uses local storage with versioned keys:
- `iac.todos.v1` - Stores recurring tasks, one-time tasks, and completed tasks
- `iac.videoSettings.v1` - Stores selected video group preferences

## Enabling Cloud Sync

To enable cloud sync:

1. **Set Environment Variable**
   ```bash
   VITE_CLOUD_SYNC=true
   ```

2. **Add Supabase Configuration** (when ready to implement)
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## When ready to enable cloud:

- [ ] Set `VITE_CLOUD_SYNC=true`
- [ ] Install `@supabase/supabase-js`
- [ ] Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Implement the TODOs in `storageCloudSupabase.js` (client init, CRUD)
- [ ] Verify the bundle now has a separate cloud chunk in build

## Implementation Status

- ✅ **Local Storage**: Fully implemented with versioned keys
- ✅ **Storage Abstraction**: Adapter pattern with unified interface
- ✅ **Cloud Stub**: Delegates to local storage (identical behavior)
- 🔄 **Supabase Integration**: TODO - implement actual cloud storage

## Cloud Implementation Notes

The cloud storage adapter (`src/lib/storageCloudSupabase.js`) currently:
- Delegates all operations to local storage
- Maintains identical behavior even when flag is enabled
- Includes TODO comments showing where Supabase code will go
- Is dynamically imported only when `VITE_CLOUD_SYNC=true`

## Bundle Impact

- **When `VITE_CLOUD_SYNC=false`**: No Supabase code is bundled
- **When `VITE_CLOUD_SYNC=true`**: Cloud adapter is loaded as a separate chunk
- **Performance**: No impact on app performance until cloud is fully implemented

## Next Steps for Full Cloud Implementation

1. Install Supabase client: `npm install @supabase/supabase-js`
2. Set up Supabase project and database tables
3. Implement authentication flow
4. Replace stub methods with actual Supabase queries
5. Add real-time subscriptions for `onChange` hooks
6. Test cloud sync functionality
