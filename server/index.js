import 'dotenv/config'
import { createApp } from './app.js'

const port = Number.parseInt(process.env.PORT || '3001', 10)
const app = createApp()

app.listen(port, () => {
  console.log(`Agent server listening on http://localhost:${port}`)
})
