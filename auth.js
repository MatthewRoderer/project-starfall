// auth.js: Supabase client and basic auth helpers

// From Supabase settings:
const SUPABASE_URL = "https://orgitcfcandvkvqlfqwy.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZ2l0Y2ZjYW5kdmt2cWxmcXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NzYzODcsImV4cCI6MjA3ODQ1MjM4N30.lW0zx8oZGILUxdXGqjOgzkhPrzLai5XQda1rQ-pQkC8"
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function signUpWithEmail(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Signup error:", error.message);
    return { error };
  }

  console.log("Signup success:", data);
  return { data };
}

async function signInWithEmail(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error.message);
    return { error };
  }

  console.log("Login success:", data);
  return { data };
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    console.error("Logout error:", error.message);
  } else {
    console.log("Signed out");
  }
}
