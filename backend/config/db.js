import mongoose from 'mongoose';

// ✅ Track if event handlers are already registered to prevent duplicates
let eventHandlersRegistered = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // ✅ These are the recommended options for production stability
      serverSelectionTimeoutMS: 5000, // Fail fast if DB is unreachable at startup
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // ✅ Only register event handlers once to prevent memory leaks
    if (!eventHandlersRegistered) {
      mongoose.connection.once('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.once('reconnected', () => {
        console.log('✅ MongoDB reconnected.');
      });

      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });

      // Handle process termination gracefully
      process.on('SIGINT', async () => {
        console.log('SIGINT received, closing MongoDB connection...');
        await mongoose.connection.close();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('SIGTERM received, closing MongoDB connection...');
        await mongoose.connection.close();
        process.exit(0);
      });

      eventHandlersRegistered = true;
    }

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;