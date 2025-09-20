import type { Message } from "./ChatComponent";
// 定义回调函数类型
type DataCallback = (chunk: string) => void;
type CompleteCallback = () => void;
type ErrorCallback = (error: Error) => void;
/**
 * SSE 介绍
 * Sever Sent Events (SSE) 是一种服务器向浏览器推送实时更新的技术。它允许服务器通过单个持久连接向客户端发送自动更新的数据流，而无需客户端频繁轮询服务器。
 * 主要特点：
 * 1. 单向通信：SSE 是单向的，服务器可以向客户端发送数据，但客户端不能通过同一连接发送数据回服务器。
 * 2. 轻量级：SSE 使用简单的 HTTP 协议，易于实现和维护。
 * 3. 自动重连：如果连接丢失，浏览器会自动尝试重新连接服务器。
 * 4. 事件驱动：服务器可以发送不同类型的事件，客户端可以根据事件类型进行处理。
 * 5. 适用于实时应用：SSE 非常适合需要实时更新的应用，如新闻推送、股票行情、聊天应用等。
 * SSE 的工作原理：
 * 1. 客户端通过创建一个 EventSource 对象并指定服务器端点来建立连接。
 * 2. 服务器响应一个特殊的 MIME 类型（text/event-stream），并保持连接打开。
 * 3. 服务器通过发送格式化的文本数据流向客户端推送事件。
 * 4. 客户端监听事件并处理接收到的数据。
 * 5. 如果连接断开，浏览器会自动尝试重新连接服务器。
 * 总结：SSE 是一种简单而有效的技术，适用于需要实时数据更新的应用场景。它通过保持持久连接和自动重连机制，确保客户端能够及时接收到服务器推送的最新信息。
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events
 * SSE 前端实现方案：
 * 1. fetch + ReadableStream 它支持自定义 header、token、POST 请求等，兼容性和灵活性更好，适合现代前端框架（React/Vue/Next.js 等）
 * 1. 原生 EventSource API：现代浏览器内置了对 SSE 的支持，可以直接使用 EventSource 对象来建立连接和监听事件。
 * 2. Polyfill 库：对于不支持 SSE 的浏览器，可以使用 polyfill 库（如 event-source-polyfill）来提供兼容性支持。
 * 3. 第三方库：一些 JavaScript 库（如 RxJS）提供了对 SSE 的封装，简化了事件流的处理和管理。
 * 4. axios-eventsource：基于 axios 封装的 SSE 客户端，适合 axios 用户。。
 * 5. reconnecting-eventsource：为 EventSource 增加自动重连功能。
 */

/**
 * 使用 fetch + ReadableStream 实现 Deepseek API 的流式调用
 * 支持自定义 header、POST 请求，推荐用于 Deepseek/OpenAI 等流式接口
 * @param prompt 
 * @param onDataCallback 返回流中解析的新内容
 * @param onCompleteCallback 流式响应全部结束时调用
 * @param onErrorCallback 
 */
export const callDeepseekStream = async (
  messages: Message[],
  prompt: string,
  onDataCallback: DataCallback,
  onCompleteCallback: CompleteCallback,
  onErrorCallback: ErrorCallback
): Promise<void> => {
  try {
    /**
     * 
     API sample as blow(copied from https://api-docs.deepseek.com/zh-cn/api/create-chat-completion ):
     {
      "messages": [
        {
          "content": "介绍如何快速学会AI技术",
          "role": "system"
        },
        {
          "content": "Hi",
          "role": "user"
        }
      ],
      "model": "deepseek-chat",
      "frequency_penalty": 0,
      "max_tokens": 64,
      "presence_penalty": 0,
      "response_format": {
        "type": "text"
      },
      "stop": null,
      "stream": true,
      "stream_options": null,
      "temperature": 1,
      "top_p": 1,
      "tools": null,
      "tool_choice": "none",
      "logprobs": false,
      "top_logprobs": null
    }
     */
    const apiKey = 'sk-6822d6e1271d44f0a7de0b0f97ed08c8';
    const requestData = {
      messages: [
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: prompt }
      ],
      model: "deepseek-chat",
      frequency_penalty: 0,
      max_tokens: 64,
      presence_penalty: 0,
      response_format: {
        type: "text"
      },
      stop: null,
      stream: true,
      stream_options: null,
      temperature: 1,
      top_p: 1,
      tools: null,
      tool_choice: "none",
      logprobs: false,
      top_logprobs: null
    };
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestData),
    });
    if (!response.body) throw new Error('No response body');
    // response.body 是一个 ReadableStream，可以逐步读取服务器推送的数据（而不是等全部返回）。
    // response.body.getReader() 获取 reader，使用 reader.read() 循环读取数据块（chunk）。
    // 每次读取到的数据是 Uint8Array，需要用 TextDecoder 解码为字符串
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read(); // 读取数据块, value 是 Uint8Array
      if (done) break;
      buffer += decoder.decode(value, { stream: true }); // 解码为字符串
      const lines = buffer.split('\n'); // 按行分割处理 SSE 数据
      buffer = lines.pop() || ''; // 保留最后一行（可能不完整），继续累积
      for (const line of lines) { // 逐行处理
        const trimmed = line.trim(); // 去除空白字符
        if (!trimmed || !trimmed.startsWith('data:')) continue; // 只处理 data: 开头的行
        const data = trimmed.replace(/^data:/, '').trim(); // 去除 data: 前缀
        if (data === '[DONE]') { // 流结束
          onCompleteCallback(); // 调用完成回调
          return;
        }
        // data 格式如下 :
        // '{"id":"ffcaab63-81f3-414f-9dcf-ede88ffbd807","object":"chat.completion.chunk","created":1758351327,"model":"deepseek-chat","system_fingerprint":"fp_08f168e49b_prod0820_fp8_kvcache","choices":[{"index":0,"delta":{"role":"assistant","content":""},"logprobs":null,"finish_reason":null}]}'
        try {
          const parsed = JSON.parse(data); // 解析 JSON 数据
          const content = parsed.choices?.[0]?.delta?.content || ''; // 提取文本内容
          if (content) onDataCallback(content); // 调用数据回调
        } catch (e) {
          console.log(e);
        }
      }
    }
    onCompleteCallback();
  } catch (error) {
    const err = error as Error;
    onErrorCallback(err);
  }
};
