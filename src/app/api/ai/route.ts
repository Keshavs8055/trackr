import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeaderKey = req.headers.get('x-gemini-api-key');
    const body = await req.json().catch(() => ({}));
    const apiKey = authHeaderKey || body.apiKey;

    // Strict BYOK check - zero server fallbacks allowed
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'BYOK_KEY_REQUIRED',
          message: 'Gemini API key required. Please configure your API key in Settings -> Integrations.',
        },
        { status: 401 }
      );
    }

    const {
      prompt,
      model = 'gemini-1.5-flash',
      temperature = 0.2,
      maxTokens = 1024,
      stream = false,
      responseMimeType,
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Prompt parameter is required.' },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();
    const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${endpoint}?key=${encodeURIComponent(trimmedKey)}${stream ? '&alt=sse' : ''}`;

    const payload: any = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    if (responseMimeType) {
      payload.generationConfig.responseMimeType = responseMimeType;
    }

    if (stream) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json(
          { success: false, message: `Gemini API Error (${response.status}): ${errText}` },
          { status: response.status }
        );
      }

      // Stream chunks using Server-Sent Events / ReadableStream
      const encoder = new TextEncoder();
      const reader = response.body?.getReader();

      const transformStream = new ReadableStream({
        async start(controller) {
          if (!reader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const textChunk = new TextDecoder().decode(value);
              // Forward SSE chunks or standard text
              controller.enqueue(encoder.encode(textChunk));
            }
          } catch (err: any) {
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });

      return new NextResponse(transformStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    } else {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json(
          { success: false, message: `Gemini API Error (${response.status}): ${errText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return NextResponse.json({
        success: true,
        data: textOutput,
        raw: data,
      });
    }
  } catch (error: any) {
    console.error('[API /api/ai] Server error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal AI Server Error' },
      { status: 500 }
    );
  }
}
