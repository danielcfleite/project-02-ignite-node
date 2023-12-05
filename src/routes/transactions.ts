import { FastifyInstance } from "fastify"
import {z} from 'zod'
import { knexServer } from "../database"
import { randomUUID } from "crypto"
import { checkSessionIdExists } from "../middlewares/check-session-id-exists"

export async function transactionsRoutes(app: FastifyInstance){
    app.addHook('preHandler', async(request, reply)=>{
        console.log(`[${request.method} ] ${request.url}`)
    })
    
    app.get("/", {
        preHandler: [checkSessionIdExists]
    } ,async(request, reply) =>{
        const {sessionId} = request.cookies
        const transactions = await knexServer('transactions').where('session_id', sessionId)

        return {
            transactions
        }
    })

    app.get('/summary', {
        preHandler: [checkSessionIdExists]
    } , async(request)=>{
        const {sessionId} = request.cookies
        const summary = await knexServer ('transactions')
        .where('session_id', sessionId)
        .sum('amount', {as:'amount'})
        .first()

        return {summary}
    })
    
    app.get('/:id', {
        preHandler: [checkSessionIdExists]
    } ,async(request)=>{
        const creatGetTransactionParamsSchema = z.object({
          id: z.string().uuid()
        })
        
        const {id} = creatGetTransactionParamsSchema.parse(request.params)
        
        const { sessionId } = request.cookies

        const transaction = await knexServer('transactions').where({
            session_id : sessionId,
            id})
            .first()

        return {transaction}
    })
    
    app.post('/', async (request, reply) => {


        const creatTransactionBodySchema = z.object({
            title: z.string(), 
            amount: z.number(),
            type: z.enum(['credit', 'debit']),

        })
        const {title, amount, type } = creatTransactionBodySchema.parse(request.body)

        let sessionId = request.cookies.sessionId

        if (!sessionId) {
            sessionId = randomUUID()
      
            reply.setCookie('sessionId', sessionId, {
              path: '/',
              maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            })
          } 

       await knexServer('transactions').insert({
            id: crypto.randomUUID(),
            title, 
            amount: type === 'credit' ? amount : amount *-1,
            session_id: sessionId
        })

        return reply.status(201).send()

       })
}