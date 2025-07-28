import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import colors from 'colors';

dotenv.config();

// Set colors theme
colors.setTheme({
  info: 'green',
  error: 'red',
  warn: 'yellow'
});

const PORT = process.env.PORT || 3333;

// Connect to database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.info);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...'.error);
  console.error(err.name, err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...'.error);
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully'.warn);
  server.close(() => {
    console.log('💥 Process terminated!'.error);
  });
});
