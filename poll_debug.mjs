async function run() {
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch("https://nex-pos-delta.vercel.app/api/debug-sessions");
            const text = await res.text();
            if (res.status === 200 && text.startsWith("[")) {
                console.log(text);
                break;
            }
        } catch (e) {}
        await new Promise(r => setTimeout(r, 5000));
    }
}
run();
