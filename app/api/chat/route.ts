import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { message, tripContext, history } = await req.json()

    if (!message) {
      return NextResponse.json({ error: '訊息不能為空' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API 未設定，請聯絡管理員' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const systemPrompt = `你是一個專業的日本旅遊助理，正在協助一個台灣旅遊團規劃日本行程。
旅程資訊：${JSON.stringify(tripContext)}

回答規則：
- 請用繁體中文回答，提供實用、具體的日本在地建議，優先推薦當地有名的景點與店家
- 餐廳資訊優先參考 Tabelog 評分與口碑，再輔以 Google 評分高的店家
- 景點、逛街店家、住宿資訊優先參考 Google 評分與評論
- 回答要簡潔有重點，可以用條列式，推薦店家時請附上名稱（日文＋中文）與所在區域`

    const chatHistory = Array.isArray(history)
      ? history
          .filter(
            (h: { role: string; content: string }) =>
              h.role === 'user' || h.role === 'assistant'
          )
          .map((h: { role: string; content: string }) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
          }))
      : []

    const chat = model.startChat({
      history: chatHistory,
    })

    const result = await chat.sendMessage(`${systemPrompt}\n\n用戶問題：${message}`)
    const content = result.response.text()

    return NextResponse.json({ content })
  } catch (err) {
    console.error('Gemini API error:', err)
    return NextResponse.json(
      { error: 'AI 助理暫時無法回應，請稍後再試' },
      { status: 500 }
    )
  }
}
