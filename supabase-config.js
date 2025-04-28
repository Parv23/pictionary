// Supabase configuration
const supabaseUrl = 'https://lqkshowfqzzqljbjczzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxa3Nob3dmcXp6cWxqYmpjenp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MjcwOTYsImV4cCI6MjA2MTQwMzA5Nn0.ses8AGMrrfRWiiLwpg1KCD-iRLD4PxpgPYB9YxaoHpk';

console.log('DEBUG: supabase-config.js loaded');
console.log('DEBUG: window.supabase exists:', !!window.supabase);

// Initialize Supabase client
let supabase;
try {
  console.log('DEBUG: Attempting to initialize Supabase client');
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  console.log('DEBUG: Supabase client initialized successfully', !!supabase);
} catch (error) {
  console.error('DEBUG: Failed to initialize Supabase client:', error);
}

// Export database for use in other files
// No change to how other files access this - they'll still use roomsCollection
const roomsCollection = {
  doc: (roomCode) => {
    return {
      set: async (data) => {
        try {
          console.log(`DEBUG: Creating room ${roomCode} with data:`, data);
          const { data: response, error } = await supabase
            .from('rooms')
            .insert([{ ...data, id: roomCode }]);
          
          if (error) {
            console.error('DEBUG: Error creating room:', error);
            throw error;
          }
          console.log('DEBUG: Room created successfully:', response);
          return response;
        } catch (error) {
          console.error('DEBUG: Error creating room:', error);
          throw error;
        }
      },
      update: async (data) => {
        try {
          console.log(`DEBUG: Updating room ${roomCode} with data:`, data);
          const { data: response, error } = await supabase
            .from('rooms')
            .update(data)
            .eq('id', roomCode);
          
          if (error) {
            console.error('DEBUG: Error updating room:', error);
            throw error;
          }
          console.log('DEBUG: Update successful:', response);
          return response;
        } catch (error) {
          console.error('DEBUG: Error updating room:', error);
          throw error;
        }
      },
      get: async () => {
        try {
          console.log(`DEBUG: Getting room data for ${roomCode}`);
          const { data: response, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', roomCode)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            // PGRST116 is the "no rows returned" error, which we handle as "not exists"
            console.error('DEBUG: Error fetching room:', error);
            throw error;
          }
          
          const exists = response !== null;
          console.log(`DEBUG: Room ${roomCode} exists: ${exists}`, response);
          
          return {
            exists: exists,
            data: () => response
          };
        } catch (error) {
          console.error('DEBUG: Error in get operation:', error);
          throw error;
        }
      },
      onSnapshot: (callback, errorCallback) => {
        try {
          console.log(`DEBUG: Setting up realtime subscription for room ${roomCode}`);
          
          // First get the initial data
          supabase
            .from('rooms')
            .select('*')
            .eq('id', roomCode)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error('DEBUG: Error fetching initial room data:', error);
                if (errorCallback) errorCallback(error);
                return;
              }
              
              if (data) {
                console.log('DEBUG: Initial room data:', data);
                callback({
                  exists: true,
                  data: () => data
                });
              } else {
                console.log(`DEBUG: Room ${roomCode} not found initially`);
              }
            });
          
          // Then subscribe to changes
          const channelName = `room-${roomCode}-changes`;
          console.log(`DEBUG: Creating channel: ${channelName}`);
          
          const channel = supabase
            .channel(channelName)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'rooms',
                filter: `id=eq.${roomCode}`
              },
              (payload) => {
                console.log('DEBUG: Received realtime update:', payload);
                callback({
                  exists: true,
                  data: () => payload.new
                });
              }
            )
            .subscribe((status) => {
              console.log(`DEBUG: Subscription status for ${channelName}:`, status);
            });
          
          // Return unsubscribe function
          return () => {
            console.log(`DEBUG: Unsubscribing from channel ${channelName}`);
            supabase.removeChannel(channel);
          };
        } catch (error) {
          console.error('DEBUG: Error setting up realtime subscription:', error);
          if (errorCallback) errorCallback(error);
          // Return a no-op unsubscribe function
          return () => {};
        }
      }
    };
  }
}; 