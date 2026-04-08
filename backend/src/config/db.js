// backend/src/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // This line attempts to connect using the URI from .env
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // The EBADNAME error happens here
        console.error(`Error: ${error.message}`);
        process.exit(1); 
    }
};

export default connectDB;