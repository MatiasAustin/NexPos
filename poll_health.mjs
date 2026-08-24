async function run() {
    for (let i = 0; i < 20; i++) {
        try {
            const res = await fetch("https://nex-pos-delta.vercel.app/api/health");
            const text = await res.text();
            console.log(text);
            if (text.includes("v2")) break;
        } catch (e) {}
        await new Promise(r => setTimeout(r, 5000));
    }
}
run();
