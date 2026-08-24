async function run() {
    try {
        const res = await fetch("https://nex-pos-delta.vercel.app/api/debug-sessions");
        console.log(res.status);
        console.log(await res.text());
    } catch (e) { console.log(e); }
}
run();
