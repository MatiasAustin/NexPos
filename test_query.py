import os
import json
import urllib.request

env = {}
with open(".env", "r") as f:
    for line in f:
        if "=" in line:
            k, v = line.strip().split("=", 1)
            env[k] = v

SUPABASE_URL = env.get("VITE_SUPABASE_URL") or env.get("SUPABASE_URL")
SUPABASE_KEY = env.get("VITE_SUPABASE_ANON_KEY") or env.get("SUPABASE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

url = f"{SUPABASE_URL}/rest/v1/order_items?select=quantity,price_at_time,created_at,transactions(order_reference,staff_name)&limit=1"

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print(e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
