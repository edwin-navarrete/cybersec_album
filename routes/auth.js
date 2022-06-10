const { Router } = require('express');
const router = Router();

const { check } = require('express-validator');
const { validationResult } = require('express-validator');
const { login } = require('../controllers/auth');

// validationResult: extracts the validation errors from a request and makes them available in a Result object.
const validateInput = ( req, res, next ) => {
    console.log("The request", req.body)
    const errors = validationResult(req);
    if( !errors.isEmpty() ){
        return res.status(400).json(errors);
    }

    next();
}

router.post('/login',[
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').not().isEmpty(),
    validateInput
],login );

module.exports = router;
