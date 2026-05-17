module.exports = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',

  jwt: {
    secret:         process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn:      process.env.JWT_EXPIRES_IN || '7d',
    staffExpiresIn: process.env.JWT_STAFF_EXPIRES_IN || '12h',
  },

  line: {
    channelId:     process.env.LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    redirectUri:   process.env.LINE_REDIRECT_URI || 'http://localhost:4000/auth/line/callback',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  },
};
