const supabase = require('../config/supabase');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.testConnections = async (req, res) => {
  const results = {
    supabase: { status: 'pending', message: '' },
    prisma: { status: 'pending', message: '' }
  };

  // Test 1: Supabase Client (Storage/DB)
  try {
    // Try listing buckets as a generic connectivity test
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    results.supabase = { status: 'success', message: `Connected! Found ${data.length} buckets.` };
  } catch (err) {
    console.error("Supabase Test Failed:", err);
    results.supabase = { status: 'error', message: err.message };
  }

  // Test 2: Prisma (Postgres)
  try {
    const count = await prisma.song.count();
    results.prisma = { status: 'success', message: `Connected! Song count: ${count}` };
  } catch (err) {
    console.error("Prisma Test Failed:", err);
    results.prisma = { status: 'error', message: err.message };
  }

  res.json(results);
};
