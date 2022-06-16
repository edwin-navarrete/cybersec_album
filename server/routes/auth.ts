import { Router, Request, Response, NextFunction } from 'express'
import { check, validationResult } from 'express-validator'

import { login } from '../controllers/auth'

const router = Router()

// validationResult: extracts the validation errors from a request and makes them available in a Result object.
const validateInput = (req: Request, res: Response, next: NextFunction) => {
  console.log('The request', req.body)
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json(errors)
  }
  next()
}

router.post('/login', [
  check('email', 'Email is required').isEmail(),
  check('password', 'Password is required').not().isEmpty(),
  validateInput
], login)

module.exports = router
