async function run() {
    for (let i = 0; i < 20; i++) {
        try {
            const res = await fetch("https://nex-pos-delta.vercel.app/api/debug-sessions2");
            console.log(res.status);
            const text = await res.text();
            if (res.status === 200 && text.includes("error")) {
                console.log(text);
                break;
            }
        } catch (e) {}
        await new Promise(r => setTimeout(r, 5000));
    }
}
run();
