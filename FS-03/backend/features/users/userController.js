const User = require('./userModel');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role
    }, 
    process.env.JWT_SECRET || 'supersecretkey123', 
    { expiresIn: '2h' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    
    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);
    res.status(201).json({ token: token, user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && user.password === password) { 
      const token = generateToken(user);
      res.json({ token: token, user: { id: user._id, name: user.name, email, role: user.role } });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
