
export const setupSupabaseSchema = async (supabase) => {
  // Create the upsert_sync_metadata function if it doesn't exist
  const { error } = await supabase.rpc('create_upsert_sync_metadata_function');
  
  if (error && error.message !== "function already exists") {
    console.error('Error setting up Supabase schema:', error);
    
    // Try to create the function directly
    try {
      const { error: rpcError } = await supabase.rpc('create_upsert_sync_metadata_function');
      if (rpcError) {
        console.error('Failed to create RPC function:', rpcError);
      }
    } catch (fallbackError) {
      console.error('Fallback schema setup failed:', fallbackError);
    }
  }
};
