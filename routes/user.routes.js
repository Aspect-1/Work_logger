const express = require('express');
const router = express.Router();
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');


//signup route
router.get('/signup', (req, res) => { 
   res.render('signup') 
});

// router.post('/signup',
router.post('/signup',
    body('username').trim().isLength({min: 3}).withMessage('Username must be at least 3 characters long'),
    body('email').trim().isEmail().isLength({min: 12}).withMessage('Invalid email address'),
    body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters long'),    
    async (req,res)=>{

        const errors = validationResult(req)
        if(!errors.isEmpty()){
            return res.status(400).json({
                errors: errors.array(),
                message: 'Invalid data'
            })
        }

        const {username, email, password} = req.body
        try{
            const existinguser = await userModel.findOne({email})
            if(existinguser){
                return res.status(400).json({ message: 'User already exists with this email' })
            }
            const hashedPassword = await bcrypt.hash(password, 10); 
            const newUser = await userModel.create({
                username,
                email,
                password: hashedPassword
            });

            return res.redirect('/user/login?message=Account created successfully');
 
        }
        catch (err) {
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
});



//login route
router.get('/login', (req, res) => {
  const message = req.query.message;
  res.render('login', { message });
});


router.post('/login',
    body('username').trim().isLength({min:3}),
    body('password').trim().isLength({min:5}),
    async (req,res)=>{

        const errors = validationResult(req)
        
        if(!errors.isEmpty()){
            return res.status(400).json({
                errors: errors.array(),
                message: 'Invalid data'
            })
        }

        const {username,password}=req.body;
        
        const user = await userModel.findOne({
            username: username
        })
        if(!user){
            return res.status(400).json({
                message: 'username or password is incorrect'
            })
        }

        const ismatch = await bcrypt.compare(password,user.password)
        if(!ismatch){
            return res.status(400).json({
                message: 'username or password is incorrect'
            })
        }

        const token = jwt.sign({
            userid: user._id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin
        },
        process.env.JWT_SECRET)

        res.cookie('token',token)
        
        return res.redirect('/dashboard?message=Logged in successfully');
    }
)

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  const message = encodeURIComponent('Logged out successfully');
  res.redirect(`/user/login?message=${message}`);
});




module.exports = router;