async function run() {
    const res = await fetch("https://nex-pos-delta.vercel.app/api/cash-sessions/active?staffId=staff-id-here&terminalId=TERM-01");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
}
run();
