const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.logLogin = async (req, res) => {
  try {
    const { email, userId } = req.body;
    await prisma.loginLog.create({
      data: {
        email: email || null,
        userId: userId || null
      }
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging login:', error);
    res.status(200).json({ success: false }); 
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalLogins = await prisma.loginLog.count();
    const totalSongs = await prisma.song.count();
    
    // Active Users (Approx: unique logins in last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    // Prisma distinct count logic approximation or raw count
    // With SQLite/Postgres simple implementation:
    const recentLogins = await prisma.loginLog.findMany({
       where: { createdAt: { gte: oneDayAgo } },
       select: { email: true, userId: true }
    });
    
    // Count unique emails/userIds
    const uniqueUsers = new Set(recentLogins.map(l => l.email || l.userId).filter(Boolean));
    const activeUsers = uniqueUsers.size;

    // Login Trends (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyLogins = await prisma.loginLog.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        createdAt: true
      }
    });

    const dailyCounts = {};
    // Initialize last 7 days with 0
    for(let i=0; i<7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyCounts[d.toISOString().split('T')[0]] = 0;
    }

    weeklyLogins.forEach(l => {
      const date = l.createdAt.toISOString().split('T')[0];
      if (dailyCounts[date] !== undefined) {
         dailyCounts[date]++;
      }
    });
    
    const chartData = Object.keys(dailyCounts).map(date => ({
      date,
      logins: dailyCounts[date]
    })).sort((a,b) => a.date.localeCompare(b.date));

    // Fallback for demo if empty
    if(totalLogins === 0) {
        // Mock data so the graph isn't empty on first run
        // Or keep it 0. User asked for "visitor trends", seeing 0 is correct but chart should render.
    }

    res.json({
      totalLogins,
      totalSongs,
      activeUsers,
      chartData
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};
