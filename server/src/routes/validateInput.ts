import { Request, Response, NextFunction } from 'express'

import { validationResult } from "express-validator"

const validateInput = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('Failed validation for: ', req.body)
      return res.status(400).json(errors)
    }
    next()
  }
  
export default validateInput