import bcrypt from 'bcryptjs';
import dbConnect from '../src/lib/43432';
import User from '../src/models/User';

async function hashPasswords() {
  try {
    await dbConnect();
    const users = await User.find({ password: { $not: /^\$2[aby]\$\d+\$/ } });
    
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      console.log(`Updated password for user: ${user.email}`);
    }
    
    console.log('Password hashing complete');
    process.exit(0);
  } catch (error) {
    console.error('Error hashing passwords:', error);
    process.exit(1);
  }
}

hashPasswords();