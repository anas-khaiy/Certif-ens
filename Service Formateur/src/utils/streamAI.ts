// SSE AI streaming helper.
// Streams from a backend text/event-stream endpoint, keeping the connection
// alive (no proxy/firewall 504) while Ollama generates on CPU.
// Events: token (string deltas), done (final JSON payload), error (message).
export async function streamAI(
    endpoint: string,
    body: unknown,
    onToken?: (accumulated: string) => void,
    signal?: AbortSignal
): Promise<any> {
    const res = await fetch(endpoint, {
        method: 'POST',
        signal,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify(body)
    });
    if (!res.ok || !res.body) throw new Error(`Erreur ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    let finalPayload: any = null;

    const handleEvent = (rawEvent: string) => {
        let eventName = 'message';
        const dataLines: string[] = [];
        for (const line of rawEvent.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        }
        if (dataLines.length === 0) return;
        let data: any;
        try { data = JSON.parse(dataLines.join('\n')); } catch { data = dataLines.join('\n'); }
        if (eventName === 'token') {
            full += data;
            onToken?.(full);
        } else if (eventName === 'done') {
            finalPayload = data;
        } else if (eventName === 'error') {
            throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
        }
    };

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
            handleEvent(buffer.slice(0, idx));
            buffer = buffer.slice(idx + 2);
        }
    }
    if (buffer.trim()) handleEvent(buffer);
    return finalPayload !== null ? finalPayload : full;
}
