// Supabase configuration
const supabaseUrl = 'https://lqkshowfqzzqljbjczzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxa3Nob3dmcXp6cWxqYmpjenp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MjcwOTYsImV4cCI6MjA2MTQwMzA5Nn0.ses8AGMrrfRWiiLwpg1KCD-iRLD4PxpgPYB9YxaoHpk';

// Initialize Supabase client
let supabase;

// Function to initialize Supabase
function initializeSupabase() {
  // Check if window.supabase exists
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase SDK not loaded. Make sure the CDN script is included before this file.');
    return false;
  }
  
  try {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return false;
  }
}

// Initialize immediately
const supabaseInitialized = initializeSupabase();

// Export database for use in other files
const roomsCollection = {
  doc: (roomCode) => {
    return {
      set: async (data) => {
        try {
          // Ensure Supabase is initialized
          if (!supabase && !initializeSupabase()) {
            throw new Error('Supabase client is not initialized');
          }
          
          console.log(`Creating room ${roomCode} with data:`, data);
          const { data: response, error } = await supabase
            .from('rooms')
            .insert([{ ...data, id: roomCode }]);
          
          if (error) {
            console.error('Supabase error creating room:', error);
            throw error;
          }
          console.log('Room created successfully:', roomCode);
          return response;
        } catch (error) {
          console.error('Error creating room:', error);
          throw error;
        }
      },
      update: async (data) => {
        try {
          // Ensure Supabase is initialized
          if (!supabase && !initializeSupabase()) {
            throw new Error('Supabase client is not initialized');
          }
          
          console.log(`Updating room ${roomCode} with data:`, data);
          const { data: response, error } = await supabase
            .from('rooms')
            .update(data)
            .eq('id', roomCode);
          
          if (error) {
            console.error('Supabase error updating room:', error);
            throw error;
          }
          console.log('Update successful:', response);
          return response;
        } catch (error) {
          console.error('Error updating room:', error);
          throw error;
        }
      },
      get: async () => {
        try {
          // Ensure Supabase is initialized
          if (!supabase && !initializeSupabase()) {
            throw new Error('Supabase client is not initialized');
          }
          
          console.log(`Getting room data for ${roomCode}`);
          const { data: response, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', roomCode)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            // PGRST116 is the "no rows returned" error, which we handle as "not exists"
            console.error('Error fetching room:', error);
            throw error;
          }
          
          const exists = response !== null;
          console.log(`Room ${roomCode} exists: ${exists}`, response);
          
          return {
            exists: exists,
            data: () => response
          };
        } catch (error) {
          console.error('Error in get operation:', error);
          throw error;
        }
      },
      onSnapshot: (callback, errorCallback) => {
        try {
          // Ensure Supabase is initialized
          if (!supabase && !initializeSupabase()) {
            const initError = new Error('Supabase client is not initialized');
            if (errorCallback) errorCallback(initError);
            return () => {}; // No-op unsubscribe
          }
          
          console.log(`Setting up realtime subscription for room ${roomCode}`);
          
          // First get the initial data
          supabase
            .from('rooms')
            .select('*')
            .eq('id', roomCode)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error('Error fetching initial room data:', error);
                if (errorCallback) errorCallback(error);
                return;
              }
              
              if (data) {
                console.log('Initial room data:', data);
                callback({
                  exists: true,
                  data: () => data
                });
              } else {
                console.log(`Room ${roomCode} not found initially`);
              }
            });
          
          // Then subscribe to changes
          const channelName = `room-${roomCode}-changes`;
          console.log(`Creating channel: ${channelName}`);
          
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
                console.log('Received realtime update:', payload);
                callback({
                  exists: true,
                  data: () => payload.new
                });
              }
            )
            .subscribe((status) => {
              console.log(`Subscription status for ${channelName}:`, status);
            });
          
          // Return unsubscribe function
          return () => {
            console.log(`Unsubscribing from channel ${channelName}`);
            supabase.removeChannel(channel);
          };
        } catch (error) {
          console.error('Error setting up realtime subscription:', error);
          if (errorCallback) errorCallback(error);
          // Return a no-op unsubscribe function
          return () => {};
        }
      }
    };
  }
}; 