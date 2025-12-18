const Joi = require('joi');

// Skema validasi registrasi user
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Skema validasi login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Skema validasi tim
const teamSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
});


// Middleware validasi untuk membuat user
const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
      details: error.details
    });
  }
  
  next();
};

// Middleware validasi untuk login
const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
      details: error.details
    });
  }
  
  next();
};

// Middleware validasi untuk membuat tim
const validateTeam = (req, res, next) => {
  const { error } = teamSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      message: error.details[0].message,
      details: error.details
    });
  }
  
  next();
};

module.exports = {
  validateUser,
  validateLogin,
  validateTeam
};