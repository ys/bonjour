import { NowRequest, NowResponse } from '@vercel/node'

export default (req: NowRequest, res: NowResponse) => {
  console.log(req)
  res.json({ name: 'John', email: 'john@example.com' })
}
