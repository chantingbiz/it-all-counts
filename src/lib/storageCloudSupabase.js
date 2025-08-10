// Cloud storage implementation for Supabase (safe scaffold implementation)
// This file is dynamically imported only when VITE_CLOUD_SYNC === "true"
// For now, it delegates to local storage to maintain identical behavior

import { createLocalStore } from './storage.js';

// TODO: Add Supabase client imports when implementing
// import { createClient } from '@supabase/supabase-js';

// TODO: Add environment variables for Supabase
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function createCloudStore() {
  // TODO: Initialize Supabase client
  // const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // TODO: Check authentication status
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) {
  //   // For now, fall back to local storage if not authenticated
  //   // Later: implement sign-in flow
  //   console.log('User not authenticated, using local storage fallback');
  //   return createLocalStore();
  // }

  // For now, delegate to local storage to maintain identical behavior
  // This ensures the app works exactly the same even if someone enables the flag
  const localStore = createLocalStore();
  
  return {
    adapterName: "cloud",
    
    async loadTodos() {
      // TODO: Implement Supabase query
      // const { data, error } = await supabase
      //   .from('todos')
      //   .select('*')
      //   .eq('user_id', user.id);
      // 
      // if (error) throw error;
      // return data;
      
      return localStore.loadTodos();
    },

    async saveTodos(state) {
      // TODO: Implement Supabase upsert
      // const { error } = await supabase
      //   .from('todos')
      //   .upsert({
      //     user_id: user.id,
      //     recurring_tasks: state.recurringTasks,
      //     one_time_tasks: state.oneTimeTasks,
      //     completed_tasks: state.completedTasks,
      //     updated_at: new Date().toISOString()
      //   });
      // 
      // if (error) throw error;
      
      return localStore.saveTodos(state);
    },

    async loadVideoSettings() {
      // TODO: Implement Supabase query
      // const { data, error } = await supabase
      //   .from('user_settings')
      //   .select('video_settings')
      //   .eq('user_id', user.id)
      //   .single();
      // 
      // if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      // return data?.video_settings || { selectedGroupIds: new Set(["fun"]) };
      
      return localStore.loadVideoSettings();
    },

    async saveVideoSettings(settings) {
      // TODO: Implement Supabase upsert
      // const { error } = await supabase
      //   .from('user_settings')
      //   .upsert({
      //     user_id: user.id,
      //     video_settings: {
      //       selectedGroupIds: Array.from(settings.selectedGroupIds)
      //     },
      //     updated_at: new Date().toISOString()
      //   });
      // 
      // if (error) throw error;
      
      return localStore.saveVideoSettings(settings);
    },

    // TODO: Implement real-time subscriptions for onChange
    onChange(callback) {
      // TODO: Set up Supabase real-time subscription
      // const subscription = supabase
      //   .channel('todos_changes')
      //   .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, callback)
      //   .subscribe();
      // 
      // return () => subscription.unsubscribe();
      
      // For now, delegate to local storage (no-op)
      return localStore.onChange(callback);
    }
  };
}
