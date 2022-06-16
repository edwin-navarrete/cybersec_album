import { Request, Response } from 'express'

export const login = async (req: Request, res: Response) => {
  const { password } = req.body

  // Ideally search the user in a database,
  // throw an error if not found.
  if (password !== '1234') {
    return res.status(400).json({
      msg: 'User / Password are incorrect'
    })
  }

  res.json({
    name: 'Test User',
    token: 'A JWT token to keep the user logged in.',
    msg: 'Successful login'
  })
}
