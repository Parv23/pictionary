// Supabase configuration
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-anon-key';

// Initialize Supabase client
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Export database for use in other files
const roomsCollection = {
  doc: (roomCode) => {
    return {
      set: async (data) => {
        return await supabase
          .from('rooms')
          .insert([{ ...data, id: roomCode }]);
      },
      update: async (data) => {
        return await supabase
          .from('rooms')
          .update(data)
          .eq('id', roomCode);
      },
      get: async () => {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomCode)
          .single();
        
        return {
          exists: data !== null,
          data: () => data
        };
      },
      onSnapshot: (callback, errorCallback) => {
        const subscription = supabase
          .from('rooms')
          .on('*', payload => {
            if (payload.new && payload.new.id === roomCode) {
              callback({
                exists: true,
                data: () => payload.new
              });
            }
          })
          .subscribe();
        
        // Return unsubscribe function
        return () => {
          supabase.removeSubscription(subscription);
        };
      }
    };
  }
}; 