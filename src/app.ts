import fastify from 'fastify'
import { knexServer } from './database'
import { env } from './env'
import { transactionsRoutes } from './routes/transactions'
import cookie from "@fastify/cookie"

export const app = fastify()

app.register(cookie)

app.register(transactionsRoutes,{
  prefix:'transactions'
})
