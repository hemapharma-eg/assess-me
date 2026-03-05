import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmqlljewnhvztrognofu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtcWxsamV3bmh2enRyb2dub2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTkxMTUsImV4cCI6MjA4NzczNTExNX0.1TzZgQrIaQWevKl3a5Ht-27bSi8XPPa6uF7rra5QqhI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('reports').select('*').order('ts', { ascending: false }).limit(3);
  if (error) {
    console.error(error);
  } else {
    data.forEach(r => {
      console.log(`ID: ${r.id}, Title: ${r.title}`);
      console.log(`  Assigned Classes: ${JSON.stringify(r.assigned_classes)}`);
      if (r.responses && r.responses.length > 0) {
        console.log(`  First response: ${JSON.stringify(r.responses[0].answers)}`);
      }
    });
  }
}
run();
