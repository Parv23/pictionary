// This script fixes Supabase client initialization
// Check if the Supabase CDN loaded correctly
if (typeof window.supabase === 'undefined') {
  console.error('ERROR: Supabase CDN script not loaded! Cannot continue.');
  // Show error on page if you want
} else {
  console.log('Supabase CDN loaded successfully');
  
  // Make sure createClient is directly accessible for older code
  if (typeof window.createClient === 'undefined') {
    window.createClient = window.supabase.createClient;
    console.log('Exported createClient to global scope for compatibility');
  }
} 