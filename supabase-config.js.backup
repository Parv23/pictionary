// Supabase configuration
const supabaseUrl = 'https://lqkshowfqzzqljbjczzy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxa3Nob3dmcXp6cWxqYmpjenp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MjcwOTYsImV4cCI6MjA2MTQwMzA5Nn0.ses8AGMrrfRWiiLwpg1KCD-iRLD4PxpgPYB9YxaoHpk';

// Initialize Supabase client
let supabase;
try {
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

// Export database for use in other files
// No change to how other files access this - they'll still use roomsCollection
const roomsCollection = {
  doc: (roomCode) => {
    return {
      set: async (data) => {
        try {
          const { data: response, error } = await supabase
            .from('rooms')
            .insert([{ ...data, id: roomCode }]);
          
          if (error) throw error;
          return response;
        } catch (error) {
          console.error('Error creating room:', error);
          throw error;
        }
      },
      update: async (data) => {
        try {
          console.log(`Updating room ${roomCode} with data:`, data);
          const { data: response, error } = await supabase
            .from('rooms')
            .update(data)
            .eq('id', roomCode);
          
          if (error) throw error;
          console.log('Update successful:', response);
          return response;
        } catch (error) {
          console.error('Error updating room:', error);
          throw error;
        }
      },
      get: async () => {
        try {
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